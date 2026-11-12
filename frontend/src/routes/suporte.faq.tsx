import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getContent } from "@/lib/api";
import { pageHead } from "@/lib/metadata";
import joggers from "@/assets/product-joggers.jpg";
import { PageLayout } from "@/components/layout/PageLayout";
import { CardAviso } from "@/components/layout/PaginaTopo";
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
    <PageLayout
      title="FAQ"
      eyebrow="SUPORTE / FAQ"
      imagem={joggers}
      texto="Tamanhos, entrega, cupons, pagamentos e pedidos."
      lado={
        <>
          <CardAviso
            rotulo="PERGUNTAS"
            valor={String(data.faq.length).padStart(2, "0")}
            texto="respostas rápidas"
          />
          <CardAviso
            escuro
            rotulo="AINDA COM DÚVIDA?"
            valor="CONTATO"
            texto="fale com a PACK"
            to="/suporte/contato"
          />
        </>
      }
    >
      <div className="mx-auto max-w-3xl border-t border-ink">
        <Accordion type="single" collapsible>
          {data.faq.map((item, i) => (
            <AccordionItem value={String(i)} key={item.question}>
              <AccordionTrigger className="py-6 text-left">
                <span className="flex items-baseline gap-4">
                  <span className="text-[10px] tracking-[0.3em] text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {item.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="max-w-2xl pl-9 leading-relaxed text-muted-foreground">
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
