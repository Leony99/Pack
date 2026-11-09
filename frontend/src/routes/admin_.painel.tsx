import { createFileRoute } from "@tanstack/react-router";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/admin_/painel")({
  head: () =>
    pageHead("Painel administrativo", "Administração demonstrativa da loja PACK.", {
      robots: "noindex, nofollow",
    }),
  component: Page,
});
function Page() {
  return <AdminPanel view="overview" />;
}
