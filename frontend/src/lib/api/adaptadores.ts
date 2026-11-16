// Tradução entre o formato da Pack API (campos em português, produto → variantes) e o formato que
// as telas usam (src/data/types.ts). As telas não conhecem a API: só esta camada muda se o contrato
// mudar. Funções puras, testadas em adaptadores.test.ts.
import type { Product } from "@/data/types";
import { classificarTags, type TagDaApi } from "./tags";

/** Listagem paginada da API: GET /products?pagina=0&tamanho=20. */
export type PaginaDaApi<T> = {
  itens: T[];
  pagina: number;
  tamanho: number;
  totalItens: number;
  totalPaginas: number;
};

export type VarianteDaApi = {
  id: string;
  sku: string;
  size: { id: string; label: string } | null;
  color: { id: string; nome: string; hex: string } | null;
  precoEfetivo: number;
  quant: number;
  /** null nas variantes cadastradas antes de a API guardar a data */
  criadoEm?: string | null;
};

export type ProdutoDaApi = {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  slug: string;
  criadoEm: string;
  imagens: { id: string; url: string; ordem: number }[] | null;
  tags: TagDaApi[] | null;
  variantes: VarianteDaApi[] | null;
};

/** Imagem do produto sem foto cadastrada: um quadro cinza com o nome da marca. */
export const IMAGEM_SEM_FOTO =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect width="300" height="400" fill="#ececec"/><text x="150" y="208" text-anchor="middle" font-family="sans-serif" font-size="18" letter-spacing="6" fill="#9a9a9a">PACK</text></svg>',
  );

/** Só aceita imagens http(s): uma URL estranha vinda do banco não vira src de imagem. */
function urlDeImagemSegura(url: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

/** Cor do produto para as telas (que só conhecem preto e branco), pela cor da primeira variante. */
function corDoProduto(variantes: VarianteDaApi[]): Product["color"] {
  const cor = variantes.find((v) => v.color)?.color;
  if (!cor) return "BLACK";
  const nome = cor.nome.toLowerCase();
  return nome.includes("branc") || nome.includes("white") || cor.hex.toLowerCase() === "#ffffff"
    ? "WHITE"
    : "BLACK";
}

/**
 * ProdutoDaApi → Product.
 * - estoque: soma a quantidade das variantes de cada tamanho (o produto pode ter várias cores);
 * - estilo, categoria e coleções saem do filtro de cada tag na API (ver tags.ts); destaques e novidades não usam tag (mais
 *   vendidos e data de cadastro);
 * - novidadeEm: o cadastro mais recente entre o do produto e o das variantes (selo NOVO);
 * - imagens em ordem, só http(s); sem foto, usa IMAGEM_SEM_FOTO.
 * O que a tela ainda não usa (SKU, cor por variante, preço por variante) fica na API: a escolha de
 * variante entra quando o carrinho for ligado.
 */
export function produtoDaApi(p: ProdutoDaApi): Product {
  const variantes = p.variantes ?? [];
  const imagens = [...(p.imagens ?? [])]
    .sort((a, b) => a.ordem - b.ordem)
    .map((i) => i.url)
    .filter(urlDeImagemSegura);
  const tags = classificarTags(p.tags ?? []);

  const stock: Record<string, number> = {};
  for (const v of variantes) {
    const tamanho = v.size?.label;
    if (tamanho) stock[tamanho] = (stock[tamanho] ?? 0) + Math.max(0, v.quant);
  }

  return {
    id: p.id,
    name: p.nome,
    price: Number(p.preco),
    image: imagens[0] ?? IMAGEM_SEM_FOTO,
    images: imagens.length ? imagens : [IMAGEM_SEM_FOTO],
    color: corDoProduto(variantes),
    styles: tags.estilos,
    // todo produto novo tem categoria; um antigo, sem ela, cai em camisa (a primeira categoria da loja)
    type: tags.categoria ?? "camisa",
    description: p.descricao ?? undefined,
    tags: tags.todas,
    colecoes: tags.colecoes,
    stock,
    active: true,
    createdAt: p.criadoEm,
    novidadeEm: ultimaData([p.criadoEm, ...variantes.map((v) => v.criadoEm)]),
  };
}

/** A data mais recente da lista (ignora as vazias e as inválidas). */
function ultimaData(datas: (string | null | undefined)[]): string | undefined {
  let maior: string | undefined;
  for (const data of datas) {
    if (data && !Number.isNaN(Date.parse(data)) && (!maior || Date.parse(data) > Date.parse(maior)))
      maior = data;
  }
  return maior;
}
