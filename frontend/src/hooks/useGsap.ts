import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap, registrarGsap } from "@/lib/movimento";

// no servidor o useLayoutEffect avisa que não roda; lá usamos o useEffect, que também não roda
const useEfeitoAntesDaPintura = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Roda animações do GSAP presas a um elemento: tudo o que "animar" criar (tweens, ScrollTriggers,
 * SplitText, matchMedia) fica num gsap.context e é desfeito sozinho quando o componente sai da
 * tela. Roda antes da primeira pintura, para o estado inicial das animações não piscar.
 * "animar" recebe o elemento e pode devolver uma limpeza extra.
 */
export function useGsap<T extends HTMLElement = HTMLDivElement>(
  animar: (elemento: T) => void | (() => void),
) {
  const ref = useRef<T>(null);
  useEfeitoAntesDaPintura(() => {
    const elemento = ref.current;
    if (!elemento) return;
    registrarGsap();
    let limpar: void | (() => void);
    const ctx = gsap.context(() => {
      limpar = animar(elemento);
    }, elemento);
    return () => {
      limpar?.();
      ctx.revert();
    };
    // roda uma vez por componente; a animação lê o DOM, não props
  }, []);
  return ref;
}
