import { useQuery } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { painel, todasAsPaginas, type MensagemDaApi } from "@/lib/api/painel";
import { AdminRow, AdminTable } from "../AdminTable";
import { Estado, type PropsDaAba } from "./comum";
import { dataHora } from "./formato";

/**
 * Atendimento: as mensagens do formulário de Contato (dúvidas, trocas e devoluções). A equipe responde
 * por e-mail (RESPONDER abre o programa de e-mail) e marca como respondida.
 */
export function Atendimento({ busy, run }: PropsDaAba) {
  const lista = useQuery({
    queryKey: ["painel", "mensagens"],
    queryFn: () => todasAsPaginas<MensagemDaApi>("/contato"),
  });
  return (
    <>
      <Estado carregando={lista.isPending} erro={lista.error} />
      {lista.data && (
        <AdminTable
          exportName="mensagens"
          filters={[{ key: "status", label: "Status", options: ["Nova", "Respondida"] }]}
          headers={["Data", "De", "Mensagem", "Status", "Ações"]}
        >
          {lista.data.map((m) => {
            const status = m.status === "NOVA" ? "Nova" : "Respondida";
            return (
              <AdminRow
                key={m.id}
                values={[m.criadoEm, m.nome, m.mensagem, status]}
                filters={{ status }}
              >
                <td>{dataHora(m.criadoEm)}</td>
                <td>
                  {m.nome}
                  <br />
                  <span className="text-xs text-muted-foreground">{m.email}</span>
                </td>
                <td className="max-w-md whitespace-pre-wrap text-sm">
                  {m.assunto && <strong className="block">{m.assunto}</strong>}
                  {m.mensagem}
                </td>
                <td>{status}</td>
                <td className="space-y-2">
                  <Button asChild size="sm" variant="outline">
                    <a
                      href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.assunto ?? "Contato PACK"}`)}`}
                    >
                      <Mail /> RESPONDER
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () =>
                          painel(
                            "PATCH",
                            `/contato/${m.id}?status=${m.status === "NOVA" ? "RESPONDIDA" : "NOVA"}`,
                          ),
                        m.status === "NOVA"
                          ? "Mensagem marcada como respondida."
                          : "Mensagem marcada como nova.",
                      )
                    }
                  >
                    {m.status === "NOVA" ? "MARCAR RESPONDIDA" : "MARCAR NOVA"}
                  </Button>
                </td>
              </AdminRow>
            );
          })}
        </AdminTable>
      )}
    </>
  );
}
