import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateCoupon } from "@/lib/api";
import { useCart } from "@/lib/cart";

/** Campo de cupom. O cupom aplicado fica no carrinho, então a gaveta, o carrinho e o checkout mostram o mesmo. */
export function CouponField() {
  const { coupon, setCoupon } = useCart();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function apply(e: FormEvent) {
    e.preventDefault();
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
      <form onSubmit={apply} className="flex gap-2">
        <input
          aria-label="Cupom de desconto"
          className="min-w-0 flex-1 border border-input bg-background px-3 py-3 text-xs outline-none focus:border-foreground"
          placeholder="CUPOM DE DESCONTO"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <Button type="submit" variant="outline" className="h-auto" disabled={busy}>
          {busy ? "VALIDANDO..." : "APLICAR"}
        </Button>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
