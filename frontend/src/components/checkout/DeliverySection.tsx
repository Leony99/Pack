import { Button } from "@/components/ui/button";
import { money } from "@/lib/checkout";
import type { ShippingOption } from "@/data/types";

/** Etapa 02 do checkout: calcular o frete para o CEP e escolher uma das opções. */
export function DeliverySection({
  options,
  selected,
  onSelect,
  onQuote,
  quoting,
}: {
  options: ShippingOption[];
  selected: string;
  onSelect: (label: string) => void;
  onQuote: () => void;
  quoting: boolean;
}) {
  return (
    <section className="mt-10">
      <h2 className="mb-6 border-b border-border pb-4 text-2xl">02 / ENTREGA</h2>
      <Button type="button" variant="outline" className="h-12" onClick={onQuote} disabled={quoting}>
        {quoting ? "CALCULANDO..." : "CALCULAR FRETE"}
      </Button>
      <div className="mt-4 space-y-3">
        {options.map((option) => (
          <label
            key={option.label}
            className="flex cursor-pointer items-center gap-3 border border-input p-4"
          >
            <input
              type="radio"
              name="shipping"
              checked={selected === option.label}
              onChange={() => onSelect(option.label)}
              className="accent-foreground"
            />
            <span className="flex-1 text-sm">
              {option.label}
              <span className="mt-1 block text-xs text-muted-foreground">{option.days}</span>
            </span>
            <span className="text-sm">{option.price ? money(option.price) : "Grátis"}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
