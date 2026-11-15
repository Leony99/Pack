import type { ReactNode } from "react";

/**
 * Aviso de lista vazia (catálogo sem produtos, busca sem resultado, drop ainda sem peças): um
 * título grande, um texto curto e, se houver, uma ação ("LIMPAR FILTROS", "VER TODAS AS PEÇAS").
 */
export function Vazio({
  titulo,
  texto,
  acao,
  escuro = false,
}: {
  titulo: string;
  texto: ReactNode;
  acao?: ReactNode;
  escuro?: boolean;
}) {
  return (
    <div
      role="status"
      className={`mx-auto max-w-xl border px-6 py-14 text-center ${
        escuro ? "border-paper/15" : "border-ink/10"
      }`}
    >
      <p className="flex items-center justify-center gap-2 text-[10px] font-medium tracking-[0.3em] opacity-60">
        <span className="h-1.5 w-1.5 bg-destaque" /> [ VAZIO ]
      </p>
      <h2 className="mt-4 font-display text-4xl uppercase leading-none md:text-5xl">{titulo}</h2>
      <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed opacity-70">{texto}</p>
      {acao && <div className="mt-6 flex justify-center">{acao}</div>}
    </div>
  );
}
