import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { selectClass } from "@/components/common/classes";
import { FormField } from "@/components/common/FormField";
import { OrderDetail } from "@/components/order/OrderDetail";
import { Button } from "@/components/ui/button";
import { updateOrder } from "@/lib/api";
import { money } from "@/lib/checkout";
import { STATUS_DE_PEDIDO } from "@/lib/dominio";
import { AdminRow, AdminTable } from "../AdminTable";
import type { AdminScreenProps } from "../tipos";

const pagamento = (payment: string) => (payment === "pix" ? "Pix" : "Cartão");

/** Lista de pedidos, do mais novo para o mais antigo (ordenada pela data). */
export function OrdersScreen({ data }: AdminScreenProps) {
  return (
    <AdminTable
      filters={[
        { key: "status", label: "Status", options: [...STATUS_DE_PEDIDO] },
        { key: "payment", label: "Pagamento", options: ["Pix", "Cartão"] },
      ]}
      exportName="orders"
      defaultSort={2}
      headers={["Pedido", "Cliente", "Data", "Total", "Status", "Ações"]}
    >
      {data.orders.map((o) => (
        <AdminRow
          key={o.id}
          values={[o.id, o.customer.name, o.createdAt ?? null, o.total, o.status]}
          filters={{ status: o.status, payment: pagamento(o.payment) }}
          search={[o.id, o.customer.name, o.customer.email, o.status, o.tracking].join(" ")}
        >
          <td>{o.id}</td>
          <td>{o.customer.name}</td>
          <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString("pt-BR") : "—"}</td>
          <td>{money(o.total)}</td>
          <td>{o.status}</td>
          <td>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/pedidos/$id" params={{ id: o.id }}>
                ABRIR <ArrowRight />
              </Link>
            </Button>
          </td>
        </AdminRow>
      ))}
    </AdminTable>
  );
}

/** Um pedido no admin: o detalhe e o formulário para mudar o status e o rastreio. */
export function OrderEditor({ data, busy, run, orderId }: AdminScreenProps & { orderId: string }) {
  const order = data.orders.find((o) => o.id === orderId);
  if (!order) return <p>Pedido não encontrado.</p>;

  return (
    <>
      <OrderDetail order={order} />
      <form
        className="mt-8 grid gap-4 pt-6 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const campos = new FormData(e.currentTarget);
          void run(
            () =>
              updateOrder(orderId, String(campos.get("status")), String(campos.get("tracking"))),
            "Pedido atualizado.",
          );
        }}
      >
        <label>
          <span className="mb-2 block text-xs">Status</span>
          <select name="status" className={selectClass} defaultValue={order.status}>
            {STATUS_DE_PEDIDO.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <FormField
          name="tracking"
          label="Código de rastreio (simulado)"
          defaultValue={order.tracking ?? ""}
        />
        <Button disabled={busy} className="sm:col-span-2">
          SALVAR PEDIDO
        </Button>
      </form>
    </>
  );
}
