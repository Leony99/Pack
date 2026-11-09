import { Children, isValidElement, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { selectClass } from "@/components/common/classes";
import {
  baixarCsv,
  gerarCsv,
  selectTableRows,
  type TableRecord,
  type TableState,
} from "@/lib/table";

type RowProps = TableRecord & { children: ReactNode };

/**
 * Uma linha da tabela. Os props values, filters e search não aparecem: o AdminTable os lê para
 * buscar, filtrar, ordenar e exportar; as células visíveis são os <td> filhos.
 */
export function AdminRow({ children }: RowProps) {
  return <tr>{children}</tr>;
}
/** Um filtro: sem "options", as opções são os valores que aparecem nas linhas. */
type Filter = { key: string; label: string; options?: string[] };

/** Colunas de botões, que não fazem sentido ordenar. */
const SEM_ORDENACAO = ["Ações", "Detalhes", "Movimentar"];

/**
 * Tabela do painel com busca, filtros, ordenação por coluna e exportação para CSV.
 * Tudo acontece na tela, sobre as linhas recebidas. defaultSort é a coluna da ordem inicial
 * (decrescente); sem ele, a ordem é a da lista.
 */
export function AdminTable({
  headers,
  children,
  filters = [],
  exportName,
  defaultSort = null,
}: {
  headers: string[];
  children: ReactNode;
  filters?: Filter[];
  exportName?: string;
  defaultSort?: number | null;
}) {
  const inicial: TableState = {
    search: "",
    filters: {},
    sort: defaultSort,
    direction: defaultSort === null ? "asc" : "desc",
  };
  const [state, setState] = useState<TableState>(inicial);
  const rows = Children.toArray(children)
    .filter(isValidElement<RowProps>)
    .map((element) => ({ ...element.props, element }));
  const visible = selectTableRows(rows, state);
  const filtered = !!state.search || Object.values(state.filters).some(Boolean);
  const mudouDoInicial =
    filtered || state.sort !== inicial.sort || state.direction !== inicial.direction;

  // exporta o que está visível; colunas sem valor nas linhas (as de botões) ficam de fora
  function exportarCsv() {
    const colunas = headers.filter((_, i) => rows.some((r) => i < r.values.length));
    baixarCsv(gerarCsv(colunas, visible), `pack-${exportName}-demo.csv`);
  }
  return (
    <section className="min-w-0">
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 sm:flex sm:flex-wrap">
        <label className="relative block min-w-0 sm:min-w-52 sm:flex-1">
          <span className="mb-2 block text-xs text-muted-foreground">Busca</span>
          <Search className="absolute bottom-3.5 left-3 h-4 w-4 text-muted-foreground" />
          <input
            aria-label="Buscar registros"
            placeholder="Buscar registros..."
            value={state.search}
            onChange={(e) => setState((s) => ({ ...s, search: e.target.value }))}
            className="h-11 w-full border border-input bg-background pl-10 pr-3 text-sm"
          />
        </label>
        {exportName && (
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-none shrink-0"
            aria-label="Exportar CSV"
            title="Exportar resultados em CSV"
            onClick={exportarCsv}
          >
            <Download />
          </Button>
        )}
        <div className="col-span-2 grid min-w-0 grid-cols-1 gap-3 sm:flex sm:flex-wrap">
          {filters.map((filter) => (
            <label key={filter.key} className="min-w-0 sm:w-44">
              <span className="mb-2 block text-xs text-muted-foreground">{filter.label}</span>
              <select
                aria-label={`Filtrar ${filter.label.toLowerCase()}`}
                className={selectClass}
                value={state.filters[filter.key] ?? ""}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    filters: { ...s.filters, [filter.key]: e.target.value },
                  }))
                }
              >
                <option value="">Todos</option>
                {(
                  filter.options ??
                  Array.from(new Set(rows.flatMap((r) => r.filters?.[filter.key] ?? []))).sort(
                    (a, b) => a.localeCompare(b, "pt-BR"),
                  )
                ).map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>
      <div className="mb-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <p role="status">
          {visible.length} de {rows.length} registro{rows.length === 1 ? "" : "s"}
        </p>
        {mudouDoInicial && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-none"
            onClick={() => setState(inicial)}
          >
            <X /> LIMPAR
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm [&_td]:px-3 [&_td]:py-4 [&_td]:align-middle [&_td]:break-words [&_tbody_tr:nth-child(even)]:bg-secondary/50 [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-secondary">
          <thead className="bg-secondary">
            <tr>
              {headers.map((header, index) => {
                const sortable =
                  rows.some((r) => index < r.values.length) || !SEM_ORDENACAO.includes(header);
                const active = state.sort === index;
                const direcao = state.direction === "asc" ? "ascending" : "descending";
                return (
                  <th
                    key={header}
                    aria-sort={sortable ? (active ? direcao : "none") : undefined}
                    className="px-3 py-3 text-xs font-medium uppercase whitespace-nowrap"
                  >
                    {sortable ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 rounded-none text-xs uppercase"
                        aria-label={`Ordenar por ${header.toLowerCase()}`}
                        onClick={() =>
                          setState((s) => ({
                            ...s,
                            sort: index,
                            direction: s.sort === index && s.direction === "asc" ? "desc" : "asc",
                          }))
                        }
                      >
                        {header}
                        {active ? (
                          state.direction === "asc" ? (
                            <ArrowUp />
                          ) : (
                            <ArrowDown />
                          )
                        ) : (
                          <ArrowUpDown className="text-muted-foreground" />
                        )}
                      </Button>
                    ) : (
                      header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.length ? (
              visible.map((r) => r.element)
            ) : (
              <tr>
                <td colSpan={headers.length} className="text-muted-foreground">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
