import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/checkout";
import type { Order } from "@/data/types";
import { AdminRow, AdminTable } from "../AdminTable";
import type { AdminScreenProps } from "../tipos";

/** Clientes: contato, quantos pedidos fez e quanto gastou (sem contar os cancelados). */
export function CustomersScreen({ data, edit }: AdminScreenProps) {
  const pedidosDo = (id: string) => data.orders.filter((o) => o.customerId === id);
  const gastoDo = (id: string) =>
    pedidosDo(id)
      .filter((o) => o.status !== "Cancelado")
      .reduce((soma, o) => soma + o.total, 0);

  return (
    <AdminTable
      filters={[
        { key: "orders", label: "Pedidos", options: ["Com pedidos", "Sem pedidos"] },
        { key: "newsletter", label: "Newsletter", options: ["Inscrito", "Não inscrito"] },
      ]}
      exportName="customers"
      headers={["Cliente", "E-mail", "Telefone", "Pedidos", "Total", "Detalhes"]}
    >
      {data.customers.map((c) => (
        <AdminRow
          key={c.id}
          values={[c.name, c.email, c.phone, pedidosDo(c.id).length, gastoDo(c.id)]}
          filters={{
            orders: pedidosDo(c.id).length ? "Com pedidos" : "Sem pedidos",
            newsletter: c.newsletter ? "Inscrito" : "Não inscrito",
          }}
        >
          <td>{c.name}</td>
          <td>{c.email}</td>
          <td>{c.phone || "—"}</td>
          <td>{pedidosDo(c.id).length}</td>
          <td>{money(gastoDo(c.id))}</td>
          <td>
            <Button variant="outline" size="sm" onClick={() => edit(c)}>
              VER CLIENTE
            </Button>
          </td>
        </AdminRow>
      ))}
    </AdminTable>
  );
}

/** Conteúdo da janela "DETALHES DO CLIENTE": contato e um atalho para cada pedido. */
export function CustomerDetails({
  customer,
  orders,
  onClose,
}: {
  customer: { id?: string; name?: string; email: string };
  orders: Order[];
  onClose: () => void;
}) {
  return (
    <>
      <p className="text-sm">
        {customer.name ?? ""} · {customer.email}
      </p>
      {orders
        .filter((o) => o.customerId === (customer.id ?? ""))
        .map((o) => (
          <Button key={o.id} asChild variant="outline">
            <Link to="/admin/pedidos/$id" params={{ id: o.id }} onClick={onClose}>
              {o.id} · {money(o.total)}
            </Link>
          </Button>
        ))}
    </>
  );
}
