import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { useGsap } from "@/hooks/useGsap";
import { gsap } from "@/lib/movimento";
import type { Product } from "@/data/types";

/**
 * O último drop em rolagem lateral (tema escuro), com o mesmo espaço em cima e embaixo. No
 * computador, a seção só prende quando o meio dela chega ao meio da tela; a partir daí, a rolagem
 * da página empurra a fila de peças para a esquerda, com a barra de progresso laranja embaixo. As
 * peças encolhem em telas baixas para a seção caber inteira na tela. No celular (e para quem pediu
 * menos movimento), a fila rola de lado, parando em cada peça.
 */
export function DropHorizontal({ produtos }: { produtos: Product[] }) {
  const ref = useGsap<HTMLElement>((el) => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const trilho = el.querySelector<HTMLElement>("[data-trilho]");
      if (!trilho) return;
      const distancia = () => trilho.scrollWidth - window.innerWidth;
      gsap
        .timeline({
          scrollTrigger: {
            trigger: el,
            start: "center center",
            end: () => `+=${distancia()}`,
            scrub: 1,
            pin: true,
            invalidateOnRefresh: true,
          },
        })
        .to(trilho, { x: () => -distancia(), ease: "none" })
        .to(el.querySelector("[data-progresso]"), { scaleX: 1, ease: "none" }, 0);
    });
    return () => mm.revert();
  });

  const total = String(produtos.length).padStart(2, "0");

  return (
    <section
      ref={ref}
      className="dark flex flex-col justify-center overflow-hidden border-b border-border bg-background py-20 text-foreground md:py-14 md:motion-reduce:py-24"
    >
      <div className="snap-x snap-mandatory scroll-px-6 overflow-x-auto md:snap-none md:overflow-visible md:motion-reduce:snap-x md:motion-reduce:overflow-x-auto">
        <div data-trilho className="flex w-max items-end gap-5 px-6 md:gap-10">
          <div className="flex w-[80vw] shrink-0 snap-start flex-col justify-end self-stretch md:w-[36vw]">
            <p className="text-[10px] font-medium tracking-[0.3em] text-destaque">
              ÚLTIMO DROP · SS26
            </p>
            <h2 className="mt-4 font-display text-[22vw] leading-[0.85] md:text-[10vw]">
              DROP <span className="text-outline-light">02</span>
            </h2>
            <p className="mt-6 max-w-sm text-sm text-muted-foreground">
              {produtos.length} peças novas, feitas para a repetição. Role para ver todas.
            </p>
            <Link
              to="/colecao/$slug"
              params={{ slug: "drop-02" }}
              className="group mt-6 inline-flex w-fit items-center gap-2 border-b-2 border-foreground pb-1 text-xs font-medium uppercase tracking-[0.2em] transition hover:border-destaque"
            >
              Ver a coleção <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
          </div>
          {produtos.map((p, i) => (
            <div
              key={p.id}
              className="w-[68vw] shrink-0 snap-start md:w-[min(24vw,calc((100svh-300px)*0.75))]"
            >
              <p className="mb-3 text-[10px] font-medium tracking-[0.3em] text-muted-foreground">
                {String(i + 1).padStart(2, "0")} / {total}
              </p>
              <ProductCard p={p} />
            </div>
          ))}
          <Link
            to="/colecao/$slug"
            params={{ slug: "drop-02" }}
            className="group flex w-[60vw] shrink-0 snap-start items-center gap-4 self-center font-display text-[13vw] leading-none md:w-[28vw] md:text-[5.5vw]"
          >
            VER TUDO
            <ArrowRight className="h-[0.6em] w-[0.6em] text-destaque transition-transform duration-500 group-hover:translate-x-3" />
          </Link>
        </div>
      </div>
      <div className="mx-6 mt-12 hidden h-px bg-foreground/20 md:block">
        <div data-progresso className="h-full origin-left scale-x-0 bg-destaque" />
      </div>
    </section>
  );
}
