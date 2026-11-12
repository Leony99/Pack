import { useEffect, useState } from "react";

/**
 * Para animar algo que abre e fecha (gaveta, busca, menu): ao abrir, monta na hora; ao fechar,
 * continua montado por `duracaoMs` para a animação de saída rodar, e só então desmonta.
 * Devolve `montado` (renderizar ou não) e `saindo` (usar a animação de saída).
 * As animações são por keyframes (animate-in / animate-out do tw-animate-css): começam sozinhas ao
 * montar, sem depender de o navegador desenhar antes uma posição inicial.
 */
export function usePresenca(aberto: boolean, duracaoMs = 300) {
  const [montado, setMontado] = useState(aberto);

  useEffect(() => {
    if (aberto) {
      setMontado(true);
      return;
    }
    const timer = window.setTimeout(() => setMontado(false), duracaoMs);
    return () => window.clearTimeout(timer);
  }, [aberto, duracaoMs]);

  return { montado: aberto || montado, saindo: !aberto && montado };
}
