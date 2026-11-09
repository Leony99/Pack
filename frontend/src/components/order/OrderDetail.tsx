import { money } from "@/lib/checkout";
import { ETAPAS_DO_PEDIDO } from "@/lib/dominio";
import type { Order } from "@/data/types";

/** Detalhe de um pedido: etapas, itens, entrega e valores. Usado na conta do cliente e no admin. */
export function OrderDetail({ order }: { order: Order }) {
  const valores = [
    ["Subtotal", money(order.subtotal)],
    ["Desconto", money(order.discount)],
    ["Frete", money(order.shipping.price)],
    ["Total", money(order.total)],
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap justify-between gap-4">
        <div>
          <h2 className="text-2xl">{order.id}</h2>
          <p className="mt-2 text-sm">{order.status}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Pagamento não processado · {order.payment === "pix" ? "Pix" : "Cartão"}
        </p>
      </div>
      <ol className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ETAPAS_DO_PEDIDO.map((etapa, i) => (
          <li
            key={etapa}
            className={`border-t-2 pt-3 text-xs ${order.status === etapa ? "border-foreground font-medium" : "border-input text-muted-foreground"}`}
          >
            {String(i + 1).padStart(2, "0")} / {etapa}
          </li>
        ))}
      </ol>
      <div className="space-y-2">
        {order.items.map((item) => (
          <div key={item.id + item.size} className="flex items-center gap-4 py-5">
            <img src={item.image} alt={item.name} className="h-24 w-20 object-cover grayscale" />
            <div className="min-w-0 flex-1">
              <p className="text-sm">{item.name}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {item.size} · {item.qty} unidade(s)
              </p>
            </div>
            <p className="text-sm">{money(item.qty * item.price)}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-8 pt-6 sm:grid-cols-2">
        <div>
          <h3 className="text-xl">ENTREGA</h3>
          <p className="mt-3 text-sm leading-7">
            {order.address.street}, {order.address.number}
            <br />
            {order.address.complement}
            <br />
            {order.address.city}/{order.address.state} · {order.address.cep}
          </p>
          <p className="mt-3 text-sm">
            {order.shipping.label} · {order.shipping.days}
          </p>
          <p className="mt-2 break-all text-xs">
            Rastreio: {order.tracking || "Ainda não disponível"}
          </p>
        </div>
        <dl className="space-y-3 text-sm">
          {valores.map(([rotulo, valor]) => (
            <div key={rotulo} className="flex justify-between">
              <dt>{rotulo}</dt>
              <dd>{valor}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
