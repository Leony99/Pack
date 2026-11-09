import { createFileRoute } from "@tanstack/react-router";
import { AccountPanel } from "@/components/account/AccountPanel";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/conta")({
  head: () => pageHead("Minha conta", "Gerencie sua conta de demonstração PACK."),
  component: Page,
});
function Page() {
  return <AccountPanel view="overview" />;
}
