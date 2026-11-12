/** "treino, drop-02, , treino" → ["treino", "drop-02"]: separa por vírgula, limpa e tira repetidas. */
export function lerTags(texto: string): string[] {
  const tags = texto
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return Array.from(new Set(tags));
}

/** Liga ou desliga uma tag no texto de tags, mantendo as outras como estão. */
export function alternarTag(texto: string, tag: string, ligada: boolean): string {
  const tags = lerTags(texto).filter((t) => t !== tag);
  return (ligada ? [...tags, tag] : tags).join(", ");
}
