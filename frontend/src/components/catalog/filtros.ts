// Filtros do catálogo na URL (?style=&type=&section=&collection=&sort=) e a conversão para a API.
import type { ProductFilters } from "@/lib/api";
import type { ItemType, Section, Style } from "@/data/types";

export const ESTILOS: Style[] = ["casual", "treino"];
export const CATEGORIAS: ItemType[] = ["camisetas", "bermudas", "conjuntos"];
export const CURADORIAS: Section[] = ["destaques", "novo-drop"];
export const ORDENACOES = ["recent", "price-asc", "price-desc", "name"] as const;

/** Filtros como ficam na URL: "all" quando não há filtro. */
export type CatalogSearch = {
  style?: string;
  type?: string;
  section?: string;
  collection?: string;
  sort?: string;
};

const valido = <T extends string>(lista: readonly T[], valor: unknown): valor is T =>
  lista.includes(valor as T);

/** Lê a URL: valor desconhecido vira "all" (e a ordenação vira "recent"). */
export function parseCatalogSearch(s: Record<string, unknown>): CatalogSearch {
  return {
    style: valido(ESTILOS, s.style) ? s.style : "all",
    type: valido(CATEGORIAS, s.type) ? s.type : "all",
    section: valido(CURADORIAS, s.section) ? s.section : "all",
    collection: typeof s.collection === "string" ? s.collection : "all",
    sort: valido(ORDENACOES, s.sort) ? s.sort : "recent",
  };
}

/** Converte os filtros da URL para a busca de produtos ("all" vira "sem filtro"). */
export function catalogFilters(search: CatalogSearch): ProductFilters {
  return {
    style: valido(ESTILOS, search.style) ? search.style : undefined,
    type: valido(CATEGORIAS, search.type) ? search.type : undefined,
    section: valido(CURADORIAS, search.section) ? search.section : undefined,
    collection: search.collection && search.collection !== "all" ? search.collection : undefined,
    sort: valido(ORDENACOES, search.sort) ? search.sort : "recent",
  };
}
