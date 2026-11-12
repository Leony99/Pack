// GSAP e seus plugins, usados nas animações presas à rolagem (topo da home e Drop em rolagem
// lateral). Tudo roda só no navegador; no servidor, o registro não faz nada.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

/** Curva padrão das animações: começa e termina devagar, rápida no meio. */
export const CURVA = "expo.inOut";

let registrado = false;

/** Registra os plugins do GSAP uma vez (no navegador). */
export function registrarGsap(): void {
  if (!registrado && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    registrado = true;
  }
}

export { gsap, ScrollTrigger, SplitText };
