const AVISOS = [
  "FRETE GRÁTIS ACIMA DE R$ 350",
  "NOVA COLEÇÃO — DROP 02",
  "TROCAS EM 30 DIAS",
  "PARCELE EM ATÉ 6X",
];

/**
 * Faixa preta de avisos no topo, correndo da direita para a esquerda (animação "marquee" do
 * styles.css). A lista aparece duas vezes seguidas para o loop não ter emenda.
 */
export function AnnouncementBar() {
  return (
    <div className="overflow-hidden border-b border-border bg-foreground text-background">
      <div className="flex whitespace-nowrap py-2 text-xs font-medium tracking-[0.3em] marquee">
        {[0, 1].map((copia) => (
          <div key={copia} className="flex shrink-0 items-center gap-12 px-6">
            {AVISOS.flatMap((aviso) => [
              <span key={aviso}>{aviso}</span>,
              <span key={`${aviso}-•`}>•</span>,
            ])}
          </div>
        ))}
      </div>
    </div>
  );
}
