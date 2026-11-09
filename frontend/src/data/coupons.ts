/** CUPONS HARDCODED (COUPON). Substituídos por `POST /coupons/validate`. */
import type { Coupon } from "./types";

export const coupons: Coupon[] = [
  { code: "PACK10", discount: 10, type: "percent", validUntil: null },
  { code: "DROP02", discount: 15, type: "percent", validUntil: null },
  { code: "BEMVINDO", discount: 30, type: "fixed", validUntil: null },
];
