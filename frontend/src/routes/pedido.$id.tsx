import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Check, ArrowRight } from "lucide-react";
import { getOrder } from "@/lib/api";
import { money } from "@/lib/checkout";
import { pageHead } from "@/lib/metadata";
import { PageLayout } from "@/components/layout/PageLayout";
import { NotFoundPage, RouteError } from "@/components/layout/RouteBoundary";
import { Button } from "@/components/ui/button";
const orderQuery = (id: string) =>
  queryOptions({
    queryKey: ["order", id],
    queryFn: async () => {
      const order = await getOrder(id);
      if (!order) throw notFound();
      return order;
    },
    staleTime: Infinity,
  });
export const Route = createFileRoute("/pedido/$id")({
  head: () =>
    pageHead("Confirmação do pedido", "Confira os itens, entrega e resumo do seu pedido PACK.", {
      robots: "noindex",
    }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(orderQuery(params.id)),
  errorComponent: RouteError,
  notFoundComponent: NotFoundPage,
  component: Confirmation,
});
function Confirmation() {
  const { id } = Route.useParams();
  const { data: order } = useSuspenseQuery(orderQuery(id));
  return (
    <PageLayout title="PEDIDO RECEBIDO." eyebrow="CONFIRMAÇÃO">
      <div className="mb-10 flex items-start gap-4">
        <Check className="h-8 w-8 shrink-0" />
        <div>
          <p className="text-sm">Obrigado, {order.customer.name}.</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {order.id} · {order.status}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Esta confirmação é uma simulação. Nenhuma cobrança, envio ou e-mail foi realizado.
          </p>
        </div>
      </div>
      <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
        <section className="border-t border-border pt-6">
          <h2 className="text-2xl">SUAS PEÇAS</h2>
          <ul className="divide-y divide-border">
            {order.items.map((item) => (
              <li key={item.id + item.size} className="flex items-center gap-4 py-6">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-24 w-20 object-cover grayscale"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{item.name}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Tam. {item.size} / Qtd. {item.qty}
                  </p>
                </div>
                <p className="text-sm">{money(item.price * item.qty)}</p>
              </li>
            ))}
          </ul>
        </section>
        <aside className="border-t border-border pt-6">
          <h2 className="text-2xl">RESUMO DO PEDIDO</h2>
          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{money(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Desconto</dt>
              <dd>− {money(order.discount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{order.shipping.label}</dt>
              <dd>{money(order.shipping.price)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-4 font-medium">
              <dt>Total</dt>
              <dd>{money(order.total)}</dd>
            </div>
          </dl>
          <h3 className="mt-8 text-xl">ENTREGA</h3>
          <p className="mt-3 text-sm leading-relaxed">
            {order.address.street}, {order.address.number}
            {order.address.complement && ` · ${order.address.complement}`}
            <br />
            {order.address.neighborhood} · {order.address.city}/{order.address.state}
            <br />
            CEP {order.address.cep}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Prazo simulado: {order.shipping.days}
          </p>
          <h3 className="mt-6 text-xl">PAGAMENTO</h3>
          <p className="mt-3 text-sm">
            {order.payment === "pix" ? "Pix" : "Cartão de crédito"} — não processado
          </p>
        </aside>
      </div>
      <Button asChild className="mt-10 h-12">
        <Link to="/catalogo">
          CONTINUAR EXPLORANDO <ArrowRight />
        </Link>
      </Button>
    </PageLayout>
  );
}
