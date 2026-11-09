import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import lifestyle from "@/assets/lifestyle.jpg";
import { getContent } from "@/lib/api";
import { pageHead } from "@/lib/metadata";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { NotFoundPage, RouteError } from "@/components/layout/RouteBoundary";
const contentQuery = queryOptions({
  queryKey: ["content", "manifesto"],
  queryFn: () => getContent("manifesto"),
});
export const Route = createFileRoute("/sobre")({
  head: () =>
    pageHead(
      "Manifesto",
      "A essência da PACK: movimento, constância e roupas sem excessos para treino e rua.",
    ),
  loader: ({ context }) => context.queryClient.ensureQueryData(contentQuery),
  errorComponent: RouteError,
  notFoundComponent: NotFoundPage,
  component: Manifesto,
});
function Manifesto() {
  const { data } = useSuspenseQuery(contentQuery);
  return (
    <PageLayout title="MANIFESTO PACK" eyebrow="A MARCA">
      <div className="grid gap-12 md:grid-cols-2">
        <img
          src={lifestyle}
          alt="O movimento e a rotina de treino PACK"
          className="aspect-[4/5] w-full object-cover grayscale"
        />
        <div className="flex flex-col justify-center">
          {data.manifesto.map((item, i) => (
            <section key={item.title} className="border-t border-border py-8">
              <p className="mb-3 text-xs text-muted-foreground">0{i + 1}</p>
              <h2 className="text-3xl uppercase">{item.title}</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
            </section>
          ))}
          <Button asChild className="mt-6 h-12 self-start">
            <Link to="/catalogo">
              VESTIR PACK <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
