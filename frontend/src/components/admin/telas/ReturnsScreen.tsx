import { selectClass } from "@/components/common/classes";
import { saveAdminRecord } from "@/lib/api";
import { STATUS_DE_TROCA } from "@/lib/dominio";
import { AdminRow, AdminTable } from "../AdminTable";
import type { AdminScreenProps } from "../tipos";

/** Trocas e devoluções pedidas pelos clientes; o status muda direto pelo seletor da linha. */
export function ReturnsScreen({ data, busy, run }: AdminScreenProps) {
  return (
    <AdminTable
      filters={[{ key: "status", label: "Status", options: STATUS_DE_TROCA }]}
      headers={["Pedido", "Motivo", "Status", "Ações"]}
    >
      {data.returns.map((r) => (
        <AdminRow
          key={r.id}
          values={[r.orderId, r.reason, r.status]}
          filters={{ status: r.status }}
        >
          <td>{r.orderId}</td>
          <td>{r.reason}</td>
          <td>{r.status}</td>
          <td>
            <select
              aria-label={`Status da troca ${r.orderId}`}
              value={r.status}
              disabled={busy}
              className={selectClass}
              onChange={(e) =>
                void run(() => saveAdminRecord("returns", { ...r, status: e.target.value }))
              }
            >
              {STATUS_DE_TROCA.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </td>
        </AdminRow>
      ))}
    </AdminTable>
  );
}
