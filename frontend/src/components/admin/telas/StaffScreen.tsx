import { AdminRow, AdminTable } from "../AdminTable";
import { RowActions } from "../RowActions";
import type { AdminScreenProps } from "../tipos";

/** Colaboradores: cargo e se o acesso está ativo. */
export function StaffScreen({ data, busy, edit, remove }: AdminScreenProps) {
  return (
    <AdminTable
      filters={[
        { key: "role", label: "Cargo", options: ["admin", "operacao", "atendimento"] },
        { key: "status", label: "Estado", options: ["Ativo", "Inativo"] },
      ]}
      headers={["Colaborador", "E-mail", "Cargo", "Estado", "Ações"]}
    >
      {data.staff.map((s) => {
        const estado = s.active ? "Ativo" : "Inativo";
        return (
          <AdminRow
            key={s.id}
            values={[s.name, s.email, s.role, estado]}
            filters={{ role: s.role, status: estado }}
          >
            <td>{s.name}</td>
            <td>{s.email}</td>
            <td>{s.role}</td>
            <td>{estado}</td>
            <td>
              <RowActions
                onEdit={() => edit({ ...s })}
                onDelete={() => remove("staff", s.id)}
                disabled={busy}
              />
            </td>
          </AdminRow>
        );
      })}
    </AdminTable>
  );
}
