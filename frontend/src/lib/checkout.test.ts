// Testes do cálculo do resumo da compra (subtotal, desconto, frete e total).
import { describe, expect, test } from "vitest";
import { calculateTotals } from "./checkout";

describe("resumo de compra simulado", () => {
  test("desconto percentual e frete compõem o mesmo total", () => {
    const cupom = { code: "PACK10", type: "percent" as const, discount: 10, validUntil: null };
    expect(calculateTotals(189, cupom, 24.9)).toEqual({
      subtotal: 189,
      discount: 18.9,
      shipping: 24.9,
      total: 195,
    });
  });

  test("desconto fixo não deixa produtos com valor negativo", () => {
    const cupom = { code: "BEMVINDO", type: "fixed" as const, discount: 30, validUntil: null };
    expect(calculateTotals(20, cupom, 24.9).total).toBe(24.9);
  });

  test("sem cupom mantém subtotal e soma entrega", () => {
    expect(calculateTotals(189, null, 24.9).total).toBe(213.9);
  });
});
