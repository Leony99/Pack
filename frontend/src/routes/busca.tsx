import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState, useEffect, type FormEvent } from "react";
import { Search } from "lucide-react";
import { getProducts } from "@/lib/api";
import { pageHead } from "@/lib/metadata";
import { ProductCard } from "@/components/catalog/ProductCard";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { RouteError, NotFoundPage } from "@/components/layout/RouteBoundary";
const searchQuery = (q: string) =>
  queryOptions({ queryKey: ["products", "search", q], queryFn: () => getProducts({ search: q }) });
export const Route = createFileRoute("/busca")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s.q === "string" ? s.q.slice(0, 200) : "",
  }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(searchQuery(deps.q)),
  head: ({ match }) =>
    pageHead(
      match.search.q ? `Busca: ${match.search.q}` : "Buscar peças",
      "Encontre camisetas, bermudas e conjuntos de treino e casual da PACK.",
    ),
  errorComponent: RouteError,
  notFoundComponent: NotFoundPage,
  component: SearchPage,
});
function SearchPage() {
  const { q } = Route.useSearch();
  const { data } = useSuspenseQuery(searchQuery(q));
  const navigate = useNavigate();
  const [term, setTerm] = useState(q);
  useEffect(() => setTerm(q), [q]);
  function submit(e: FormEvent) {
    e.preventDefault();
    navigate({ to: "/busca", search: { q: term.trim() } });
  }
  return (
    <PageLayout title={q ? "RESULTADOS DE BUSCA" : "ENCONTRE SUAS PEÇAS"} eyebrow="BUSCA">
      <form onSubmit={submit} className="mx-auto mb-8 flex max-w-2xl border border-border">
        <input
          type="search"
          aria-label="Buscar produtos"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="O que você procura?"
          className="min-w-0 flex-1 bg-background px-4 py-4 text-sm outline-none"
        />
        <Button type="submit" className="h-auto px-5" aria-label="Buscar">
          <Search />
        </Button>
      </form>
      {q ? (
        <p className="mb-8 break-words text-sm text-muted-foreground">
          {data.length} {data.length === 1 ? "resultado" : "resultados"} para “{q}”
        </p>
      ) : (
        <p className="mb-8 text-sm text-muted-foreground">Todas as peças</p>
      )}
      {data.length ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {data.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <div className="border-t border-border py-10">
          <h2 className="text-2xl">NENHUMA PEÇA ENCONTRADA.</h2>
          <p className="mt-3 text-sm text-muted-foreground">Tente outro nome ou categoria.</p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => navigate({ to: "/busca", search: { q: "" } })}
          >
            VER TODAS AS PEÇAS
          </Button>
        </div>
      )}
    </PageLayout>
  );
}
