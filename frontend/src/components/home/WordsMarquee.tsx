const PALAVRAS = ["TREINO", "RUA", "PACK", "PERFORMANCE", "MINIMALISMO"];

/** Faixa de palavras grandes correndo (animação "marquee"); a lista se repete 3 vezes, sem emenda. */
export function WordsMarquee() {
  return (
    <div className="overflow-hidden border-b border-border bg-ink py-5">
      <div className="flex whitespace-nowrap marquee">
        {[0, 1, 2].map((copia) => (
          <div
            key={copia}
            className="flex shrink-0 items-center gap-6 px-6 font-display text-4xl text-paper md:text-5xl"
          >
            {PALAVRAS.flatMap((palavra) => [
              <span key={palavra}>{palavra}</span>,
              <span key={`${palavra}-/`} className="text-paper/30">
                /
              </span>,
            ])}
          </div>
        ))}
      </div>
    </div>
  );
}
