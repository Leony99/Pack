import { useState, type FormEvent } from "react";
import { quoteShipping } from "@/lib/api";
import type { ShippingOption } from "@/data/types";

/** Calculadora de frete da página do produto: o CEP é digitado com máscara e enviado só com os números. */
export function ShippingCalc({ price }: { price: number }) {
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ShippingOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onlyDigits = (v: string) => v.replace(/\D/g, "").slice(0, 8);
  const formatted = cep.length > 5 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;

  const calc = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (cep.length !== 8) {
      setError("Digite um CEP válido com 8 dígitos.");
      setOptions(null);
      return;
    }
    setLoading(true);
    try {
      setOptions(await quoteShipping(cep, price));
    } catch (err) {
      setOptions(null);
      setError(err instanceof Error ? err.message : "Não foi possível calcular o frete.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 border-t border-border pt-8">
      <p className="text-xs font-medium tracking-[0.3em] text-muted-foreground">CALCULAR FRETE</p>
      <form onSubmit={calc} className="mt-3 flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          value={formatted}
          onChange={(e) => setCep(onlyDigits(e.target.value))}
          placeholder="00000-000"
          className="flex-1 border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground"
        />
        <button
          type="submit"
          disabled={loading}
          className="cursor-pointer border border-foreground bg-foreground px-5 text-xs font-medium tracking-[0.2em] text-background transition hover:bg-foreground/90 disabled:opacity-50"
        >
          {loading ? "..." : "CALCULAR"}
        </button>
      </form>
      <a
        href="https://buscacepinter.correios.com.br/app/endereco/index.php"
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-xs text-muted-foreground underline"
      >
        Não sei meu CEP
      </a>

      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

      {options && (
        <ul className="mt-4 divide-y divide-border border border-border">
          {options.map((o) => (
            <li key={o.label} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{o.label}</p>
                <p className="text-xs text-muted-foreground">{o.days}</p>
              </div>
              <p className="font-medium">{o.price === 0 ? "GRÁTIS" : `R$ ${o.price.toFixed(2)}`}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
