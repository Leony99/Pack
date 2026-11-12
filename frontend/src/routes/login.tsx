import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/account/AuthForm";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/login")({
  head: () =>
    pageHead("Entrar ou criar conta", "Acesse o ambiente demonstrativo PACK.", {
      robots: "noindex, nofollow",
    }),
  component: Page,
});
function Page() {
  return <AuthForm kind="customer" />;
}
