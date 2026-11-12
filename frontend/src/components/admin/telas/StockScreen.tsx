import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adjustStock } from "@/lib/api";
import { TAMANHOS } from "@/lib/dominio";
import { AdminRow, AdminTable } from "../AdminTable";
import type { AdminScreenProps } from "../tipos";

/** Na ordenação, o tamanho vale pela posição (PP antes de P...), e não pela ordem alfabética. */
const ordemDoTamanho = (size: string) => (TAMANHOS as readonly string[]).indexOf(size);

/** Estoque: saldo de cada produto e tamanho, com movimentação manual, e o histórico das movimentações. */
export function StockScreen({ data, busy, run }: AdminScreenProps) {
  const nomeDo = (productId: string) => data.products.find((p) => p.id === productId)?.name;

  return (
    <>
      <AdminTable
        filters={[
          { key: "size", label: "Tamanho", options: [...TAMANHOS] },
          { key: "stock", label: "Disponibilidade", options: ["Com estoque", "Esgotado"] },
        ]}
        headers={["Produto", "Tamanho", "Saldo", "Movimentar"]}
      >
        {data.products.flatMap((p) =>
          Object.entries(p.stock ?? {}).map(([size, qty]) => (
            <AdminRow
              key={p.id + size}
              values={[p.name, ordemDoTamanho(size), qty]}
              filters={{ size, stock: qty === 0 ? "Esgotado" : "Com estoque" }}
              search={p.name + " " + size}
            >
              <td>{p.name}</td>
              <td>{size}</td>
              <td>{qty === 0 ? "ESGOTADO" : qty}</td>
              <td>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const campos = new FormData(form);
                    void run(async () => {
                      await adjustStock(
                        p.id,
                        size,
                        Number(campos.get("delta")),
                        String(campos.get("reason")),
                      );
                      form.reset();
                    }, "Estoque movimentado.");
                  }}
                >
                  <input
                    aria-label={`Quantidade ${p.name} ${size}`}
                    name="delta"
                    type="number"
                    step="1"
                    required
                    placeholder="+/−"
                    className="h-9 w-20 border border-input px-2"
                  />
                  <input
                    aria-label={`Motivo ${p.name} ${size}`}
                    name="reason"
                    required
                    placeholder="Motivo"
                    className="h-9 w-32 border border-input px-2"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    disabled={busy}
                    aria-label={`Salvar estoque ${p.name} ${size}`}
                  >
                    <Save />
                  </Button>
                </form>
              </td>
            </AdminRow>
          )),
        )}
      </AdminTable>
      <h2 className="mt-10 mb-5 text-2xl">MOVIMENTAÇÕES</h2>
      {!data.stockMovements.length ? (
        <p className="text-sm text-muted-foreground">Nenhuma movimentação manual.</p>
      ) : (
        <AdminTable
          defaultSort={0}
          filters={[
            { key: "size", label: "Tamanho" },
            { key: "movement", label: "Movimento", options: ["Entrada", "Saída"] },
          ]}
          headers={["Data", "Produto", "Tamanho", "Quantidade", "Motivo"]}
        >
          {[...data.stockMovements].reverse().map((m) => (
            <AdminRow
              key={m.id}
              values={[
                m.date,
                nomeDo(m.productId) ?? m.productId,
                ordemDoTamanho(m.size),
                m.delta,
                m.reason,
              ]}
              filters={{ size: m.size, movement: m.delta > 0 ? "Entrada" : "Saída" }}
              search={[nomeDo(m.productId), m.size, m.reason].join(" ")}
            >
              <td>{new Date(m.date).toLocaleString("pt-BR")}</td>
              <td>{nomeDo(m.productId) ?? m.productId}</td>
              <td>{m.size}</td>
              <td>
                {m.delta > 0 ? "+" : ""}
                {m.delta}
              </td>
              <td>{m.reason}</td>
            </AdminRow>
          ))}
        </AdminTable>
      )}
    </>
  );
}
