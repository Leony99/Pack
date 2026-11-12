/** Um número de destaque com o rótulo em cima (resumos da conta e do painel), numa caixa branca da grade. */
export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-paper p-5">
      <p className="text-[10px] font-medium tracking-[0.3em] text-muted-foreground">{label}</p>
      <p className="mt-3 font-display text-3xl break-words">{value}</p>
    </div>
  );
}
