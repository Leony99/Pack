import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateCoupon } from "@/lib/api";
import { useCart } from "@/lib/cart";

/**
 * Campo de cupom. O cupom aplicado fica no carrinho, então a gaveta, o carrinho e o checkout mostram o mesmo.
 * Não é um <form>: no checkout ele fica dentro do formulário do pedido, e um formulário dentro de outro
 * não vale no HTML (o APLICAR não funcionava). Enter no campo aplica, sem enviar o pedido.
 */
export function CouponField() {
  const { coupon, setCoupon } = useCart();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function apply() {
    if (!code.trim()) {
      setError("Informe o código do cupom.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await validateCoupon(code);
      if (!result) {
        setError("Cupom inválido.");
        return;
      }
      setCoupon(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível validar.");
    } finally {
      setBusy(false);
    }
  }
  if (coupon)
    return (
      <div className="flex items-center justify-between border border-border px-3 py-2 text-xs">
        <span>CUPOM {coupon.code} APLICADO</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Remover cupom"
          onClick={() => setCoupon(null)}
        >
          <X />
        </Button>
      </div>
    );
  return (
    <div>
      <div className="flex gap-2">
        <input
          aria-label="Cupom de desconto"
          className="min-w-0 flex-1 border border-input bg-background px-3 py-3 text-xs outline-none focus:border-foreground"
          placeholder="CUPOM DE DESCONTO"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void apply();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="h-auto"
          disabled={busy}
          onClick={() => void apply()}
        >
          {busy ? "VALIDANDO..." : "APLICAR"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
