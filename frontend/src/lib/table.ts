// Busca, filtros, ordenação e exportação das tabelas do painel administrativo (AdminTable).
// Fica separado da tela para ser testado sem o React (table.test.ts).

/** Valor de uma coluna, usado para ordenar e exportar (números ordenam como números). */
export type TableValue = string | number | null;
/** Uma linha: os valores das colunas, os valores de cada filtro e o texto da busca. */
export type TableRecord = {
  values: TableValue[];
  filters?: Record<string, string | string[]>;
  search?: string;
};
export type TableState = {
  search: string;
  filters: Record<string, string>;
  sort: number | null;
  direction: "asc" | "desc";
};
/** Sem acento e em minúsculas: "Calção" e "calcao" se encontram na busca. */
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
/** Compara textos em português, com números em ordem numérica ("Camiseta 2" antes de "Camiseta 10"). */
const collator = new Intl.Collator("pt-BR", { numeric: true, sensitivity: "base" });

/** As linhas que passam na busca e nos filtros, na ordem escolhida. */
export function selectTableRows<T extends TableRecord>(rows: T[], state: TableState): T[] {
  const result = rows.filter(
    (row) =>
      normalize(row.search ?? row.values.join(" ")).includes(normalize(state.search.trim())) &&
      Object.entries(state.filters).every(([key, value]) => {
        const field = row.filters?.[key];
        return !value || (Array.isArray(field) ? field.includes(value) : field === value);
      }),
  );
  if (state.sort === null) return result;
  const column = state.sort;
  return result.sort((a, b) => {
    const left = a.values[column] ?? null;
    const right = b.values[column] ?? null;
    // valores vazios ficam sempre no fim, nas duas direções
    if (left === null) return right === null ? 0 : 1;
    if (right === null) return -1;
    const comparison =
      typeof left === "number" && typeof right === "number"
        ? left - right
        : collator.compare(String(left), String(right));
    return state.direction === "asc" ? comparison : -comparison;
  });
}

/**
 * Gera o CSV (separado por ";", que o Excel em português abre direto) com o cabeçalho e as linhas.
 * Uma célula que começa com = + @ ou - ganha um apóstrofo na frente: sem isso, o Excel a executaria
 * como fórmula (injeção de fórmula em CSV).
 */
export function gerarCsv(headers: string[], rows: TableRecord[]): string {
  const celula = (value: TableValue) => {
    const texto = String(value ?? "");
    return '"' + (/^[=+@-]/.test(texto) ? "'" : "") + texto.replaceAll('"', '""') + '"';
  };
  const linhas = [headers.map(celula), ...rows.map((r) => r.values.map(celula))];
  return linhas.map((colunas) => colunas.join(";")).join("\n");
}

/** Baixa o texto como arquivo CSV (com BOM, para o Excel reconhecer o UTF-8 e os acentos). */
export function baixarCsv(texto: string, nomeDoArquivo: string): void {
  const arquivo = new Blob(["\uFEFF" + texto], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeDoArquivo;
  link.click();
  URL.revokeObjectURL(url);
}
