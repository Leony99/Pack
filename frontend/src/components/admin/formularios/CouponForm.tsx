import { selectClass } from "@/components/common/classes";
import { FormField } from "@/components/common/FormField";
import type { Coupon } from "@/data/types";

/** Campos do cupom. O código identifica o cupom, então não muda ao editar (codigoFixo). */
export function CouponForm({
  value,
  set,
  codigoFixo,
}: {
  value: Coupon;
  set: (patch: Partial<Coupon>) => void;
  codigoFixo: boolean;
}) {
  return (
    <>
      <FormField
        label="Código"
        value={value.code}
        readOnly={codigoFixo}
        required
        onChange={(e) => set({ code: e.target.value.toUpperCase() })}
      />
      <label>
        <span className="mb-2 block text-xs">Tipo</span>
        <select
          className={selectClass}
          value={value.type}
          onChange={(e) => set({ type: e.target.value as Coupon["type"] })}
        >
          <option value="percent">Percentual</option>
          <option value="fixed">Valor fixo</option>
        </select>
      </label>
      <FormField
        label="Desconto"
        type="number"
        min="0.01"
        max={value.type === "percent" ? 100 : undefined}
        step="0.01"
        value={value.discount}
        required
        onChange={(e) => set({ discount: Number(e.target.value) })}
      />
      <FormField
        label="Validade (opcional)"
        type="date"
        value={value.validUntil?.slice(0, 10) ?? ""}
        onChange={(e) => set({ validUntil: e.target.value || null })}
      />
    </>
  );
}
