import { createFileRoute } from "@tanstack/react-router";
import { CatalogView } from "@/components/catalog/CatalogView";
import { CardAviso, PaginaTopo } from "@/components/layout/PaginaTopo";
import { freeShippingFrom } from "@/data/shipping";
import { catalogFilters, parseCatalogSearch } from "@/components/catalog/filtros";
import { catalogoQuery } from "@/components/catalog/consulta";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/catalogo/")({
  validateSearch: parseCatalogSearch,
  loaderDeps: ({ search }) => catalogFilters(search),
  // a primeira página já vem do servidor; as outras, no "CARREGAR MAIS"
  loader: ({ context, deps }) => context.queryClient.ensureInfiniteQueryData(catalogoQuery(deps)),
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
