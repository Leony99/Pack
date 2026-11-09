import { Link } from "@tanstack/react-router";
import { FormField } from "@/components/common/FormField";
import { OrderDetail } from "@/components/order/OrderDetail";
import { Button } from "@/components/ui/button";
import { cancelMyOrder, requestReturn } from "@/lib/api";
import { CANCELAVEL } from "@/lib/dominio";
import type { Order } from "@/data/types";
import type { AccountScreenProps } from "../tipos";

/** Acompanhar um pedido: detalhe, cancelamento (antes do envio) e pedido de troca. */
export function OrderScreen({
  data,
  busy,
  run,
  orderId,
  order,
  loading,
}: AccountScreenProps & { orderId: string; order?: Order | null; loading: boolean }) {
  if (loading) return <p role="status">Carregando pedido...</p>;
  if (!order) return <p className="text-sm">Pedido não encontrado nesta conta.</p>;

  const troca = data.returns.find((r) => r.orderId === orderId);

  return (
    <>
      <OrderDetail order={order} />
      <div className="mt-8 flex flex-wrap gap-3">
        {CANCELAVEL.includes(order.status) && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => {
              if (window.confirm("Cancelar este pedido simulado?"))
                void run(() => cancelMyOrder(orderId), "Pedido cancelado.");
            }}
          >
            CANCELAR PEDIDO
          </Button>
        )}
        <Button asChild variant="outline">
          <Link to="/suporte/contato">FALAR COM ATENDIMENTO</Link>
        </Button>
      </div>
      {order.status !== "Cancelado" && (
        <form
          className="mt-8 pt-6"
          onSubmit={(e) => {
            e.preventDefault();
            const reason = String(new FormData(e.currentTarget).get("reason"));
            void run(
              () => requestReturn(orderId, reason),
              "Solicitação de troca registrada na demonstração.",
            );
          }}
        >
          <h2 className="mb-4 text-2xl">SOLICITAR TROCA / DEVOLUÇÃO</h2>
          {troca ? (
            <p className="text-sm">{troca.status}</p>
          ) : (
            <>
              <FormField label="Motivo" name="reason" required />
              <Button disabled={busy} className="mt-4">
                ENVIAR SOLICITAÇÃO
              </Button>
            </>
          )}
        </form>
      )}
    </>
  );
}
