import { FormField } from "@/components/common/FormField";
import type { Collection } from "@/data/dashboard";

/** Campos da coleção. A tag vira o endereço (/colecao/tag) e não muda depois de criada. */
export function CollectionForm({
  value,
  set,
}: {
  value: Collection;
  set: (patch: Partial<Collection>) => void;
}) {
  return (
    <>
      <FormField
        label="Nome"
        value={value.name}
        required
        onChange={(e) => set({ name: e.target.value })}
      />
      <FormField
        label="Tag / endereço da coleção"
        value={value.tag}
        required
        pattern="[a-z0-9-]+"
        readOnly={!!value.id}
        onChange={(e) => set({ tag: e.target.value.toLowerCase() })}
      />
      <FormField
        label="Descrição"
        value={value.description}
        onChange={(e) => set({ description: e.target.value })}
      />
    </>
  );
}
