import { createFileRoute } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { CatalogView } from "@/components/catalog/CatalogView";
import { CardAviso, PaginaTopo } from "@/components/layout/PaginaTopo";
import { freeShippingFrom } from "@/data/shipping";
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
      <PaginaTopo
        caminho="PACK / CATÁLOGO"
        titulo="CATÁLOGO"
        texto="Casual e treino, em preto e branco. Filtre por estilo, categoria, curadoria e coleção."
        lado={
          <>
            <CardAviso
              rotulo="FRETE GRÁTIS"
              valor={`R$ ${freeShippingFrom}+`}
              texto="em compras acima desse valor"
            />
            <CardAviso escuro rotulo="TROCAS" valor="30 DIAS" texto="para trocar ou devolver" />
          </>
        }
      />
      <CatalogView
        search={search}
        onChange={(patch) => void navigate({ search: (prev) => ({ ...prev, ...patch }) })}
      />
    </main>
  );
}
