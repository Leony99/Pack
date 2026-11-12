import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Newspaper } from "lucide-react";
import moletom from "@/assets/product-hoodie.jpg";
import regata from "@/assets/product-tank.jpg";
import { noticias } from "@/data/noticias";
import type { Product } from "@/data/types";
import { useGsap } from "@/hooks/useGsap";
import { abertura } from "@/lib/abertura";
import { gsap, SplitText } from "@/lib/movimento";

/** Espaço do menu solto (MenuFlutuante), que fica por cima do topo da página. */
const ESPACO_DO_MENU = "h-[42px] shrink-0 md:h-[50px]";
/** Os cards, soltos da foto por uma sombra, como o menu. */
const CARD = "shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)]";

/**
 * Topo da home: a foto do atleta ocupa a tela, centralizada e alinhada pelo topo (para não cortar
 * a cabeça), e os elementos ficam nas laterais.
 * O menu não fica aqui: é o MenuFlutuante, solto por cima de todas as páginas, e as colunas
 * guardam o espaço dele no topo.
 *   Esquerda: o nome PACK (na fonte do logo), o texto e dois cards com foto de roupa (a coleção,
 *   com o VER COLEÇÃO, e o último drop).
 *   Direita: a data e a hora, o card de notícias e uma frase.
 * É a continuação do pré-loader: ele termina com esta mesma foto aberta e, quando avisa
 * (`abertura`), os blocos das laterais sobem e as letras de PACK aparecem. Sem pré-loader
 * (voltando pelo site ou com "reduzir movimento"), tudo já aparece pronto.
 * No celular, ficam só o PACK, o texto e os dois cards, embaixo.
 */
export function HeroSection({
  imagem,
  retrato,
  drop,
}: {
  imagem: string;
  retrato: string;
  drop: Product[];
}) {
  const ref = useGsap<HTMLElement>((el) => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      if (abertura.feita()) return;
      const blocos = el.querySelectorAll("[data-entra]");
      const divisao = SplitText.create(el.querySelectorAll("[data-titulo]"), {
        type: "chars",
        mask: "chars",
      });
      const letras = divisao.chars;
      // escondidos atrás do pré-loader até ele avisar que terminou
      gsap.set(blocos, { autoAlpha: 0, y: 28 });
      gsap.set(letras, { yPercent: 110 });
      return abertura.aoConcluir(() => {
        // no fim, as letras voltam a ser texto normal: as máscaras cortam a base das letras
        gsap
          .timeline({ onComplete: () => divisao.revert() })
          .to(blocos, { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.07 })
          .to(letras, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.025 }, 0.1);
      });
    });
    return () => mm.revert();
  });

  return (
    <section
      ref={ref}
      className="relative -mt-[74px] h-[100svh] min-h-[600px] overflow-hidden bg-ink text-paper md:-mt-[98px]"
    >
      {/* a foto: a mesma do pré-loader, no mesmo lugar (no celular, a vertical) */}
      <picture>
        <source media="(max-width: 767px)" srcSet={retrato} />
        <img
          src={imagem}
          alt="Atleta de costas, de camisa de compressão preta, numa academia escura"
          fetchPriority="high"
          width={1376}
          height={768}
          className="absolute inset-0 h-full w-full object-cover object-top grayscale contrast-125"
        />
      </picture>
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/30" />
      {/* as laterais um pouco mais escuras, para o texto se destacar da foto */}
      <div className="absolute inset-0 hidden bg-gradient-to-r from-ink/80 via-transparent to-ink/80 md:block" />

      <div className="relative z-10 grid h-full grid-cols-1 gap-6 p-4 md:grid-cols-[minmax(300px,1fr)_minmax(0,1.3fr)_minmax(260px,1fr)] md:p-6">
        <ColunaEsquerda drop={drop} />
        <div aria-hidden className="hidden items-end justify-center pb-2 md:flex">
          <p data-entra className="text-[10px] tracking-[0.3em] text-paper/50">
            [ ROLE PARA VER MAIS ]
          </p>
        </div>
        <ColunaDireita />
      </div>
    </section>
  );
}

/**
 * Abaixo do espaço do menu: o título, o texto e dois cards de foto lado a lado (a coleção, que faz
 * as vezes do botão VER COLEÇÃO, e o novo drop).
 */
function ColunaEsquerda({ drop }: { drop: Product[] }) {
  return (
    <div className="flex min-h-0 flex-col">
      <div aria-hidden className={ESPACO_DO_MENU} />

      {/* nome e texto: no meio da coluna no computador, embaixo no celular */}
      <div className="mt-auto md:my-auto">
        {/* o nome da marca na fonte do logo (Anton, letras espaçadas); a margem negativa tira o
            espaço que o espaçamento deixa depois do K */}
        <h1 className="relative inline-block font-display text-[24vw] leading-[0.9] tracking-[0.3em] md:text-[clamp(5rem,8.8vw,9.35rem)]">
          <span data-titulo className="-mr-[0.3em] block">
            PACK
          </span>
          <sup
            data-entra
            className="absolute left-[calc(100%+0.5rem)] top-1 font-sans text-xs font-normal tracking-widest text-paper/60 max-md:hidden"
          >
            [01]
          </sup>
        </h1>

        <p
          data-entra
          className="mt-6 flex items-center gap-2 text-[10px] tracking-[0.3em] text-paper/60"
        >
          <span className="h-1.5 w-1.5 bg-destaque" /> [ SOBRE ]
        </p>
        <p data-entra className="mt-2 max-w-xs text-sm leading-relaxed text-paper/75">
          Performance técnica pura. Sem distrações. A essência do movimento em silêncio.
        </p>
      </div>

      <div className="mt-6 grid w-full max-w-[340px] grid-cols-2 gap-2.5">
        <CardFoto
          to="/catalogo"
          foto={moletom}
          rotulo="COLEÇÃO"
          titulo={
            <>
              CASUAL
              <br />+ TREINO
            </>
          }
          acao="VER COLEÇÃO"
        />
        <CardFoto
          to="/colecao/$slug"
          params={{ slug: "drop-02" }}
          foto={drop[0]?.image ?? regata}
          rotulo={
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping bg-destaque opacity-60 motion-reduce:animate-none" />
                <span className="relative h-2 w-2 bg-destaque" />
              </span>
              ÚLTIMO DROP
            </span>
          }
          titulo={
            <>
              PRETO
              <br />+ BRANCO
            </>
          }
          acao="VER DROP"
        />
      </div>
    </div>
  );
}

/**
 * Card com foto de roupa ao fundo: o rótulo em cima, título e a faixa branca de ação embaixo
 * (com o fundo laranja que sobe ao passar o mouse). A altura cresce em telas mais altas.
 */
function CardFoto({
  to,
  params,
  foto,
  rotulo,
  titulo,
  acao,
}: {
  to: "/catalogo" | "/colecao/$slug";
  params?: { slug: string };
  foto: string;
  rotulo: ReactNode;
  titulo: ReactNode;
  acao: string;
}) {
  const conteudo = (
    <>
      <img
        src={foto}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover opacity-50 grayscale transition duration-500 group-hover:scale-105 group-hover:opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-ink/40" />
      <div className="relative flex items-center gap-2 text-[10px] tracking-[0.2em] text-paper/80">
        {rotulo}
      </div>
      <div className="relative">
        <p className="font-display text-xl leading-[0.95] tracking-wide md:text-[1.35rem]">
          {titulo}
        </p>
        <span className="relative mt-2.5 flex items-center justify-between overflow-hidden bg-paper px-2.5 py-2 text-[10px] font-medium tracking-[0.2em] text-ink transition-colors duration-300 group-hover:text-destaque-foreground md:text-[11px]">
          <span className="relative z-10">{acao}</span>
          <ArrowUpRight className="relative z-10 h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          <span className="absolute inset-0 translate-y-full bg-destaque transition-transform duration-300 group-hover:translate-y-0" />
        </span>
      </div>
    </>
  );
  const classe = `${CARD} group relative flex h-[150px] min-w-0 flex-col justify-between overflow-hidden bg-ink p-2.5 md:h-[150px] md:[@media(min-height:760px)]:h-[190px]`;

  return to === "/catalogo" ? (
    <Link data-entra to="/catalogo" className={classe}>
      {conteudo}
    </Link>
  ) : (
    <Link data-entra to="/colecao/$slug" params={params ?? { slug: "" }} className={classe}>
      {conteudo}
    </Link>
  );
}

/**
 * Abaixo do espaço do menu (só no computador): a data e a hora, o card de notícias e uma frase.
 */
function ColunaDireita() {
  return (
    <div className="hidden min-h-0 flex-col items-end md:flex">
      <div aria-hidden className={ESPACO_DO_MENU} />
      <Relogio />

      {/* notícias da loja (data/noticias.ts); em telas baixas, só as duas primeiras */}
      <section
        data-entra
        aria-label="Notícias"
        className={`${CARD} mt-6 w-full max-w-[280px] border border-paper/15 bg-ink/60 p-4 backdrop-blur-md`}
      >
        <p className="flex items-center gap-2 text-[10px] tracking-[0.2em]">
          <Newspaper className="h-3.5 w-3.5" /> NOTÍCIAS
        </p>
        <ul className="mt-3">
          {noticias.map((noticia, i) => (
            <li
              key={noticia.titulo}
              className={`grid grid-cols-[3.25rem_1fr] gap-2 border-t border-paper/15 py-2.5 first:border-t-0 ${
                i >= 2 ? "hidden [@media(min-height:760px)]:grid" : ""
              }`}
            >
              <span className="pt-px text-[10px] tracking-[0.15em] text-paper/50">
                {noticia.data}
              </span>
              <span className="text-xs leading-snug text-paper/85">{noticia.titulo}</span>
            </li>
          ))}
        </ul>
      </section>

      <p data-entra className="mt-auto text-right text-2xl leading-tight lg:text-3xl">
        Sem logos, sem ruído
        <br />
        <span className="text-paper/50">+ só o essencial</span>
      </p>
    </div>
  );
}

/** "Terça / 14:32 — 11 nov 2026" */
function textoDaData(agora: Date): string {
  const dia = agora.toLocaleDateString("pt-BR", { weekday: "long" }).replace("-feira", "");
  const hora = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const data = agora
    .toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })
    .replace(/ de /g, " ")
    .replace(".", "");
  return `${dia} / ${hora} — ${data}`;
}

/**
 * Dia, hora e data de agora. Só aparece no navegador (no servidor a hora seria outra e o React
 * acusaria diferença) e se atualiza a cada 20 segundos.
 */
function Relogio() {
  const [agora, setAgora] = useState<Date | null>(null);
  useEffect(() => {
    setAgora(new Date());
    const id = window.setInterval(() => setAgora(new Date()), 20_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <p data-entra className="mt-4 text-[11px] capitalize tracking-wider text-paper/60">
      {agora ? textoDaData(agora) : " "}
    </p>
  );
}
