import { createFileRoute } from "@tanstack/react-router";
import { NotFoundPage } from "@/components/layout/RouteBoundary";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/404")({
  head: () =>
    pageHead("Página não encontrada", "A página procurada não está disponível na PACK.", {
      robots: "noindex",
    }),
  component: NotFoundPage,
});
