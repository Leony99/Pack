import { pageHead } from "@/lib/metadata";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { CatalogView } from "@/components/catalog/CatalogView";
import { catalogoQuery } from "@/components/catalog/consulta";
import { catalogFilters } from "@/components/catalog/filtros";
import { CardAviso, PaginaTopo } from "@/components/layout/PaginaTopo";
import { freeShippingFrom } from "@/data/shipping";
import { getOpcoesDoCatalogo, nomeDaOpcao, SLUG } from "@/lib/api";

export const Route = createFileRoute("/catalogo/$style/$type")({
  validateSearch: (s: Record<string, unknown>): { sort?: string } => ({
    sort: typeof s.sort === "string" ? s.sort : "recent",
  }),
  // estilo e categoria são tags (aba Tags do painel): o par precisa existir entre as opções
  beforeLoad: async ({ params }) => {
    if (!SLUG.test(params.style) || !SLUG.test(params.type)) throw notFound();
    const opcoes = await getOpcoesDoCatalogo().catch(() => null);
    // sem a API, a página abre e o catálogo mostra o erro
    if (!opcoes) return;
    const existe = (lista: { valor: string }[], valor: string) =>
      lista.some((o) => o.valor === valor);
    if (!existe(opcoes.estilos, params.style) || !existe(opcoes.categorias, params.type))
      throw notFound();
  },
  // a primeira página já vem do servidor (a mesma consulta que a grade faz)
  loaderDeps: ({ search }) => ({ sort: search.sort }),
  loader: ({ context, params, deps }) =>
    context.queryClient.ensureInfiniteQueryData(
      catalogoQuery(catalogFilters({ style: params.style, type: params.type, sort: deps.sort })),
    ),
  head: ({ params }) =>
    pageHead(`${params.type} / ${params.style}`, "Explore peças PACK por categoria e estilo."),
  component: CatalogPage,
});

function CatalogPage() {
  const { style, type } = Route.useParams();
  const s = style;
  const t = type;

  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PaginaTopo
        caminho={`CATÁLOGO / ${nomeDaOpcao(s).toUpperCase()} / ${nomeDaOpcao(t).toUpperCase()}`}
        titulo={nomeDaOpcao(t)}
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
        locked
        search={{ style: s, type: t, sort: search.sort }}
        onChange={(patch) => void navigate({ search: { sort: patch.sort ?? "recent" } })}
      />
    </div>
  );
}
