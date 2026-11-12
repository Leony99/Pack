import { useState } from "react";
import { useGsap } from "@/hooks/useGsap";
import { abertura } from "@/lib/abertura";
import { CURVA, gsap, ScrollTrigger, SplitText } from "@/lib/movimento";

/** A janela da foto antes de abrir: estreita no meio (computador) ou mais larga (celular). */
const JANELA = { computador: "inset(14% 36% 14% 36%)", celular: "inset(22% 16% 26% 16%)" };

/** Teclas que rolam a página, travadas durante a abertura */
const TECLAS_DE_ROLAGEM = new Set([
  " ",
  "PageDown",
  "PageUp",
  "ArrowDown",
  "ArrowUp",
  "Home",
  "End",
]);

/**
 * Abertura da home, por cima de tudo (z-[60], acima do cabeçalho e da gaveta do carrinho). Roda
 * sozinha ao carregar a página, sem precisar rolar:
 *   1. a janela da foto abre do centro até uma faixa estreita e as letras de "NO LOGOS" e
 *      "JUST WORK." sobem uma a uma;
 *   2. depois de uma pausa curta, a janela se abre até ocupar a tela, a foto se afasta e as
 *      frases saem para os lados;
 *   3. a camada some num fade rápido. A foto aberta é a mesma, no mesmo lugar, do fundo do topo
 *      da home, então ela "fica": só os elementos das laterais aparecem (avisados por
 *      `abertura.concluir()`).
 * Enquanto roda, a rolagem fica travada. Só roda quando a visita começa pela home, e uma vez:
 * não volta ao navegar pelo site, só ao recarregar. Para quem pediu menos movimento no sistema, ela nem aparece (motion-reduce).
 */
export function PreLoader({ imagem, retrato }: { imagem: string; retrato: string }) {
  const [ativo, setAtivo] = useState(() => !abertura.feita());

  const ref = useGsap<HTMLDivElement>((el) => {
    const mm = gsap.matchMedia();
    mm.add(
      { movimento: "(prefers-reduced-motion: no-preference)", celular: "(max-width: 767px)" },
      (contexto) => {
        const { movimento, celular } = contexto.conditions as Record<string, boolean>;
        if (!movimento) return;
        const moldura = el.querySelector("[data-moldura]");
        const foto = el.querySelector("[data-foto]");
        const linhaA = el.querySelector("[data-linha-a]");
        const linhaB = el.querySelector("[data-linha-b]");
        const letras = SplitText.create([linhaA, linhaB], { type: "chars", mask: "chars" }).chars;

        // trava a rolagem enquanto roda (sem overflow: hidden, que faria a barra de rolagem
        // sumir e a página pular de largura)
        const travar = (e: Event) => e.preventDefault();
        const travarTecla = (e: KeyboardEvent) => {
          if (TECLAS_DE_ROLAGEM.has(e.key)) e.preventDefault();
        };
        window.addEventListener("wheel", travar, { passive: false });
        window.addEventListener("touchmove", travar, { passive: false });
        window.addEventListener("keydown", travarTecla);
        const destravar = () => {
          window.removeEventListener("wheel", travar);
          window.removeEventListener("touchmove", travar);
          window.removeEventListener("keydown", travarTecla);
        };

        // O clip-path vai sempre com fromTo e os quatro valores: o navegador simplifica o inset()
        // que devolve (ex.: "inset(50%)") e o GSAP interpolaria números desencontrados
        gsap
          .timeline({
            onComplete: () => {
              destravar();
              setAtivo(false);
              ScrollTrigger.refresh();
            },
          })
          // 1. a janela abre do centro e as letras sobem
          .fromTo(
            moldura,
            { clipPath: "inset(50% 50% 50% 50%)" },
            { clipPath: celular ? JANELA.celular : JANELA.computador, duration: 1.6, ease: CURVA },
          )
          .fromTo(foto, { scale: 1.7 }, { scale: 1.25, duration: 2, ease: "expo.out" }, 0)
          .from(letras, { yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.03 }, 0.35)
          // 2. depois de uma pausa, a janela ocupa a tela e as frases saem para os lados
          .addLabel("abrir", 2.1)
          .fromTo(
            moldura,
            { clipPath: celular ? JANELA.celular : JANELA.computador },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: CURVA, immediateRender: false },
            "abrir",
          )
          .to(foto, { scale: 1, duration: 1.5, ease: "expo.inOut" }, "abrir")
          .to(linhaA, { xPercent: -60, opacity: 0, duration: 1, ease: "power2.in" }, "abrir")
          .to(linhaB, { xPercent: 60, opacity: 0, duration: 1, ease: "power2.in" }, "abrir")
          // 3. a camada some e os elementos do topo da home aparecem nas laterais
          .call(abertura.concluir, [], "abrir+=1.3")
          .to(el, { autoAlpha: 0, duration: 0.6, ease: "power2.out" }, "abrir+=1.3");

        // saiu da página no meio da abertura: devolve a rolagem
        return destravar;
      },
    );
    return () => mm.revert();
  });

  if (!ativo) return null;

  return (
    <div
      ref={ref}
      aria-hidden
      className="fixed inset-0 z-[60] overflow-hidden bg-ink text-paper motion-reduce:hidden"
    >
      <div data-moldura className="absolute inset-0 [clip-path:inset(50%_50%_50%_50%)]">
        <div data-foto className="absolute inset-0 scale-125">
          {/* no celular (tela em pé), a foto vertical de corpo inteiro; no computador, a da academia */}
          <picture>
            <source media="(max-width: 767px)" srcSet={retrato} />
            <img
              src={imagem}
              alt=""
              fetchPriority="high"
              width={1376}
              height={768}
              className="h-full w-full object-cover object-top grayscale contrast-125"
            />
          </picture>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/30" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 font-display uppercase leading-[0.85]">
        <p
          data-linha-a
          className="absolute left-6 top-[13%] text-[19vw] md:top-[5%] md:text-[11vw]"
        >
          No logos
        </p>
        <p
          data-linha-b
          className="text-outline-light absolute bottom-[24%] right-6 text-[19vw] md:bottom-[17%] md:text-[11vw]"
        >
          Just work.
        </p>
      </div>
    </div>
  );
}
