import { Button } from "@/components/ui/button";
import { saveAdminRecord } from "@/lib/api";
import { AdminRow, AdminTable } from "../AdminTable";
import type { AdminScreenProps } from "../tipos";

/** Inscritos na newsletter, com a opção de cancelar ou reativar a inscrição. */
export function SubscribersScreen({ data, busy, run }: AdminScreenProps) {
  return (
    <AdminTable
      filters={[{ key: "status", label: "Estado", options: ["Inscrito", "Cancelado"] }]}
      exportName="subscribers"
      headers={["E-mail", "Estado", "Ações"]}
    >
      {data.subscribers.map((s) => {
        const estado = s.active ? "Inscrito" : "Cancelado";
        return (
          <AdminRow key={s.id} values={[s.email, estado]} filters={{ status: estado }}>
            <td>{s.email}</td>
            <td>{estado}</td>
            <td>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void run(() => saveAdminRecord("subscribers", { ...s, active: !s.active }))
                }
              >
                {s.active ? "CANCELAR INSCRIÇÃO" : "REATIVAR"}
              </Button>
            </td>
          </AdminRow>
        );
      })}
    </AdminTable>
  );
}
