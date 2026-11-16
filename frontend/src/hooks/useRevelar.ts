import { gsap } from "@/lib/movimento";
import { useGsap } from "./useGsap";

/**
 * Revela a seção ao rolar: os elementos com `data-revela` sobem de leve e aparecem quando a seção
 * chega a 85% da altura da tela, uma vez só, um depois do outro. Deixa a descida da página
 * contínua, sem as seções surgirem paradas de uma vez. Com "reduzir movimento", nada se mexe.
 * Não ponha `data-revela` num elemento com a classe `transition` (o CSS e o GSAP brigariam pela
 * mesma propriedade): envolva-o num bloco e marque o bloco.
 */
export function useRevelar<T extends HTMLElement = HTMLElement>() {
  return useGsap<T>((el) => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const itens = el.querySelectorAll("[data-revela]");
      if (!itens.length) return;
      // fromTo, com o fim escrito: um from() leria o estado atual, e um elemento com transição de
      // CSS ainda no meio dela (o React monta, desfaz e monta de novo no modo de desenvolvimento)
      // ficaria preso invisível
      gsap.fromTo(
        itens,
        { autoAlpha: 0, y: 40 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        },
      );
    });
    return () => mm.revert();
  });
}
