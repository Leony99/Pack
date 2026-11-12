import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { OrderList } from "@/components/order/OrderList";
import { getAccountData, getMyOrder } from "@/lib/api";
import { useSession } from "@/lib/session";
import { AccountOverview } from "./telas/AccountOverview";
import { AddressesScreen } from "./telas/AddressesScreen";
import { OrderScreen } from "./telas/OrderScreen";
import { ProfileScreen } from "./telas/ProfileScreen";
import type { AccountView, RunAction } from "./tipos";

const titles: Record<AccountView, string> = {
  overview: "MINHA CONTA",
  orders: "MEUS PEDIDOS",
  addresses: "MEUS ENDEREÇOS",
  profile: "DADOS PESSOAIS",
  order: "ACOMPANHAR PEDIDO",
};

/**
 * Área do cliente. Carrega os dados da conta e mostra a tela pedida pela rota.
 * Toda alteração passa por run(): ela atualiza os dados em cache e mostra o resultado no topo.
 */
export function AccountPanel({ view, orderId }: { view: AccountView; orderId?: string }) {
  const { customer, refresh } = useSession();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["account", customer?.id],
    queryFn: getAccountData,
    enabled: !!customer,
  });
  const detail = useQuery({
    queryKey: ["my-order", customer?.id, orderId],
    queryFn: () => getMyOrder(orderId ?? ""),
    enabled: !!customer && !!orderId,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const run: RunAction = async (action, success) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      await Promise.all(
        ["account", "my-order", "admin", "products"].map((chave) =>
          queryClient.invalidateQueries({ queryKey: [chave] }),
        ),
      );
      await refresh();
      setMessage(success);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  };

  const data = query.data;
  const props = data && { data, busy, run };

  return (
    <DashboardLayout kind="customer" title={titles[view]}>
      {message && (
        <p role="status" className="mb-6 border border-ink/10 p-4 text-sm">
          {message}
        </p>
      )}
      {(error || query.error || detail.error) && (
        <p role="alert" className="mb-6 text-sm">
          {error || String(query.error || detail.error)}
        </p>
      )}
      {query.isPending && customer && <p role="status">Carregando...</p>}
      {props && view === "overview" && <AccountOverview data={props.data} />}
      {props && view === "orders" && <OrderList orders={[...props.data.orders].reverse()} />}
      {props && view === "addresses" && <AddressesScreen {...props} />}
      {props && view === "profile" && <ProfileScreen {...props} onError={setError} />}
      {props && view === "order" && (
        <OrderScreen
          {...props}
          orderId={orderId ?? ""}
          order={detail.data}
          loading={detail.isPending}
        />
      )}
    </DashboardLayout>
  );
}
