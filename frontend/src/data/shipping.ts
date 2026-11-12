/**
 * REGRAS DE FRETE HARDCODED.
 * Substituídas por `POST /shipping/quote` (Correios/transportadora).
 */
import type { ShippingOption } from "./types";

/** Acima deste valor (R$) o frete padrão é grátis. */
export const freeShippingFrom = 200;

export const shippingOptions: ShippingOption[] = [
  { label: "PAC", days: "5–8 dias úteis", price: 24.9 },
  { label: "SEDEX", days: "2–4 dias úteis", price: 39.9 },
  { label: "Expressa", days: "1 dia útil", price: 59.9 },
];

/** Opções que NÃO entram na regra de frete grátis. */
export const paidOnlyOptions = ["Expressa"];
