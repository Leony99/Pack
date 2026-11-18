import { createFileRoute, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getCollection } from "@/lib/api";
import { PaginaTopo } from "@/components/layout/PaginaTopo";
import { CatalogView } from "@/components/catalog/CatalogView";
import { catalogoQuery } from "@/components/catalog/consulta";
import { catalogFilters } from "@/components/catalog/filtros";
import { pageHead } from "@/lib/metadata";
const query = (slug: string) =>
  queryOptions({
    queryKey: ["collections", slug],
    queryFn: async () => {
      const c = await getCollection(slug);
      if (!c) throw notFound();
      return c;
    },
  });
export const Route = createFileRoute("/colecao/$slug")({
  validateSearch: (s: Record<string, unknown>): { sort?: string } => ({
    sort: typeof s.sort === "string" ? s.sort : "recent",
  }),
  loaderDeps: ({ search }) => ({ sort: search.sort }),
  // a coleção e a primeira página das peças dela, as duas já do servidor
  loader: async ({ context, params, deps }) => {
    const [colecao] = await Promise.all([
      context.queryClient.ensureQueryData(query(params.slug)),
      context.queryClient.ensureInfiniteQueryData(
        catalogoQuery(catalogFilters({ collection: params.slug, sort: deps.sort })),
      ),
    ]);
    return colecao;
  },
  head: ({ loaderData }) =>
    pageHead(
      loaderData?.name ?? "Coleção indisponível",
      loaderData?.description ?? "Coleções PACK por tag de produto.",
    ),
  component: Page,
});
function Page() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(query(slug));
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <main>
      <PaginaTopo
        caminho={`PACK / COLEÇÕES / ${data.name.toUpperCase()}`}
        titulo={data.name}
        texto={data.description}
      />
      <CatalogView
        locked
        search={{ collection: slug, sort: search.sort }}
        onChange={(patch) => void navigate({ search: { sort: patch.sort ?? "recent" } })}
      />
    </main>
  );
}
