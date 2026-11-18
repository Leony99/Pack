import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { painel, todasAsPaginas, type ProdutoDaApi } from "@/lib/api/painel";
import { money } from "@/lib/checkout";
import { AdminRow, AdminTable } from "../AdminTable";
import { RowActions } from "../RowActions";
import { Estado, Janela, type PropsDaAba } from "./comum";
import { EditorDeProduto } from "./EditorDeProduto";

/** A primeira foto do produto, na ordem da galeria. */
const capa = (p: ProdutoDaApi) => [...(p.imagens ?? [])].sort((a, b) => a.ordem - b.ordem)[0]?.url;

/**
 * Produtos: todos, ativos e inativos (GET /products/painel). Todo produto novo nasce inativo: ATIVAR
 * o coloca na loja e DESATIVAR o tira, sem perder pedidos nem estoque. Excluir só vale para quem
 * nunca esteve em um pedido (a API recusa os outros: o caminho é desativar).
 */
export function Produtos({ busy, run }: PropsDaAba) {
  const lista = useQuery({
    queryKey: ["painel", "produtos"],
    queryFn: () => todasAsPaginas<ProdutoDaApi>("/products/painel"),
  });
  // o produto aberto no editor: um id, ou "novo"
  const [aberto, setAberto] = useState<string | null>(null);

  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button className="h-11 rounded-none" onClick={() => setAberto("novo")}>
          <Plus /> NOVO PRODUTO
        </Button>
      </div>
      <Estado carregando={lista.isPending} erro={lista.error} />
      {lista.data && (
        <AdminTable
          exportName="produtos"
          filters={[{ key: "estado", label: "Estado", options: ["Ativo", "Inativo"] }]}
          headers={["Foto", "Nome", "Preço", "Estoque", "Estado", "Ações"]}
        >
          {lista.data.map((p) => {
            const estoque = (p.variantes ?? []).reduce((soma, v) => soma + v.quant, 0);
            const estado = p.ativo === false ? "Inativo" : "Ativo";
            return (
              <AdminRow
                key={p.id}
                values={[p.nome, p.nome, Number(p.preco), estoque, estado]}
                filters={{ estado }}
              >
                <td>
                  {capa(p) ? (
                    <img src={capa(p)} alt="" className="h-14 w-11 object-cover" />
                  ) : (
                    <span className="text-xs text-muted-foreground">sem foto</span>
                  )}
                </td>
                <td>{p.nome}</td>
                <td>{money(Number(p.preco))}</td>
                <td>{estoque}</td>
                <td>{estado}</td>
                <td>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mb-2"
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () =>
                          painel(
                            "PATCH",
                            `/products/${p.id}/${p.ativo === false ? "ativar" : "desativar"}`,
                          ),
                        p.ativo === false
                          ? "Produto ativado: já aparece na loja."
                          : "Produto desativado.",
                      )
                    }
                  >
                    {p.ativo === false ? "ATIVAR" : "DESATIVAR"}
                  </Button>
                  <RowActions
                    disabled={busy}
                    onEdit={() => setAberto(p.id)}
                    onDelete={() => {
                      if (
                        window.confirm(
                          `Excluir "${p.nome}"? Só funciona se ele nunca esteve em um pedido.`,
                        )
                      )
                        void run(() => painel("DELETE", `/products/${p.id}`), "Produto excluído.");
                    }}
                  />
                </td>
              </AdminRow>
            );
          })}
        </AdminTable>
      )}
      <Janela
        titulo={aberto === "novo" ? "NOVO PRODUTO" : "EDITAR PRODUTO"}
        aberta={!!aberto}
        fechar={() => setAberto(null)}
      >
        {aberto && (
          <EditorDeProduto
            key={aberto}
            id={aberto === "novo" ? undefined : aberto}
            busy={busy}
            run={run}
            aoCriar={(id) => setAberto(id)}
          />
        )}
      </Janela>
    </>
  );
}
