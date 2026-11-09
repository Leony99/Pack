import { selectClass } from "@/components/common/classes";
import { FormField } from "@/components/common/FormField";
import { TAMANHOS } from "@/lib/dominio";
import type { Collection } from "@/data/dashboard";
import type { ItemType, Product, Section } from "@/data/types";
import { alternarTag, lerTags } from "./tags";

const CATEGORIAS: ItemType[] = ["camisetas", "bermudas", "conjuntos"];
const ESTILOS = ["casual", "treino"] as const;

/** Campos do produto: dados, estilos, coleções, descrição, estoque por tamanho e imagens. */
export function ProductForm({
  value,
  set,
  tagsText,
  onTagsText,
  collections,
  products,
}: {
  value: Product;
  set: (patch: Partial<Product>) => void;
  tagsText: string;
  onTagsText: (texto: string) => void;
  collections: Collection[];
  products: Product[];
}) {
  // a "biblioteca" de imagens são as imagens de todos os produtos, sem repetir
  const biblioteca = Array.from(new Set(products.flatMap((p) => p.images)));
  const tags = lerTags(tagsText);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Nome"
          value={value.name}
          required
          onChange={(e) => set({ name: e.target.value })}
        />
        <FormField
          label="Preço (R$)"
          type="number"
          min="0"
          step="0.01"
          value={value.price}
          required
          onChange={(e) => set({ price: Number(e.target.value) })}
        />
        <label>
          <span className="mb-2 block text-xs">Categoria</span>
          <select
            className={selectClass}
            value={value.type}
            onChange={(e) => set({ type: e.target.value as ItemType })}
          >
            {CATEGORIAS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-2 block text-xs">Cor</span>
          <select
            className={selectClass}
            value={value.color}
            onChange={(e) => set({ color: e.target.value as Product["color"] })}
          >
            <option>BLACK</option>
            <option>WHITE</option>
          </select>
        </label>
        <label>
          <span className="mb-2 block text-xs">Curadoria</span>
          <select
            className={selectClass}
            value={value.section ?? ""}
            onChange={(e) => set({ section: (e.target.value || undefined) as Section | undefined })}
          >
            <option value="">Nenhuma</option>
            <option value="destaques">Destaques</option>
            <option value="novo-drop">Novo drop</option>
          </select>
        </label>
        <FormField
          label="Tags (separadas por vírgula)"
          value={tagsText}
          onChange={(e) => onTagsText(e.target.value)}
        />
      </div>
      <fieldset>
        <legend className="mb-3 text-xs">Estilos</legend>
        <div className="flex gap-6">
          {ESTILOS.map((estilo) => (
            <label key={estilo} className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={value.styles.includes(estilo)}
                onChange={(e) =>
                  set({
                    styles: e.target.checked
                      ? [...value.styles, estilo]
                      : value.styles.filter((s) => s !== estilo),
                  })
                }
              />
              {estilo}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-3 text-xs">Coleções (tags de produto)</legend>
        <div className="flex flex-wrap gap-6">
          {collections.map((c) => (
            <label key={c.id} className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={tags.includes(c.tag)}
                onChange={(e) => onTagsText(alternarTag(tagsText, c.tag, e.target.checked))}
              />
              {c.name}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block">
        <span className="mb-2 block text-xs">Descrição</span>
        <textarea
          value={value.description ?? ""}
          rows={3}
          onChange={(e) => set({ description: e.target.value })}
          className="w-full border border-input bg-background p-3 text-sm"
        />
      </label>
      <fieldset>
        <legend className="mb-3 text-xs">Variantes / estoque por tamanho</legend>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {TAMANHOS.map((tamanho) => (
            <FormField
              key={tamanho}
              label={tamanho}
              type="number"
              min="0"
              step="1"
              value={value.stock?.[tamanho] ?? 0}
              onChange={(e) =>
                set({ stock: { ...value.stock, [tamanho]: Number(e.target.value) } })
              }
            />
          ))}
        </div>
      </fieldset>
      <label>
        <span className="mb-2 block text-xs">Imagem de capa (biblioteca)</span>
        <select
          className={selectClass}
          value={value.image}
          onChange={(e) =>
            set({
              image: e.target.value,
              // a capa vai para o começo da galeria
              images: [e.target.value, ...value.images.filter((i) => i !== e.target.value)],
            })
          }
        >
          {biblioteca.map((url, i) => (
            <option key={url} value={url}>
              Imagem {i + 1} · {products.find((p) => p.images.includes(url))?.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-3">
        {biblioteca.map((url, i) => (
          <label key={url} className="flex flex-col items-center gap-2">
            <img src={url} alt={`Imagem ${i + 1}`} className="h-20 w-16 object-cover grayscale" />
            <input
              type="checkbox"
              aria-label={`Incluir imagem ${i + 1}`}
              checked={value.images.includes(url)}
              onChange={(e) =>
                set({
                  images: e.target.checked
                    ? [...value.images, url]
                    : value.images.filter((s) => s !== url),
                })
              }
            />
          </label>
        ))}
      </div>
      <label className="flex gap-3 text-sm">
        <input
          type="checkbox"
          checked={value.active !== false}
          onChange={(e) => set({ active: e.target.checked })}
        />
        Produto ativo no catálogo
      </label>
    </>
  );
}
