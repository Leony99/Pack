import type { Coupon } from "@/data/types";

/** Valor em reais: 1234.5 → "R$ 1.234,50". */
export const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

/**
 * Subtotal, desconto, frete e total. Um só cálculo para a gaveta, o carrinho, o checkout e a
 * simulação do pedido, para os quatro sempre mostrarem o mesmo valor.
 * O desconto nunca passa do subtotal (o frete não é descontado) e o total nunca fica negativo.
 */
export function calculateTotals(subtotal: number, coupon: Coupon | null, shipping = 0) {
  const descontoBruto = !coupon
    ? 0
    : coupon.type === "percent"
      ? (subtotal * coupon.discount) / 100
      : coupon.discount;
  const discount = Math.min(subtotal, descontoBruto);
  return { subtotal, discount, shipping, total: Math.max(0, subtotal - discount) + shipping };
}
