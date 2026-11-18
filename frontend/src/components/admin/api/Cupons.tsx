import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { selectClass } from "@/components/common/classes";
import { FormField } from "@/components/common/FormField";
import { Button } from "@/components/ui/button";
import { painel, todasAsPaginas, type CupomDaApi } from "@/lib/api/painel";
import { money } from "@/lib/checkout";
import { AdminRow, AdminTable } from "../AdminTable";
import { RowActions } from "../RowActions";
import { Estado, Janela, type PropsDaAba } from "./comum";
import { dataHora } from "./formato";

type Rascunho = {
  id?: string;
  codigo: string;
  desconto: string;
  tipo: "PERCENTUAL" | "FIXO";
  validade: string;
};

const vazio: Rascunho = { codigo: "", desconto: "10", tipo: "PERCENTUAL", validade: "" };

/** Cupons: código, desconto (percentual ou em reais) e validade, com criar, editar e excluir. */
export function Cupons({ busy, run }: PropsDaAba) {
  const lista = useQuery({
    queryKey: ["painel", "cupons"],
    queryFn: () => todasAsPaginas<CupomDaApi>("/coupons"),
  });
  const [aberto, setAberto] = useState<Rascunho | null>(null);
  const agora = Date.now();

  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button className="h-11 rounded-none" onClick={() => setAberto(vazio)}>
          <Plus /> NOVO CUPOM
        </Button>
      </div>
      <Estado carregando={lista.isPending} erro={lista.error} />
      {lista.data && (
        <AdminTable
          exportName="cupons"
          filters={[{ key: "situacao", label: "Validade", options: ["Válido", "Expirado"] }]}
          headers={["Código", "Desconto", "Validade", "Ações"]}
        >
          {lista.data.map((c) => {
            const situacao = c.validade && Date.parse(c.validade) < agora ? "Expirado" : "Válido";
            return (
              <AdminRow
                key={c.id}
                values={[c.codigo, Number(c.desconto), c.validade]}
                filters={{ situacao }}
              >
                <td>{c.codigo}</td>
                <td>
                  {c.tipo === "PERCENTUAL" ? `${Number(c.desconto)}%` : money(Number(c.desconto))}
                </td>
                <td>
                  {dataHora(c.validade)} · {situacao}
                </td>
                <td>
                  <RowActions
                    disabled={busy}
                    onEdit={() =>
                      setAberto({
                        id: c.id,
                        codigo: c.codigo,
                        desconto: String(c.desconto),
                        tipo: c.tipo,
                        validade: (c.validade ?? "").slice(0, 16),
                      })
                    }
                    onDelete={() => {
                      if (window.confirm(`Excluir o cupom ${c.codigo}?`))
                        void run(() => painel("DELETE", `/coupons/${c.id}`), "Cupom excluído.");
                    }}
                  />
                </td>
              </AdminRow>
            );
          })}
        </AdminTable>
      )}
      <Janela
        titulo={aberto?.id ? "EDITAR CUPOM" : "NOVO CUPOM"}
        aberta={!!aberto}
        fechar={() => setAberto(null)}
      >
        {aberto && (
          <FormularioDeCupom
            inicial={aberto}
            busy={busy}
            salvar={(r) =>
              void run(
                () =>
                  painel(r.id ? "PUT" : "POST", r.id ? `/coupons/${r.id}` : "/coupons", {
                    codigo: r.codigo.trim().toUpperCase(),
                    desconto: Number(r.desconto),
                    tipo: r.tipo,
                    validade: r.validade.length === 16 ? `${r.validade}:00` : r.validade,
                  }),
                "Cupom salvo.",
              ).then((ok) => ok && setAberto(null))
            }
          />
        )}
      </Janela>
    </>
  );
}

function FormularioDeCupom({
  inicial,
  busy,
  salvar,
}: {
  inicial: Rascunho;
  busy: boolean;
  salvar: (r: Rascunho) => void;
}) {
  const [r, setR] = useState(inicial);
  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        salvar(r);
      }}
    >
      <FormField
        label="Código"
        value={r.codigo}
        maxLength={30}
        required
        onChange={(e) => setR({ ...r, codigo: e.target.value })}
      />
      <label>
        <span className="mb-2 block text-xs">Tipo</span>
        <select
          aria-label="Tipo"
          className={selectClass}
          value={r.tipo}
          onChange={(e) => setR({ ...r, tipo: e.target.value as Rascunho["tipo"] })}
        >
          <option value="PERCENTUAL">Percentual (%)</option>
          <option value="FIXO">Valor fixo (R$)</option>
        </select>
      </label>
      <FormField
        label={r.tipo === "PERCENTUAL" ? "Desconto (%)" : "Desconto (R$)"}
        type="number"
        min="0.01"
        max={r.tipo === "PERCENTUAL" ? "100" : "1000000"}
        step="0.01"
        required
        value={r.desconto}
        onChange={(e) => setR({ ...r, desconto: e.target.value })}
      />
      <FormField
        label="Válido até"
        type="datetime-local"
        required
        value={r.validade}
        onChange={(e) => setR({ ...r, validade: e.target.value })}
      />
      <Button disabled={busy} className="rounded-none sm:col-span-2">
        SALVAR CUPOM
      </Button>
    </form>
  );
}
