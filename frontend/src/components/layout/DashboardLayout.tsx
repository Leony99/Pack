import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, LogOut, LockKeyhole } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import { canStaff } from "@/lib/api";
import { accountNav, adminNav } from "./navegacao";

// Moldura da área do cliente e do painel admin: cabeçalho com o título, menu lateral e botão de sair.
// Sem sessão, mostra o convite para entrar no lugar do conteúdo.
export function DashboardLayout({
  kind,
  title,
  children,
}: {
  kind: "customer" | "staff";
  title: string;
  children: ReactNode;
}) {
  const { customer, staff, ready, signOut } = useSession();
  const navigate = useNavigate();
  const person = kind === "customer" ? customer : staff;
  if (!ready)
    return (
      <main className="mx-auto max-w-[1400px] p-8" role="status">
        Carregando conta...
      </main>
    );
  if (!person)
    return (
      <main className="mx-auto min-h-[55svh] max-w-[1400px] px-6 py-16">
        <LockKeyhole className="mb-6" />
        <h1 className="text-4xl">ACESSO À CONTA</h1>
        <p className="my-6 text-sm text-muted-foreground">
          Entre para acessar o painel de demonstração. Nenhum dado real é utilizado.
        </p>
        <Button asChild>
          <Link to={kind === "customer" ? "/login" : "/admin"}>
            ENTRAR <ArrowUpRight />
          </Link>
        </Button>
      </main>
    );
  const nav =
    kind === "customer"
      ? accountNav
      : adminNav.filter((n) => staff && canStaff(staff.role, n.resource));
  return (
    <main className="bg-background">
      <header className="border-b border-border bg-secondary">
        <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)] items-end gap-5 px-6 py-10 md:grid-cols-[minmax(0,1fr)_auto] md:py-14">
          <div className="min-w-0">
            <p className="mb-3 text-xs text-muted-foreground">
              PACK / {kind === "customer" ? "MINHA CONTA" : "ADMINISTRAÇÃO"}
            </p>
            <h1 className="text-4xl md:text-5xl">{title}</h1>
          </div>
          <p className="max-w-xs text-xs text-muted-foreground">
            AMBIENTE DEMONSTRATIVO · alterações apenas nesta sessão, sem cobranças ou envios.
          </p>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)] gap-8 px-6 py-10 lg:gap-10 lg:grid-cols-[210px_minmax(0,1fr)]">
        <aside className="min-w-0">
          <p className="break-words text-sm font-medium">{person.name}</p>
          <p className="mt-1 break-all text-xs text-muted-foreground">{person.email}</p>
          {staff && kind === "staff" && <p className="mt-2 text-xs uppercase">{staff.role}</p>}
          <nav className="my-6 flex gap-2 overflow-auto lg:flex-col">
            {nav.map((n) => (
              <Button
                key={n.to}
                asChild
                variant="ghost"
                className="shrink-0 justify-start rounded-none"
              >
                <Link
                  to={n.to}
                  activeOptions={{ exact: true }}
                  activeProps={{
                    className:
                      "bg-foreground text-background hover:bg-foreground hover:text-background",
                  }}
                >
                  {n.label}
                </Link>
              </Button>
            ))}
          </nav>
          <Button
            variant="outline"
            className="rounded-none"
            onClick={async () => {
              await signOut(kind);
              await navigate({ to: kind === "customer" ? "/login" : "/admin" });
            }}
          >
            <LogOut /> SAIR
          </Button>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
