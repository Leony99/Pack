/**
 * Título e metatags de uma página (aba do navegador, buscadores e prévia nas redes sociais).
 * robots: "noindex, nofollow" nas páginas que não devem aparecer no Google (login, conta e painel).
 */
export function pageHead(title: string, description: string, opcoes: { robots?: string } = {}) {
  return {
    meta: [
      { title: `${title} — PACK` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} — PACK` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      ...(opcoes.robots ? [{ name: "robots", content: opcoes.robots }] : []),
    ],
  };
}
