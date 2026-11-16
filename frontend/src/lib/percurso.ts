// Navegação "imersiva" entre as páginas do menu, que ficam lado a lado (PAGINAS_EM_ORDEM):
//   - indo para uma página a duas ou mais posições (HOME → CONTATO), a tela passa por cada página do
//     meio (HOME → CATÁLOGO → CONTATO), em etapas encadeadas: a primeira acelera, as do meio seguem
//     em velocidade constante e a última freia, para parecer um arrasto só (styles.css);
//   - clicando no link da página em que já se está, a página rola de volta ao topo.
// A rolagem de cada página fica guardada pelo router (getScrollRestorationKey no router.tsx): voltar
// a uma página a deixa onde estava; as páginas do meio também aparecem onde estavam.
// Funciona para qualquer link da loja (menu, rodapé, textos), por um ouvinte de cliques no documento.
// Voltar e avançar do navegador fazem o arrasto direto, sem as páginas do meio.
import type { AnyRouter } from "@tanstack/react-router";
import { PAGINAS_EM_ORDEM, posicaoDaPagina } from "@/components/layout/navegacao";

/** Tipos de View Transition de cada etapa (as durações e curvas estão no styles.css). */
type Etapa = "etapa-inicio" | "etapa-meio" | "etapa-fim";

/** Quanto esperar, no máximo, pelo fim do arrasto de uma etapa antes de seguir para a próxima. */
const LIMITE_DA_ETAPA_MS = 1500;

let andando = false;

/** Espera as animações da View Transition em curso terminarem (ou o limite, se algo travar). */
async function fimDoArrasto(): Promise<void> {
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  const arrastos = document
    .getAnimations()
    .filter((a) => {
      const efeito = a.effect as KeyframeEffect | null;
      return efeito?.pseudoElement?.startsWith("::view-transition") ?? false;
    })
    .map((a) => a.finished.catch(() => undefined));
  await Promise.race([
    Promise.all(arrastos),
    new Promise((r) => setTimeout(r, LIMITE_DA_ETAPA_MS)),
  ]);
}

/**
 * Duração do percurso inteiro: 0,8 s mais 0,12 s por página a mais, até 1,15 s. Quanto mais longe,
 * mais rápida cada etapa, sem o percurso ficar demorado. Cada ponta (a que acelera e a que freia)
 * dura o dobro de uma etapa do meio, para a velocidade casar nas juntas (styles.css).
 */
function duracoes(etapas: number): { ponta: number; meio: number } {
  const total = Math.min(0.8 + 0.12 * (etapas - 1), 1.15);
  const meio = total / (etapas + 2);
  return { ponta: 2 * meio, meio };
}

/** Carrega antes as páginas do caminho, para nenhuma etapa parar esperando dados (até 600 ms). */
async function carregarAntes(router: AnyRouter, etapas: string[]): Promise<void> {
  const cargas = etapas.map((href) =>
    router
      .preloadRoute({ to: href.split("?")[0] } as Parameters<AnyRouter["preloadRoute"]>[0])
      .catch(() => undefined),
  );
  await Promise.race([Promise.all(cargas), new Promise((r) => setTimeout(r, 600))]);
}

/** Vai de uma página do menu a outra passando pelas do meio. */
async function percorrer(router: AnyRouter, destino: string, de: number, para: number) {
  andando = true;
  const direcao = para > de ? "para-frente" : "para-tras";
  const passo = para > de ? 1 : -1;
  const etapas: string[] = [];
  for (let i = de + passo; i !== para; i += passo) etapas.push(PAGINAS_EM_ORDEM[i]!.to);
  etapas.push(destino);
  const { ponta, meio } = duracoes(etapas.length);
  const raiz = document.documentElement.style;
  raiz.setProperty("--etapa-ponta", `${ponta.toFixed(3)}s`);
  raiz.setProperty("--etapa-meio", `${meio.toFixed(3)}s`);
  try {
    await carregarAntes(router, etapas);
    for (const [k, href] of etapas.entries()) {
      const etapa: Etapa =
        k === 0 ? "etapa-inicio" : k === etapas.length - 1 ? "etapa-fim" : "etapa-meio";
      // só a primeira etapa entra no histórico: "voltar" leva de CONTATO direto para a HOME
      await router.navigate({ href, replace: k > 0, viewTransition: { types: [direcao, etapa] } });
      if (k < etapas.length - 1) await fimDoArrasto();
    }
  } finally {
    andando = false;
    raiz.removeProperty("--etapa-ponta");
    raiz.removeProperty("--etapa-meio");
  }
}

/**
 * Liga o percurso e o "voltar ao topo" nos cliques de links da loja. Devolve a função que desliga.
 * O ouvinte roda na fase de captura, antes do Link do router: quando decide, o Link nem é acionado.
 */
export function instalarPercurso(router: AnyRouter): () => void {
  const aoClicar = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;
    const link = (e.target as Element | null)?.closest?.("a[href]");
    if (
      !(link instanceof HTMLAnchorElement) ||
      link.target === "_blank" ||
      link.hasAttribute("download")
    )
      return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.hash) return;

    // no meio de um percurso, os outros cliques em links esperam ele terminar
    if (andando) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // o link da página em que já se está: volta ao topo (e só aplica os filtros, se mudaram)
    if (url.pathname === location.pathname) {
      e.preventDefault();
      e.stopPropagation();
      if (url.search !== location.search)
        void router.navigate({ href: url.pathname + url.search, resetScroll: false });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const de = posicaoDaPagina(location.pathname);
    const para = posicaoDaPagina(url.pathname);
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (de < 0 || para < 0 || Math.abs(para - de) < 2 || reduzido) return;

    e.preventDefault();
    e.stopPropagation();
    void percorrer(router, url.pathname + url.search, de, para);
  };
  document.addEventListener("click", aoClicar, true);
  return () => document.removeEventListener("click", aoClicar, true);
}
