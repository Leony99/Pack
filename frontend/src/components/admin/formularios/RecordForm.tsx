import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminRecord } from "@/lib/api";
import type { Collection, StaffMember } from "@/data/dashboard";
import type { Coupon, Product } from "@/data/types";
import type { AdminView } from "../tipos";
import { CollectionForm } from "./CollectionForm";
import { CouponForm } from "./CouponForm";
import { ProductForm } from "./ProductForm";
import { StaffForm } from "./StaffForm";
import { lerTags } from "./tags";

/**
 * Formulário da janela de edição do painel. Guarda o registro sendo editado e escolhe os campos
 * pelo tipo da tela. Só envia ao salvar: até lá, nada muda na lista.
 */
export function RecordForm({
  view,
  record,
  collections,
  products,
  busy,
  onSave,
}: {
  view: AdminView;
  record: AdminRecord;
  collections: Collection[];
  products: Product[];
  busy: boolean;
  onSave: (record: AdminRecord) => void;
}) {
  const [value, setValue] = useState(record);
  // as tags do produto são editadas como texto ("a, b, c") e viram lista ao salvar
  const [tagsText, setTagsText] = useState("tags" in record ? (record.tags ?? []).join(", ") : "");
  const set = (patch: Partial<AdminRecord>) =>
    setValue((atual) => ({ ...atual, ...patch }) as AdminRecord);

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSave("price" in value ? { ...value, tags: lerTags(tagsText) } : value);
      }}
    >
      {view === "products" && "price" in value && (
        <ProductForm
          value={value}
          set={set}
          tagsText={tagsText}
          onTagsText={setTagsText}
          collections={collections}
          products={products}
        />
      )}
      {view === "collections" && "tag" in value && (
        <CollectionForm value={value as Collection} set={set} />
      )}
      {view === "coupons" && "code" in value && (
        <CouponForm
          value={value as Coupon}
          set={set}
          codigoFixo={"code" in record && !!record.code}
        />
      )}
      {view === "staff" && "role" in value && <StaffForm value={value as StaffMember} set={set} />}
      <Button disabled={busy} className="w-full rounded-none">
        <Save />
        {busy ? "SALVANDO..." : "SALVAR"}
      </Button>
    </form>
  );
}
