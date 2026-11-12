import { Link } from "@tanstack/react-router";
import { ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/checkout";
import type { Order } from "@/data/types";

/** Pedidos do cliente, cada um levando ao detalhe. Sem pedidos, convida a ver o catálogo. */
export function OrderList({ orders }: { orders: Order[] }) {
  if (!orders.length)
    return (
      <div className="py-10">
        <Package className="mb-4" />
        <p className="text-sm">Nenhum pedido nesta conta.</p>
        <Button asChild variant="link" className="mt-3">
          <Link to="/catalogo">
            EXPLORAR PEÇAS <ArrowRight />
          </Link>
        </Button>
      </div>
    );

  return (
    <div className="space-y-2">
      {orders.map((o) => (
        <Link
          key={o.id}
          to="/conta/pedidos/$id"
          params={{ id: o.id }}
          className="flex flex-wrap items-center justify-between gap-4 py-6"
        >
          <div className="flex gap-4">
            <img
              src={o.items[0]?.image}
              alt={o.items[0]?.name ?? "Pedido"}
              className="h-20 w-16 object-cover grayscale"
            />
            <div>
              <p className="text-sm font-medium">{o.id}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {o.createdAt ? new Date(o.createdAt).toLocaleDateString("pt-BR") : ""} ·{" "}
                {o.items.reduce((s, i) => s + i.qty, 0)} peça(s)
              </p>
              <p className="mt-2 text-xs">{o.status}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {money(o.total)}
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>
      ))}
    </div>
  );
}
