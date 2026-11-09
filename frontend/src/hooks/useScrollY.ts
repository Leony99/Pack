import { useEffect, useState } from "react";

/** Quanto a página já rolou, em pixels, atualizado a cada rolagem (usado no parallax da home). */
export function useScrollY(): number {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const atualizar = () => setScrollY(window.scrollY);
    atualizar();
    // passive: avisa o navegador que a rolagem nunca é cancelada aqui, para ela não travar
    window.addEventListener("scroll", atualizar, { passive: true });
    return () => window.removeEventListener("scroll", atualizar);
  }, []);

  return scrollY;
}
