import { useCart } from "@/lib/cart";
import { calculateTotals, money } from "@/lib/checkout";

/** Subtotal, desconto, entrega e total do carrinho. Sem "shipping", a entrega aparece "A calcular". */
export function OrderSummary({ shipping }: { shipping?: number }) {
  const { cartTotal, coupon } = useCart();
  const totals = calculateTotals(cartTotal, coupon, shipping);
  return (
    <dl className="mt-6 space-y-4 text-sm">
      <div className="flex justify-between">
        <dt>Subtotal</dt>
        <dd>{money(totals.subtotal)}</dd>
      </div>
      {coupon && (
        <div className="flex justify-between">
          <dt>Desconto · {coupon.code}</dt>
          <dd>− {money(totals.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt>Entrega</dt>
        <dd>
          {shipping === undefined ? "A calcular" : shipping === 0 ? "Grátis" : money(shipping)}
        </dd>
      </div>
      <div className="flex justify-between border-t border-border pt-5 text-lg font-medium">
        <dt>Total</dt>
        <dd>{money(totals.total)}</dd>
      </div>
    </dl>
  );
}
