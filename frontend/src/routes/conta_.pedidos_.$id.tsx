import { createFileRoute } from "@tanstack/react-router";
import { AccountPanel } from "@/components/account/AccountPanel";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/conta_/pedidos_/$id")({
  head: () => pageHead("Acompanhar pedido", "Acompanhe seu pedido e solicite atendimento PACK."),
  component: Page,
});
function Page() {
  const { id } = Route.useParams();
  return <AccountPanel view="order" orderId={id} />;
}
