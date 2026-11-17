// Clique no link da página em que já se está (menu, rodapé, textos): a página rola de volta ao topo.
// A rolagem de cada página fica guardada pelo router (getScrollRestorationKey no router.tsx), então
// um link para a própria página não a levaria ao topo sozinho. O arrasto entre as páginas do menu
// (uma página só, para o lado da fila) é do router.tsx e do styles.css.
import type { AnyRouter } from "@tanstack/react-router";

/**
 * Liga o "voltar ao topo" nos cliques de links da loja. Devolve a função que desliga.
 * O ouvinte roda na fase de captura, antes do Link do router: quando decide, o Link nem é acionado.
 */
export function instalarVoltaAoTopo(router: AnyRouter): () => void {
  const aoClicar = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;
    const link = (e.target as Element | null)?.closest?.("a[href]");
    if (
      !(link instanceof HTMLAnchorElement) ||
      link.target === "_blank" ||
      link.hasAttribute("download")
    )
      return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.hash || url.pathname !== location.pathname) return;

    // o link da página em que já se está: volta ao topo (e só aplica os filtros, se mudaram)
    e.preventDefault();
    e.stopPropagation();
    if (url.search !== location.search)
      void router.navigate({ href: url.pathname + url.search, resetScroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  document.addEventListener("click", aoClicar, true);
  return () => document.removeEventListener("click", aoClicar, true);
}
