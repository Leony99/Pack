// Formatos do painel com a API.

/** Data e hora da API (ISO) como a tela mostra: 18/11/2026 14:30. */
export function dataHora(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
