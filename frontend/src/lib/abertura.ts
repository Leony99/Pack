// A abertura da home (o pré-loader) roda uma vez por carga da página. Este módulo guarda se ela
// já terminou e avisa o topo da home, que só então mostra os elementos das laterais.
// Fica separado do GSAP para o layout poder usar sem carregar a biblioteca.

let feita = false;
const ouvintes = new Set<() => void>();

export const abertura = {
  /** A abertura já terminou (ou nem vai rodar) nesta carga da página? */
  feita: () => feita,

  /** Marca como terminada e avisa quem estava esperando. */
  concluir() {
    if (feita) return;
    feita = true;
    ouvintes.forEach((avisar) => avisar());
    ouvintes.clear();
  },

  /** Chama `avisar` quando a abertura terminar. Devolve a função que cancela o aviso. */
  aoConcluir(avisar: () => void): () => void {
    ouvintes.add(avisar);
    return () => {
      ouvintes.delete(avisar);
    };
  },
};
