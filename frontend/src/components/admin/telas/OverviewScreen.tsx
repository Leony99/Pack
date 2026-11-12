import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Metric } from "@/components/common/Metric";
import { adminNav } from "@/components/layout/navegacao";
import { canStaff } from "@/lib/api";
import { money } from "@/lib/checkout";
import { FINALIZADO } from "@/lib/dominio";
import { useSession } from "@/lib/session";
import type { AdminData } from "../tipos";

/** Visão geral do painel: números, atalhos das seções do cargo e os 5 pedidos mais recentes. */
export function OverviewScreen({ data }: { data: AdminData }) {
  const { staff } = useSession();
  const totalSimulado = data.orders
    .filter((o) => o.status !== "Cancelado")
    .reduce((soma, o) => soma + o.total, 0);
  const emAndamento = data.orders.filter((o) => !FINALIZADO.includes(o.status)).length;
  const variantesSemEstoque = data.products.reduce(
    (soma, p) => soma + Object.values(p.stock ?? {}).filter((qtd) => qtd === 0).length,
    0,
  );
  const atalhos = adminNav.filter(
    (n) => n.to !== "/admin/painel" && staff && canStaff(staff.role, n.resource),
  );

  return (
    <>
      <div className="grid gap-px border border-ink/10 bg-ink/10 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="TOTAL SIMULADO" value={money(totalSimulado)} />
        <Metric label="PEDIDOS" value={String(data.orders.length)} />
        <Metric label="EM ANDAMENTO" value={String(emAndamento)} />
        <Metric label="VARIANTES SEM ESTOQUE" value={String(variantesSemEstoque)} />
      </div>
      <h2 className="mb-4 mt-10 text-2xl">OPERAÇÃO</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {atalhos.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="flex justify-between py-4 hover:bg-secondary px-3 text-sm"
          >
            {n.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ))}
      </div>
      <h2 className="mb-4 mt-10 text-2xl">PEDIDOS RECENTES</h2>
      {data.orders
        .slice(-5)
        .reverse()
        .map((o) => (
          <Link
            key={o.id}
            to="/admin/pedidos/$id"
            params={{ id: o.id }}
            className="flex flex-wrap justify-between gap-3 py-4 hover:bg-secondary px-3 text-sm"
          >
            <span>
              {o.id} · {o.customer.name}
            </span>
            <span>
              {o.status} / {money(o.total)}
            </span>
          </Link>
        ))}
    </>
  );
}
