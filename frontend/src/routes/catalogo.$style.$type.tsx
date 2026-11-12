import { pageHead } from "@/lib/metadata";
import { createFileRoute, notFound } from "@tanstack/react-router";
import type { ItemType, Style } from "@/data/types";
import { CatalogView } from "@/components/catalog/CatalogView";
import { CardAviso, PaginaTopo } from "@/components/layout/PaginaTopo";
import { freeShippingFrom } from "@/data/shipping";

const VALID_STYLES: Style[] = ["casual", "treino"];
const VALID_TYPES: ItemType[] = ["camisetas", "bermudas", "conjuntos"];

export const Route = createFileRoute("/catalogo/$style/$type")({
  validateSearch: (s: Record<string, unknown>): { sort?: string } => ({
    sort: typeof s.sort === "string" ? s.sort : "recent",
  }),
  beforeLoad: ({ params }) => {
    if (
      !VALID_STYLES.includes(params.style as Style) ||
      !VALID_TYPES.includes(params.type as ItemType)
    ) {
      throw notFound();
    }
  },
  head: ({ params }) =>
    pageHead(`${params.type} / ${params.style}`, "Explore peças PACK por categoria e estilo."),
  component: CatalogPage,
});

function CatalogPage() {
  const { style, type } = Route.useParams();
  const s = style as Style;
  const t = type as ItemType;

  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PaginaTopo
        caminho={`CATÁLOGO / ${s.toUpperCase()} / ${t.toUpperCase()}`}
        titulo={t}
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
