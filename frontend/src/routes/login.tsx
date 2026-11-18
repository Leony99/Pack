import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/account/AuthForm";
import { pageHead } from "@/lib/metadata";
/** Para onde voltar depois de entrar: só o checkout (sem ele, a área do cliente). */
type Busca = { voltar?: "/checkout" };

export const Route = createFileRoute("/login")({
  validateSearch: (busca: Record<string, unknown>): Busca =>
    busca["voltar"] === "/checkout" ? { voltar: "/checkout" } : {},
  head: () =>
    pageHead("Entrar ou criar conta", "Acesse o ambiente demonstrativo PACK.", {
      robots: "noindex, nofollow",
    }),
  component: Page,
});
function Page() {
  const { voltar } = Route.useSearch();
  return <AuthForm kind="customer" voltar={voltar} />;
}
