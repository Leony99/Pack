/** Um número de destaque com o rótulo em cima (resumos da conta e do painel). */
export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-3 font-display text-3xl break-words">{value}</p>
    </div>
  );
}
