import { createFileRoute } from "@tanstack/react-router";
import { PasswordForm } from "@/components/account/PasswordForm";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/login_/redefinir")({
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : "",
  }),
  head: () => pageHead("Redefinir senha", "Redefinição demonstrativa de acesso PACK."),
  component: Page,
});
function Page() {
  const { token } = Route.useSearch();
  return <PasswordForm reset token={token} />;
}
