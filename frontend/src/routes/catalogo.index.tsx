import { createFileRoute } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { CatalogView } from "@/components/catalog/CatalogView";
import { catalogFilters, parseCatalogSearch } from "@/components/catalog/filtros";
import { getProducts } from "@/lib/api";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/catalogo/")({
  validateSearch: parseCatalogSearch,
  loaderDeps: ({ search }) => catalogFilters(search),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(
      queryOptions({ queryKey: ["products", deps], queryFn: () => getProducts(deps) }),
    ),
  head: () =>
    pageHead("Catálogo", "Explore peças PACK por estilo, categoria, coleção e disponibilidade."),
  component: Page,
});
function Page() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <main>
      <section className="border-b border-border bg-secondary">
        <div className="mx-auto max-w-[1400px] px-6 py-10 md:py-14">
          <p className="mb-4 text-xs text-muted-foreground">PACK / CATÁLOGO</p>
          <h1 className="text-4xl md:text-5xl">CATÁLOGO</h1>
        </div>
      </section>
      <CatalogView
        search={search}
        onChange={(patch) => void navigate({ search: (prev) => ({ ...prev, ...patch }) })}
      />
    </main>
  );
}
