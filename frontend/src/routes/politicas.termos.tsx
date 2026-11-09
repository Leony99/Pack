import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getContent } from "@/lib/api";
import { pageHead } from "@/lib/metadata";
import { PageLayout } from "@/components/layout/PageLayout";
import { RouteError, NotFoundPage } from "@/components/layout/RouteBoundary";
const contentQuery = queryOptions({
  queryKey: ["content", "terms"],
  queryFn: () => getContent("terms"),
});
export const Route = createFileRoute("/politicas/termos")({
  head: () =>
    pageHead("Termos de uso", "Condições de uso do site e da experiência de compra PACK."),
  loader: ({ context }) => context.queryClient.ensureQueryData(contentQuery),
  errorComponent: RouteError,
  notFoundComponent: NotFoundPage,
  component: Terms,
});
function Terms() {
  const { data } = useSuspenseQuery(contentQuery);
  return (
    <PageLayout title="TERMOS DE USO" eyebrow="POLÍTICAS / TERMOS">
      <p className="mb-8 max-w-3xl border-y border-border py-4 text-xs text-muted-foreground">
        Versão demonstrativa. Texto provisório sujeito à revisão jurídica antes da operação
        comercial.
      </p>
      <div className="max-w-3xl space-y-8">
        {data.terms.map((item) => (
          <section key={item.title}>
            <h2 className="text-2xl uppercase">{item.title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
          </section>
        ))}
      </div>
    </PageLayout>
  );
}
