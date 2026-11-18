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
import {
  catalogoDaApi,
  dropEmDestaqueDaApi,
  MAXIMO_DOS_MAIS_VENDIDOS,
  maisVendidosDaApi,
  produtoDaApiPorId,
  produtosDaApi,
  type PaginaDoCatalogo,
} from "./catalogo-api";
import { USA_API } from "./modo";
import { state } from "./simulacao";
import {
  colecaoDoDrop,
  maisRecentesPrimeiro,
  normalizarTag,
  OPCOES_DA_DEMONSTRACAO,
  opcoesDoFiltro,
  tagDoDropEmDestaque,
  type Opcao,
} from "./tags";
import { colecoesDaApi, tagsDaApi } from "./tags-api";

export type { PaginaDoCatalogo };

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

/** Selo NOVO: o produto, ou uma variante dele, foi cadastrado nos últimos 3 meses. */
export const MESES_DE_NOVIDADE = 3;

export function ehNovo(p: Pick<Product, "novidadeEm">, agora = new Date()): boolean {
  if (!p.novidadeEm) return false;
  const limite = new Date(agora);
  limite.setMonth(limite.getMonth() - MESES_DE_NOVIDADE);
  return Date.parse(p.novidadeEm) >= limite.getTime();
}

/** Curadoria: "novo-drop" são as novidades (selo NOVO); "destaques", na demonstração, a marcação da peça. */
function daCuradoria(p: Product, section: Section): boolean {
  return section === "novo-drop" ? ehNovo(p) : p.section === section;
}

function combina(p: Product, filters: ProductFilters, busca?: string): boolean {
  return (
    p.active !== false &&
    (!filters.style || p.styles.includes(filters.style)) &&
    (!filters.type || p.type === filters.type) &&
    (!filters.section || daCuradoria(p, filters.section)) &&
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
  if (USA_API && filters.section === "destaques") {
    // destaques são os mais vendidos, na ordem do ranking; os outros filtros valem sobre eles
    const ranking = await maisVendidosDaApi({ data: MAXIMO_DOS_MAIS_VENDIDOS });
    return filtrarProdutos(ranking, { ...filters, section: undefined });
  }
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

/** "Somente disponíveis": alguma variante (tamanho) com estoque. */
function disponivel(p: Product): boolean {
  return Object.values(p.stock ?? {}).some((qtd) => qtd > 0);
}

/** Recorta uma lista já filtrada na página pedida (demonstração e destaques). */
function recortar(produtos: Product[], pagina: number, tamanho: number): PaginaDoCatalogo {
  const inicio = pagina * tamanho;
  return {
    produtos: produtos.slice(inicio, inicio + tamanho),
    total: produtos.length,
    temMais: inicio + tamanho < produtos.length,
  };
}

/**
 * Uma página do catálogo (o "CARREGAR MAIS" pede a próxima). API: GET /api/v1/products com os filtros,
 * a ordem e a página; o banco filtra e só a página vem. Destaques: os mais vendidos (até 48), filtrados
 * aqui. Demonstração: os filtros sobre a lista simulada.
 */
export async function getPaginaDoCatalogo(
  filters: ProductFilters & { disponiveis?: boolean },
  pagina: number,
  tamanho: number,
): Promise<PaginaDoCatalogo> {
  if (USA_API && filters.section !== "destaques" && !filters.search) {
    return catalogoDaApi({
      data: {
        estilo: filters.style,
        categoria: filters.type,
        colecao: filters.collection,
        novidades: filters.section === "novo-drop",
        disponiveis: filters.disponiveis,
        ordem: filters.sort,
        pagina,
        tamanho,
      },
    });
  }
  const produtos = (await getProducts(filters)).filter(
    (p) => !filters.disponiveis || disponivel(p),
  );
  return recortar(produtos, pagina, tamanho);
}

/** Um produto. API: GET /api/v1/products/{id}; não existe → null. */
export async function getProduct(id: string): Promise<Product | null> {
  if (USA_API) return produtoDaApiPorId({ data: id });
  return state.products.find((p) => p.id === id && p.active !== false) ?? null;
}

/**
 * Produtos de uma curadoria. API: destaques são os mais vendidos (GET /products/mais-vendidos) e
 * "novo-drop" as novidades dos últimos 3 meses. Demonstração: a curadoria marcada na peça.
 */
export async function getSection(section: Section, limit = 4): Promise<Product[]> {
  if (USA_API && section === "destaques") return maisVendidosDaApi({ data: limit });
  return (await getProducts({ section })).slice(0, limit);
}

/** Produtos da mesma categoria (a API não tem "relacionados": sai do catálogo). */
export async function getRelated(id: string, limit = 4): Promise<Product[]> {
  const base = await getProduct(id);
  if (!base) return [];
  // pede um a mais: o próprio produto pode vir na página
  const { produtos } = await getPaginaDoCatalogo({ type: base.type }, 0, limit + 1);
  return produtos.filter((p) => p.id !== id).slice(0, limit);
}

/** Tabela de medidas: sempre da demonstração (a API não guarda as medidas). */
export async function getSizeChart(): Promise<SizeRow[]> {
  return sizeChart;
}

/**
 * O drop em destaque da home (card do topo e seção do drop): o drop da peça cadastrada mais
 * recentemente entre as que têm tag de drop, com as peças dele (as mais novas primeiro). Nenhuma
 * peça com tag de drop → null (a home mostra o EM BREVE).
 */
export type DropEmDestaque = { colecao: Collection; produtos: Product[] };

export async function getDropEmDestaque(limit = 8): Promise<DropEmDestaque | null> {
  if (USA_API) {
    // a API acha o drop e as peças dele (GET /products/drop-em-destaque), sem a loja buscar o catálogo
    const drop = await dropEmDestaqueDaApi({ data: limit });
    if (!drop.colecao) return null;
    return { colecao: colecaoDoDrop(normalizarTag(drop.colecao)), produtos: drop.produtos };
  }
  const produtos = await getProducts();
  const tag = tagDoDropEmDestaque(produtos);
  if (!tag) return null;
  const colecao = (await getCollection(tag)) ?? colecaoDoDrop(tag);
  const doDrop = maisRecentesPrimeiro(produtos.filter((p) => p.tags?.includes(tag)));
  return { colecao, produtos: doDrop.slice(0, limit) };
}

/**
 * As opções dos filtros de ESTILO e CATEGORIA (catálogo e rotas /catalogo/estilo/categoria).
 * API: as tags com esses filtros (GET /api/v1/tags), em ordem alfabética. Demonstração: as fixas.
 */
export async function getOpcoesDoCatalogo(): Promise<{ estilos: Opcao[]; categorias: Opcao[] }> {
  if (!USA_API) return OPCOES_DA_DEMONSTRACAO;
  const tags = await tagsDaApi();
  return { estilos: opcoesDoFiltro(tags, "ESTILO"), categorias: opcoesDoFiltro(tags, "CATEGORIA") };
}

/**
 * Coleções (os drops). API: as tags com filtro COLECAO ("drop natal" → DROP NATAL), porque a API
 * não tem a entidade coleção, já em ordem de lançamento (GET /api/v1/tags/colecoes): primeiro a
 * coleção com a peça mais recente; as que ainda não têm peças vão para o fim.
 */
export async function getCollections(): Promise<Collection[]> {
  if (USA_API) {
    const tags = await colecoesDaApi();
    return [...new Set(tags.map((t) => normalizarTag(t.tag)).filter(Boolean))].map(colecaoDoDrop);
  }
  return state.collections.map((c) => ({ ...c }));
}

/** Uma coleção pela tag ("drop-02"); não existe → null (a tela mostra o 404). */
export async function getCollection(slug: string): Promise<Collection | null> {
  if (USA_API) {
    // basta a tag existir com filtro COLECAO: não precisa buscar os produtos para a ordem
    const tags = await tagsDaApi();
    const existe = opcoesDoFiltro(tags, "COLECAO").some((o) => o.valor === slug);
    return existe ? colecaoDoDrop(slug) : null;
  }
  return state.collections.find((c) => c.tag === slug) ?? null;
}
