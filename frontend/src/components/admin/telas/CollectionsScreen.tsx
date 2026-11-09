import { Link } from "@tanstack/react-router";
import { AdminRow, AdminTable } from "../AdminTable";
import { RowActions } from "../RowActions";
import type { AdminScreenProps } from "../tipos";

/** Coleções: cada uma é uma tag, e os produtos com essa tag fazem parte dela. */
export function CollectionsScreen({ data, busy, edit, remove }: AdminScreenProps) {
  const produtosDa = (tag: string) => data.products.filter((p) => p.tags?.includes(tag)).length;

  return (
    <AdminTable
      filters={[
        { key: "membership", label: "Produtos", options: ["Com produtos", "Sem produtos"] },
      ]}
      headers={["Coleção", "Tag", "Produtos", "Ações"]}
    >
      {data.collections.map((c) => (
        <AdminRow
          key={c.id}
          values={[c.name, c.tag, produtosDa(c.tag)]}
          filters={{ membership: produtosDa(c.tag) > 0 ? "Com produtos" : "Sem produtos" }}
          search={[c.name, c.tag, c.description].join(" ")}
        >
          <td>
            <Link to="/colecao/$slug" params={{ slug: c.tag }} className="underline">
              {c.name}
            </Link>
            <p className="mt-2 text-xs text-muted-foreground">{c.description}</p>
          </td>
          <td>{c.tag}</td>
          <td>{produtosDa(c.tag)}</td>
          <td>
            <RowActions
              onEdit={() => edit({ ...c })}
              onDelete={() => remove("collections", c.id)}
              disabled={busy}
            />
          </td>
        </AdminRow>
      ))}
    </AdminTable>
  );
}
