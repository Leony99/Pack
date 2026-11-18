import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { selectClass } from "@/components/common/classes";
import { FormField } from "@/components/common/FormField";
import { Button } from "@/components/ui/button";
import { painel, todasAsPaginas, type MovimentoDaApi, type ProdutoDaApi } from "@/lib/api/painel";
import { AdminRow, AdminTable } from "../AdminTable";
import { Estado, Janela, type PropsDaAba } from "./comum";
import { dataHora } from "./formato";

/** Até quantas unidades a variante conta como "estoque baixo" (o mesmo do resumo da API). */
const ESTOQUE_BAIXO = 5;

type Linha = {
  id: string;
  sku: string;
  produto: string;
  tamanho: string;
  cor: string;
  quant: number;
};

/**
 * Estoque: cada variante de cada produto, com o filtro de estoque baixo. MOVIMENTAR registra uma
 * entrada, saída, devolução ou ajuste (POST /inventory/movements) e mostra o histórico da variante:
 * o estoque só muda por movimento, e cada um fica guardado com o motivo.
 */
export function Estoque({ busy, run }: PropsDaAba) {
  const produtos = useQuery({
    queryKey: ["painel", "produtos"],
    queryFn: () => todasAsPaginas<ProdutoDaApi>("/products/painel"),
  });
  const [aberta, setAberta] = useState<Linha | null>(null);
  const linhas: Linha[] = (produtos.data ?? []).flatMap((p) =>
    (p.variantes ?? []).map((v) => ({
      id: v.id,
      sku: v.sku,
      produto: p.nome,
      tamanho: v.size?.label ?? "",
      cor: v.color?.nome ?? "",
      quant: v.quant,
    })),
  );

  return (
    <>
      <Estado carregando={produtos.isPending} erro={produtos.error} />
      {produtos.data && (
        <AdminTable
          exportName="estoque"
          defaultSort={null}
          filters={[{ key: "nivel", label: "Estoque", options: ["Baixo", "Normal"] }]}
          headers={["Produto", "Variante", "SKU", "Estoque", "Movimentar"]}
        >
          {linhas.map((l) => (
            <AdminRow
              key={l.id}
              values={[l.produto, `${l.tamanho} ${l.cor}`, l.sku, l.quant]}
              filters={{ nivel: l.quant <= ESTOQUE_BAIXO ? "Baixo" : "Normal" }}
            >
              <td>{l.produto}</td>
              <td>
                {l.tamanho} · {l.cor}
              </td>
              <td className="font-mono text-xs">{l.sku}</td>
              <td className={l.quant <= ESTOQUE_BAIXO ? "font-semibold text-destaque" : ""}>
                {l.quant}
              </td>
              <td>
                <Button size="sm" variant="outline" onClick={() => setAberta(l)}>
                  MOVIMENTAR
                </Button>
              </td>
            </AdminRow>
          ))}
        </AdminTable>
      )}
      <Janela titulo="MOVIMENTAR ESTOQUE" aberta={!!aberta} fechar={() => setAberta(null)}>
        {aberta && <Movimento linha={aberta} busy={busy} run={run} />}
      </Janela>
    </>
  );
}

function Movimento({ linha, busy, run }: PropsDaAba & { linha: Linha }) {
  const historico = useQuery({
    queryKey: ["painel", "movimentos", linha.id],
    queryFn: () =>
      painel<MovimentoDaApi[] | { itens: MovimentoDaApi[] }>(
        "GET",
        `/variants/${linha.id}/movements`,
      ),
  });
  const movimentos = Array.isArray(historico.data) ? historico.data : (historico.data?.itens ?? []);
  const [tipo, setTipo] = useState("ENTRADA");
  const [quantidade, setQuantidade] = useState("1");
  const [motivo, setMotivo] = useState("");

  function registrar(e: FormEvent) {
    e.preventDefault();
    void run(
      () =>
        painel("POST", "/inventory/movements", {
          variantId: linha.id,
          tipoMovimentacao: tipo,
          quantidade: Number(quantidade),
          motivo: motivo || null,
        }),
      "Movimento registrado.",
    ).then((ok) => ok && setMotivo(""));
  }

  return (
    <>
      <p className="text-sm">
        {linha.produto} · {linha.tamanho} · {linha.cor} ·{" "}
        <span className="font-mono text-xs">{linha.sku}</span>
      </p>
      <form onSubmit={registrar} className="grid gap-3 sm:grid-cols-3">
        <label>
          <span className="mb-2 block text-xs">Tipo</span>
          <select
            aria-label="Tipo"
            className={selectClass}
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="ENTRADA">Entrada (soma)</option>
            <option value="SAIDA">Saída (tira)</option>
            <option value="DEVOLUCAO">Devolução (soma)</option>
            <option value="AJUSTE">Ajuste (o estoque passa a ser)</option>
          </select>
        </label>
        <FormField
          label="Quantidade"
          type="number"
          min="0"
          max="100000"
          step="1"
          required
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
        />
        <FormField
          label="Motivo"
          value={motivo}
          maxLength={200}
          onChange={(e) => setMotivo(e.target.value)}
        />
        <Button disabled={busy} className="rounded-none sm:col-span-3">
          REGISTRAR
        </Button>
      </form>
      <h3 className="mt-4 text-xl">HISTÓRICO</h3>
      <Estado carregando={historico.isPending} erro={historico.error} />
      <ul className="divide-y divide-border text-xs">
        {movimentos.map((m) => (
          <li key={m.id} className="flex justify-between gap-3 py-2">
            <span>{dataHora(m.data)}</span>
            <span>
              {m.tipoMovimentacao} {m.quantidade}
            </span>
            <span className="text-muted-foreground">{m.motivo}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
