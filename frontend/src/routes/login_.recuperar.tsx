import { createFileRoute } from "@tanstack/react-router";
import { PasswordForm } from "@/components/account/PasswordForm";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/login_/recuperar")({
  head: () =>
    pageHead("Recuperar senha", "Solicitação demonstrativa de recuperação de acesso PACK."),
  component: Page,
});
function Page() {
  return <PasswordForm />;
}
