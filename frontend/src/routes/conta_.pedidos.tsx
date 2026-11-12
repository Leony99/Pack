import { createFileRoute } from "@tanstack/react-router";
import { AccountPanel } from "@/components/account/AccountPanel";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/conta_/pedidos")({
  head: () => pageHead("Meus pedidos", "Gerencie sua conta de demonstração PACK."),
  component: Page,
});
function Page() {
  return <AccountPanel view="orders" />;
}
