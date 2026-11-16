// Filtros do catálogo na URL (?style=&type=&section=&collection=&sort=) e a conversão para a API.
// Estilo, categoria e coleção são tags (as opções vêm de getOpcoesDoCatalogo e getCollections):
// aqui só se confere que o valor da URL tem o formato de uma tag normalizada.
import { SLUG, type ProductFilters } from "@/lib/api";
import type { Section } from "@/data/types";

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

/** Uma tag normalizada ("treino", "drop-natal"); "all" é "sem filtro". */
const tag = (valor: unknown): valor is string =>
  typeof valor === "string" && valor !== "all" && SLUG.test(valor);

/** Lê a URL: valor desconhecido vira "all" (e a ordenação vira "recent"). */
export function parseCatalogSearch(s: Record<string, unknown>): CatalogSearch {
  return {
    style: tag(s.style) ? s.style : "all",
    type: tag(s.type) ? s.type : "all",
    section: valido(CURADORIAS, s.section) ? s.section : "all",
    collection: tag(s.collection) ? s.collection : "all",
    sort: valido(ORDENACOES, s.sort) ? s.sort : "recent",
  };
}

/** Converte os filtros da URL para a busca de produtos ("all" vira "sem filtro"). */
export function catalogFilters(search: CatalogSearch): ProductFilters {
  return {
    style: tag(search.style) ? search.style : undefined,
    type: tag(search.type) ? search.type : undefined,
    section: valido(CURADORIAS, search.section) ? search.section : undefined,
    collection: tag(search.collection) ? search.collection : undefined,
    sort: valido(ORDENACOES, search.sort) ? search.sort : "recent",
  };
}
