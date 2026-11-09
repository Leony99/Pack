import { useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useScrollY } from "@/hooks/useScrollY";

/**
 * Destaque principal da home: texto à esquerda sobre o preto e o atleta à direita.
 * Parallax: ao rolar, a foto desce mais devagar que a página e cresce um pouco (até 600 px de
 * rolagem), e o texto sobe de leve, para dar profundidade.
 */
export function HeroSection({ imageUrl }: { imageUrl: string }) {
  const navigate = useNavigate();
  const scrollY = useScrollY();

  return (
    <section className="relative h-[calc(100svh-100px)] max-h-[calc(100svh-100px)] overflow-hidden border-b border-border bg-ink">
      <div
        className="absolute inset-y-0 right-0 z-0 w-full will-change-transform md:w-[82%]"
        style={{
          transform: `translate3d(0, ${scrollY * 0.22}px, 0) scale(${1 + Math.min(scrollY, 600) * 0.00012})`,
        }}
      >
        <img
          src={imageUrl}
          alt="Atleta musculoso de costas usando camisa de compressão preta em uma academia"
          fetchPriority="high"
          width={1376}
          height={768}
          className="h-full w-full object-contain object-right grayscale contrast-125"
        />
        {/* o preto avança da esquerda e de baixo, juntando a foto ao bloco de texto */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-transparent md:via-ink/55" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink to-transparent" />
      </div>

      <div
        className="relative z-10 mx-auto flex h-full max-w-[1400px] items-center px-6 will-change-transform"
        style={{ transform: `translate3d(0, ${scrollY * -0.06}px, 0)` }}
      >
        <div className="max-w-2xl">
          <h1 className="font-display text-[15vw] leading-[0.85] text-paper md:text-[8.5vw] lg:text-[7.5vw]">
            NO LOGOS
            <br />
            <span className="text-outline-light">JUST WORK.</span>
          </h1>

          <p className="mt-8 max-w-lg text-sm font-medium uppercase leading-tight tracking-tight text-paper/70 md:text-lg">
            Performance técnica pura. Sem distrações. A essência do movimento em silêncio.
          </p>

          <button
            onClick={() => navigate({ to: "/colecao/$slug", params: { slug: "drop-02" } })}
            className="group relative mt-10 cursor-pointer overflow-hidden bg-paper px-16 py-5 text-sm font-medium tracking-[0.2em] text-ink transition-colors duration-300 hover:text-paper"
          >
            <span className="relative z-10 inline-flex items-center gap-3">
              VER COLEÇÃO <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
            {/* fundo preto que sobe ao passar o mouse */}
            <span className="absolute inset-0 translate-y-full bg-ink transition-transform duration-300 group-hover:translate-y-0" />
          </button>
        </div>
      </div>
    </section>
  );
}
