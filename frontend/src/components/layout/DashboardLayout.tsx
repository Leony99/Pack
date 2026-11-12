import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, LogOut, LockKeyhole } from "lucide-react";
import type { ReactNode } from "react";
import manga from "@/assets/product-longsleeve.jpg";
import { useSession } from "@/lib/session";
import { canStaff } from "@/lib/api";
import { accountNav, adminNav } from "./navegacao";
import { CardAviso, PaginaTopo, ROTULO } from "./PaginaTopo";

const AVISO_DEMO = (
  <CardAviso
    escuro
    rotulo="AMBIENTE"
    valor="DEMO"
    texto="alterações só nesta sessão, sem cobranças ou envios"
  />
);

// Moldura da área do cliente e do painel admin: o topo escuro com o título, o menu lateral em
// caixas quadradas e o botão de sair. Sem sessão, mostra o convite para entrar no lugar do conteúdo.
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
  const caminho = kind === "customer" ? "PACK / MINHA CONTA" : "PACK / ADMINISTRAÇÃO";

  if (!ready)
    return (
      <main>
        <PaginaTopo caminho={caminho} titulo="CARREGANDO" imagem={manga} />
        <p role="status" className="mx-auto w-full max-w-[1200px] px-4 py-10 md:px-6">
          Carregando conta...
        </p>
      </main>
    );
  if (!person)
    return (
      <main>
        <PaginaTopo
          caminho={caminho}
          titulo="ACESSO À CONTA"
          imagem={manga}
          texto="Entre para acessar o painel de demonstração. Nenhum dado real é utilizado."
          lado={AVISO_DEMO}
        />
        <div className="mx-auto w-full max-w-[1200px] px-4 py-12 md:px-6">
          <Link
            to={kind === "customer" ? "/login" : "/admin"}
            className="group inline-flex items-center gap-4 border border-ink/10 p-6 transition-colors hover:bg-ink hover:text-paper"
          >
            <LockKeyhole className="h-5 w-5" />
            <span className={ROTULO}>ENTRAR</span>
            <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </main>
    );

  const nav =
    kind === "customer"
      ? accountNav
      : adminNav.filter((n) => staff && canStaff(staff.role, n.resource));
  return (
    <main className="bg-background">
      <PaginaTopo
        caminho={caminho}
        titulo={title}
        imagem={manga}
        lado={
          <>
            <CardAviso
              rotulo={kind === "customer" ? "CLIENTE" : (staff?.role ?? "EQUIPE").toUpperCase()}
              valor={person.name.split(" ")[0]}
              texto={<span className="break-all">{person.email}</span>}
            />
            {AVISO_DEMO}
          </>
        }
      />
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-[minmax(0,1fr)] gap-8 px-4 py-10 md:px-6 md:py-14 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-12">
        <aside className="min-w-0">
          <p className={`${ROTULO} mb-3 flex items-center gap-2`}>
            <span className="h-1.5 w-1.5 bg-destaque" /> [ MENU ]
          </p>
          <nav className="flex gap-px overflow-auto border border-ink/10 bg-ink/10 lg:flex-col">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: true }}
                className="shrink-0 bg-paper px-4 py-3 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors hover:bg-ink/5"
                activeProps={{ className: "!bg-ink !text-paper" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <button
            className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 border border-ink/10 px-4 py-3 text-[11px] font-medium tracking-[0.2em] transition-colors hover:bg-ink hover:text-paper lg:justify-start"
            onClick={async () => {
              await signOut(kind);
              await navigate({ to: kind === "customer" ? "/login" : "/admin" });
            }}
          >
            <LogOut className="h-4 w-4" /> SAIR
          </button>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
