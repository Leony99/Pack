// Catálogo: produtos, tabela de medidas e coleções.
import {
  sizeChart,
  type Collection,
  type ItemType,
  type Product,
  type Section,
  type SizeRow,
  type Style,
} from "@/data";
import { state } from "./simulacao";

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

/** GET /products?style=&type=&section=&search= */
export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  // BACKEND:
  // const qs = new URLSearchParams(filters as Record<string, string>).toString();
  // return apiFetch<Product[]>(`/products?${qs}`);
  const busca = filters.search?.trim().toLowerCase();
  return state.products
    .filter((p) => combina(p, filters, busca))
    .sort((a, b) => ordenar(a, b, filters.sort))
    .map((p) => ({ ...p, stock: { ...p.stock }, tags: [...(p.tags ?? [])] }));
}

/** GET /products/:id */
export async function getProduct(id: string): Promise<Product | null> {
  // BACKEND: return apiFetch<Product>(`/products/${id}`);
  return state.products.find((p) => p.id === id && p.active !== false) ?? null;
}

/** GET /products?section=destaques|novo-drop&limit=4 */
export async function getSection(section: Section, limit = 4): Promise<Product[]> {
  // BACKEND: return apiFetch<Product[]>(`/products?section=${section}&limit=${limit}`);
  return (await getProducts({ section })).slice(0, limit);
}

/** GET /products/:id/related?limit=4 — produtos do mesmo tipo */
export async function getRelated(id: string, limit = 4): Promise<Product[]> {
  // BACKEND: return apiFetch<Product[]>(`/products/${id}/related?limit=${limit}`);
  const base = state.products.find((p) => p.id === id);
  if (!base) return [];
  return (await getProducts({ type: base.type })).filter((p) => p.id !== id).slice(0, limit);
}

/** GET /sizes */
export async function getSizeChart(): Promise<SizeRow[]> {
  // BACKEND: return apiFetch<SizeRow[]>("/sizes");
  return sizeChart;
}

/** GET /collections */
export async function getCollections(): Promise<Collection[]> {
  // BACKEND: return apiFetch<Collection[]>("/collections");
  return state.collections.map((c) => ({ ...c }));
}

/** GET /collections/:slug */
export async function getCollection(slug: string): Promise<Collection | null> {
  // BACKEND: return apiFetch<Collection>(`/collections/${slug}`);
  return state.collections.find((c) => c.tag === slug) ?? null;
}
