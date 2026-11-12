import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import lifestyle from "@/assets/lifestyle.jpg";
import { PAGINAS_EM_ORDEM, posicaoDaPagina } from "./navegacao";

/** Rótulo pequeno e espaçado, o mesmo do topo da home ("[ SOBRE ]"). */
export const ROTULO = "text-[10px] font-medium tracking-[0.3em]";
/** Entrada dos blocos do topo: sobem e aparecem, um depois do outro (atraso em cada um). */
const ENTRA =
  "duration-700 ease-out fill-mode-both motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4";
/** Sombra que solta os cards e o menu do fundo. */
export const SOMBRA = "shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)]";

/**
 * Topo das páginas internas, no visual do topo da home: fundo preto com uma foto de roupa
 * apagada, o caminho em rótulo ("■ [ SUPORTE / FAQ ]"), o título grande em Anton com o número da
 * página ("[05]") e, à direita, cards de aviso (`lado`).
 * Ao abrir a página, o rótulo, o título, o texto e os cards sobem em sequência.
 * Ele sobe por baixo do menu solto (margem negativa do tamanho do espaço do menu, no __root.tsx).
 */
export function PaginaTopo({
  caminho,
  titulo,
  texto,
  imagem = lifestyle,
  lado,
}: {
  caminho: string;
  titulo: ReactNode;
  texto?: ReactNode;
  imagem?: string;
  lado?: ReactNode;
}) {
  // a rota já resolvida: durante o arrasto, a página que sai continua com o próprio número
  const rota = useRouterState({
    select: (s) => (s.resolvedLocation ?? s.location).pathname,
  });
  const posicao = posicaoDaPagina(rota);
  const pagina = posicao >= 0 ? PAGINAS_EM_ORDEM[posicao] : undefined;

  return (
    <section className="relative -mt-[74px] overflow-hidden bg-ink text-paper md:-mt-[98px]">
      <img
        src={imagem}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-30 grayscale contrast-125"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />

      <div className="relative px-4 pb-8 pt-[88px] md:px-6 md:pb-10 md:pt-[116px]">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="min-w-0">
            <p className={`${ROTULO} ${ENTRA} flex items-center gap-2 text-paper/60`}>
              <span className="h-1.5 w-1.5 bg-destaque" /> [ {caminho} ]
            </p>
            <h1
              style={{ animationDelay: "80ms" }}
              className={`relative mt-4 inline-block max-w-full break-words pr-10 font-display text-[clamp(2.75rem,12vw,4rem)] uppercase leading-[0.92] tracking-[0.04em] md:text-[clamp(4rem,7vw,6.5rem)] ${ENTRA}`}
            >
              {titulo}
              {pagina && (
                <sup className="absolute right-0 top-1 font-sans text-xs font-normal tracking-widest text-paper/60">
                  [{pagina.numero}]
                </sup>
              )}
            </h1>
            {texto && (
              <p
                style={{ animationDelay: "160ms" }}
                className={`mt-5 max-w-md text-sm leading-relaxed text-paper/70 ${ENTRA}`}
              >
                {texto}
              </p>
            )}
          </div>
          {lado && (
            <div
              style={{ animationDelay: "240ms" }}
              className={`flex flex-wrap gap-3 md:justify-end ${ENTRA}`}
            >
              {lado}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Card de aviso do topo das páginas: branco (ou escuro, `escuro`), com rótulo, um valor grande e um
 * texto curto. Com `to`, vira link, com a seta no canto.
 */
export function CardAviso({
  rotulo,
  valor,
  texto,
  escuro = false,
  to,
}: {
  rotulo: string;
  valor: ReactNode;
  texto?: ReactNode;
  escuro?: boolean;
  to?: "/suporte/contato" | "/suporte/faq" | "/suporte/tamanhos" | "/catalogo";
}) {
  const classe = `${SOMBRA} group relative flex w-[calc(50%-0.375rem)] min-w-[150px] flex-col justify-between p-4 md:w-[200px] ${
    escuro ? "border border-paper/15 bg-ink/60 text-paper backdrop-blur-md" : "bg-paper text-ink"
  }`;
  const conteudo = (
    <>
      <span className={`${ROTULO} flex items-center justify-between gap-2 opacity-60`}>
        {rotulo}
        {to && (
          <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        )}
      </span>
      <span className="mt-4 block font-display text-3xl leading-none tracking-wide">{valor}</span>
      {texto && <span className="mt-1.5 block text-xs leading-snug opacity-60">{texto}</span>}
    </>
  );
  return to ? (
    <Link to={to} className={classe}>
      {conteudo}
    </Link>
  ) : (
    <div className={classe}>{conteudo}</div>
  );
}
