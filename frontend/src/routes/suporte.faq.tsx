import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getContent } from "@/lib/api";
import { pageHead } from "@/lib/metadata";
import { PageLayout } from "@/components/layout/PageLayout";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { RouteError, NotFoundPage } from "@/components/layout/RouteBoundary";
const contentQuery = queryOptions({
  queryKey: ["content", "faq"],
  queryFn: () => getContent("faq"),
});
export const Route = createFileRoute("/suporte/faq")({
  head: () =>
    pageHead(
      "Perguntas frequentes",
      "Tire suas dúvidas sobre tamanhos, entrega, cupons, pagamentos e pedidos PACK.",
    ),
  loader: ({ context }) => context.queryClient.ensureQueryData(contentQuery),
  errorComponent: RouteError,
  notFoundComponent: NotFoundPage,
  component: FAQ,
});
function FAQ() {
  const { data } = useSuspenseQuery(contentQuery);
  return (
    <PageLayout title="PERGUNTAS FREQUENTES" eyebrow="SUPORTE / FAQ">
      <div className="max-w-3xl border-t border-border">
        <Accordion type="single" collapsible>
          {data.faq.map((item, i) => (
            <AccordionItem value={String(i)} key={item.question}>
              <AccordionTrigger className="py-6">{item.question}</AccordionTrigger>
              <AccordionContent className="max-w-2xl leading-relaxed text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="mt-8 text-sm">
          Ainda tem dúvidas?{" "}
          <Link to="/suporte/contato" className="underline">
            Fale com a PACK.
          </Link>
        </p>
      </div>
    </PageLayout>
  );
}
