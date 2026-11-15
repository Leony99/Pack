// Classificação das tags dos produtos nos filtros do catálogo.
//
// Na Pack API, o produto só tem tags soltas ("camiseta", "treino", "drop 02", "destaques"...): é o
// frontend que decide em qual filtro cada uma aparece. Para mudar onde uma tag entra (ou aceitar
// outro jeito de escrevê-la), é só editar FILTROS abaixo. Tags de drop ("drop 02", "Drop-03")
// viram a coleção do drop; as que não se encaixam em nada continuam no produto, sem filtro.
import type { Collection, ItemType, Section, Style } from "@/data";

/** "Drop 02" → "drop-02"; "Camisetas" → "camisetas"; "Básicos Pretos" → "basicos-pretos". */
export function normalizarTag(tag: string): string {
  return tag
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Cada filtro do catálogo: o valor que o filtro usa e as tags (já normalizadas) que contam como ele. */
export const FILTROS = {
  estilo: {
    casual: ["casual"],
    treino: ["treino", "training"],
  } satisfies Record<Style, string[]>,
  categoria: {
    camisetas: ["camiseta", "camisetas", "regata", "regatas", "tee", "camisa"],
    bermudas: ["bermuda", "bermudas", "short", "shorts"],
    conjuntos: ["conjunto", "conjuntos", "agasalho"],
  } satisfies Record<ItemType, string[]>,
  curadoria: {
    destaques: ["destaque", "destaques", "featured"],
    "novo-drop": ["novo-drop", "novidade", "novidades", "lancamento"],
  } satisfies Record<Section, string[]>,
};

/** Tag de drop: "drop-02", "drop-2", "drop-ss26"... */
export const DROP = /^drop-[a-z0-9-]+$/;

function primeiroQueCasa<K extends string>(
  grupo: Record<K, string[]>,
  tags: string[],
): K | undefined {
  return (Object.keys(grupo) as K[]).find((valor) => grupo[valor].some((t) => tags.includes(t)));
}

export type TagsClassificadas = {
  estilos: Style[];
  categoria?: ItemType;
  curadoria?: Section;
  /** Todas as tags normalizadas (a busca e o filtro de coleção usam esta lista). */
  todas: string[];
};

/** Distribui as tags de um produto nos filtros do catálogo. */
export function classificarTags(tagsDaApi: string[]): TagsClassificadas {
  const todas = [...new Set(tagsDaApi.map(normalizarTag).filter(Boolean))];
  const estilos = (Object.keys(FILTROS.estilo) as Style[]).filter((estilo) =>
    FILTROS.estilo[estilo].some((t) => todas.includes(t)),
  );
  return {
    estilos,
    categoria: primeiroQueCasa(FILTROS.categoria, todas),
    curadoria: primeiroQueCasa(FILTROS.curadoria, todas),
    todas,
  };
}

/** "drop-02" → { name: "DROP 02", tag: "drop-02" }: a coleção montada a partir da tag do drop. */
export function colecaoDoDrop(tag: string): Collection {
  return {
    id: tag,
    name: tag.replace(/-/g, " ").toUpperCase(),
    tag,
    description: "",
  };
}
