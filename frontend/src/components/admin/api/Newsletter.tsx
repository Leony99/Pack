import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { painel, todasAsPaginas, type InscritoDaApi } from "@/lib/api/painel";
import { AdminRow, AdminTable } from "../AdminTable";
import { Estado, type PropsDaAba } from "./comum";
import { dataHora } from "./formato";

/** Newsletter: a lista de inscritos (exportável em CSV), com tirar da lista e colocar de volta. */
export function Newsletter({ busy, run }: PropsDaAba) {
  const lista = useQuery({
    queryKey: ["painel", "inscritos"],
    queryFn: () => todasAsPaginas<InscritoDaApi>("/newsletter"),
  });
  return (
    <>
      <Estado carregando={lista.isPending} erro={lista.error} />
      {lista.data && (
        <AdminTable
          exportName="newsletter"
          filters={[{ key: "situacao", label: "Situação", options: ["Inscrito", "Saiu"] }]}
          headers={["E-mail", "Desde", "Situação", "Ações"]}
        >
          {lista.data.map((i) => {
            const situacao = i.ativo ? "Inscrito" : "Saiu";
            return (
              <AdminRow key={i.id} values={[i.email, i.criadoEm, situacao]} filters={{ situacao }}>
                <td>{i.email}</td>
                <td>{dataHora(i.criadoEm)}</td>
                <td>{situacao}</td>
                <td>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () => painel("PATCH", `/newsletter/${i.id}?ativo=${!i.ativo}`),
                        i.ativo ? "E-mail tirado da lista." : "E-mail de volta à lista.",
                      )
                    }
                  >
                    {i.ativo ? "TIRAR DA LISTA" : "COLOCAR DE VOLTA"}
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
