import { Button } from "@/components/ui/button";
import { saveAdminRecord } from "@/lib/api";
import { AdminRow, AdminTable } from "../AdminTable";
import type { AdminScreenProps } from "../tipos";

const ABERTO = "Aberto";
const RESPONDIDO = "Respondido (simulado)";

/** Mensagens do formulário de contato, que podem ser marcadas como respondidas ou reabertas. */
export function MessagesScreen({ data, busy, run }: AdminScreenProps) {
  return (
    <AdminTable
      filters={[{ key: "status", label: "Status", options: [ABERTO, RESPONDIDO] }]}
      headers={["Contato", "Mensagem", "Status", "Ações"]}
    >
      {data.messages.map((m) => (
        <AdminRow
          key={m.id}
          values={[m.name, m.message, m.status]}
          filters={{ status: m.status }}
          search={[m.name, m.email, m.message, m.status].join(" ")}
        >
          <td>
            {m.name}
            <p className="mt-2 text-xs">{m.email}</p>
          </td>
          <td className="max-w-md whitespace-normal">{m.message}</td>
          <td>{m.status}</td>
          <td>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() =>
                void run(() =>
                  saveAdminRecord("messages", {
                    ...m,
                    status: m.status === ABERTO ? RESPONDIDO : ABERTO,
                  }),
                )
              }
            >
              {m.status === ABERTO ? "MARCAR RESPONDIDO" : "REABRIR"}
            </Button>
          </td>
        </AdminRow>
      ))}
    </AdminTable>
  );
}
