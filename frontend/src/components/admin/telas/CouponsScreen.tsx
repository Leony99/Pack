import { money } from "@/lib/checkout";
import type { Coupon } from "@/data/types";
import { AdminRow, AdminTable } from "../AdminTable";
import { RowActions } from "../RowActions";
import type { AdminScreenProps } from "../tipos";

/** Cupom vencido é o que tem validade antes de hoje (a data vem como AAAA-MM-DD). */
function situacao(c: Coupon): string {
  if (!c.validUntil) return "Sem validade";
  const hoje = new Date().toISOString().slice(0, 10);
  return c.validUntil.slice(0, 10) < hoje ? "Expirado" : "Válido";
}

/** Cupons: código, desconto (percentual ou em reais) e validade. */
export function CouponsScreen({ data, busy, edit, remove }: AdminScreenProps) {
  return (
    <AdminTable
      filters={[
        { key: "type", label: "Tipo", options: ["Percentual", "Valor fixo"] },
        { key: "validity", label: "Validade", options: ["Válido", "Expirado", "Sem validade"] },
      ]}
      headers={["Código", "Desconto", "Validade", "Ações"]}
    >
      {data.coupons.map((c) => (
        <AdminRow
          key={c.code}
          values={[c.code, c.discount, c.validUntil]}
          filters={{
            type: c.type === "percent" ? "Percentual" : "Valor fixo",
            validity: situacao(c),
          }}
        >
          <td>{c.code}</td>
          <td>{c.type === "percent" ? `${c.discount}%` : money(c.discount)}</td>
          <td>{c.validUntil ?? "Sem validade"}</td>
          <td>
            <RowActions
              onEdit={() => edit({ ...c })}
              onDelete={() => remove("coupons", c.code)}
              disabled={busy}
            />
          </td>
        </AdminRow>
      ))}
    </AdminTable>
  );
}
