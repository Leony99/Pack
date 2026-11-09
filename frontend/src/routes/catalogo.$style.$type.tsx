import { pageHead } from "@/lib/metadata";
import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import type { ItemType, Style } from "@/data/types";
import { CatalogView } from "@/components/catalog/CatalogView";

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
      {/* Breadcrumb / banner */}
      <section className="border-b border-border bg-secondary">
        <div className="mx-auto max-w-[1400px] px-6 py-10 md:py-14">
          <p className="mb-4 text-xs text-muted-foreground">
            <Link to="/" className="cursor-pointer hover:text-foreground">
              PACK
            </Link>{" "}
            / {s.toUpperCase()} / {t.toUpperCase()}
          </p>
          <h1 className="font-display text-4xl md:text-5xl">{t.toUpperCase()}</h1>
        </div>
      </section>

      <CatalogView
        locked
        search={{ style: s, type: t, sort: search.sort }}
        onChange={(patch) => void navigate({ search: { sort: patch.sort ?? "recent" } })}
      />
    </div>
  );
}
