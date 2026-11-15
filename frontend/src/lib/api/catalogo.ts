// Catálogo: produtos, tabela de medidas e coleções.
// Com VITE_USAR_API=true, os produtos e as coleções (drops) vêm da Pack API (catalogo-api.ts);
// sem ela, da demonstração. A tabela de medidas continua na demonstração: a API só tem os nomes dos
// tamanhos, sem as medidas.
import {
  sizeChart,
  type Collection,
  type ItemType,
  type Product,
  type Section,
  type SizeRow,
  type Style,
} from "@/data";
import { produtoDaApiPorId, produtosDaApi } from "./catalogo-api";
import { USA_API } from "./modo";
import { state } from "./simulacao";
import { colecaoDoDrop, DROP } from "./tags";

export type ProductFilters = {
  style?: Style;
  type?: ItemType;
  section?: Section;
  search?: string;
  collection?: string;
  sort?: "recent" | "price-asc" | "price-desc" | "name";
};

function ordenar(a: Product, b: Product, sort: ProductFilters["sort"]): number {
  if (sort === "price-asc") return a.price - b.price;
  if (sort === "price-desc") return b.price - a.price;
  if (sort === "name") return a.name.localeCompare(b.name);
  return 0; // "recent": mantém a ordem de cadastro
}

function combina(p: Product, filters: ProductFilters, busca?: string): boolean {
  return (
    p.active !== false &&
    (!filters.style || p.styles.includes(filters.style)) &&
    (!filters.type || p.type === filters.type) &&
    (!filters.section || p.section === filters.section) &&
    (!filters.collection || (p.tags?.includes(filters.collection) ?? false)) &&
    (!busca || `${p.name} ${p.type} ${(p.tags ?? []).join(" ")}`.toLowerCase().includes(busca))
  );
}

/** Aplica os filtros e a ordenação do catálogo (os mesmos nos dois modos). */
export function filtrarProdutos(produtos: Product[], filters: ProductFilters): Product[] {
  const busca = filters.search?.trim().toLowerCase();
  return produtos
    .filter((p) => combina(p, filters, busca))
    .sort((a, b) => ordenar(a, b, filters.sort));
}

/** Produtos do catálogo. API: GET /api/v1/products (+ filtros pelas tags, em tags.ts). */
export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  if (USA_API) {
    // a busca por nome vai para a API (ignora acentos); o resto é filtrado aqui
    const produtos = await produtosDaApi({ data: { nome: filters.search } });
    return filtrarProdutos(produtos, { ...filters, search: undefined });
  }
  return filtrarProdutos(state.products, filters).map((p) => ({
    ...p,
    stock: { ...p.stock },
    tags: [...(p.tags ?? [])],
  }));
}

/** Um produto. API: GET /api/v1/products/{id}; não existe → null. */
export async function getProduct(id: string): Promise<Product | null> {
  if (USA_API) return produtoDaApiPorId({ data: id });
  return state.products.find((p) => p.id === id && p.active !== false) ?? null;
}

/** Produtos de uma curadoria (destaques, novo drop), pela tag. */
export async function getSection(section: Section, limit = 4): Promise<Product[]> {
  return (await getProducts({ section })).slice(0, limit);
}

/** Produtos da mesma categoria (a API não tem "relacionados": sai do catálogo). */
export async function getRelated(id: string, limit = 4): Promise<Product[]> {
  const base = await getProduct(id);
  if (!base) return [];
  return (await getProducts({ type: base.type })).filter((p) => p.id !== id).slice(0, limit);
}

/** Tabela de medidas: sempre da demonstração (a API não guarda as medidas). */
export async function getSizeChart(): Promise<SizeRow[]> {
  return sizeChart;
}

/**
 * Coleções (os drops). API: montadas a partir das tags de drop dos produtos ("drop 02" → DROP 02),
 * porque a API não tem coleções; sem produtos, não há coleções.
 */
export async function getCollections(): Promise<Collection[]> {
  if (USA_API) {
    const drops = new Set((await getProducts()).flatMap((p) => p.tags ?? []));
    return [...drops]
      .filter((t) => DROP.test(t))
      .sort()
      .map(colecaoDoDrop);
  }
  return state.collections.map((c) => ({ ...c }));
}

/** Uma coleção pela tag ("drop-02"); não existe → null (a tela mostra o 404). */
export async function getCollection(slug: string): Promise<Collection | null> {
  if (USA_API) return (await getCollections()).find((c) => c.tag === slug) ?? null;
  return state.collections.find((c) => c.tag === slug) ?? null;
}
