import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/catalog/ProductCard";
import type { CatalogSearch } from "@/components/catalog/filtros";
import type { Product } from "@/data/types";

type Props = {
  /** Texto pequeno acima do título. */
  eyebrow: string;
  title: string;
  items: Product[];
  /** Filtros do catálogo que o "ver todos" abre (ex.: { section: "destaques" }). */
  viewAllSearch: CatalogSearch;
};

/** Uma linha de até 4 produtos com o link para ver todos no catálogo (home e página do produto). */
export function SectionRow({ eyebrow, title, items, viewAllSearch }: Props) {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-20 md:py-24">
      <div className="mb-12 flex flex-col items-baseline justify-between gap-4 md:flex-row">
        <div>
          <p className="text-[10px] font-medium tracking-[0.3em] text-muted-foreground">
            {eyebrow}
          </p>
          <h2 className="mt-3 font-display text-4xl leading-none md:text-6xl">{title}</h2>
        </div>
        <Link
          to="/catalogo"
          search={viewAllSearch}
          className="group hidden cursor-pointer items-center gap-2 border-b-2 border-foreground pb-1 text-xs font-medium uppercase tracking-[0.2em] transition hover:border-transparent md:flex"
        >
          Ver todos os itens <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-px border-0 bg-transparent md:grid-cols-4">
        {items.slice(0, 4).map((p) => (
          <div key={p.id} className="bg-transparent p-5 transition-colors hover:bg-secondary">
            <ProductCard p={p} />
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-center md:hidden">
        <Link
          to="/catalogo"
          search={viewAllSearch}
          className="group inline-flex cursor-pointer items-center gap-2 border border-foreground px-6 py-3 text-xs font-medium tracking-[0.3em]"
        >
          VER TUDO <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
