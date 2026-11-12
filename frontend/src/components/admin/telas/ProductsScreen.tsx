import { AdminRow, AdminTable } from "../AdminTable";
import { RowActions } from "../RowActions";
import { money } from "@/lib/checkout";
import type { Product } from "@/data/types";
import type { AdminScreenProps } from "../tipos";

const totalEmEstoque = (p: Product) => Object.values(p.stock ?? {}).reduce((s, v) => s + v, 0);
const estado = (p: Product) => (p.active === false ? "Oculto" : "Ativo");

/** Produtos: foto, preço, tags, estoque total e se aparece no catálogo. */
export function ProductsScreen({ data, busy, edit, remove }: AdminScreenProps) {
  return (
    <AdminTable
      filters={[
        { key: "status", label: "Estado", options: ["Ativo", "Oculto"] },
        { key: "type", label: "Categoria" },
        { key: "collection", label: "Coleção", options: data.collections.map((c) => c.tag) },
      ]}
      exportName="products"
      headers={["Produto", "Preço", "Tags / coleção", "Estoque", "Estado", "Ações"]}
    >
      {data.products.map((p) => (
        <AdminRow
          key={p.id}
          values={[p.name, p.price, p.tags?.join(", ") ?? "", totalEmEstoque(p), estado(p)]}
          filters={{ status: estado(p), type: p.type, collection: p.tags ?? [] }}
          search={[p.name, p.type, p.color, ...(p.tags ?? [])].join(" ")}
        >
          <td>
            <div className="flex items-center gap-3">
              <img src={p.image} alt={p.name} className="h-16 w-12 object-cover grayscale" />
              <span>
                {p.name}
                <small className="mt-1 block text-muted-foreground">
                  {p.type} · {p.color}
                </small>
              </span>
            </div>
          </td>
          <td>{money(p.price)}</td>
          <td>{p.tags?.join(", ")}</td>
          <td>{totalEmEstoque(p)}</td>
          <td>{estado(p)}</td>
          <td>
            <RowActions
              // cópia do estoque e das tags: o formulário não altera a lista antes de salvar
              onEdit={() => edit({ ...p, stock: { ...p.stock }, tags: [...(p.tags ?? [])] })}
              onDelete={() => remove("products", p.id)}
              disabled={busy}
            />
          </td>
        </AdminRow>
      ))}
    </AdminTable>
  );
}
