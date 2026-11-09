import { createFileRoute } from "@tanstack/react-router";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/admin_/pedidos_/$id")({
  head: () =>
    pageHead("Gerenciar pedido", "Detalhes e atualização do pedido simulado PACK.", {
      robots: "noindex, nofollow",
    }),
  component: Page,
});
function Page() {
  const { id } = Route.useParams();
  return <AdminPanel view="orders" orderId={id} />;
}
