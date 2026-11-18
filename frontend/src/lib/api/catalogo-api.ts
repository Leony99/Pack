// Catálogo na Pack API: funções de servidor (createServerFn). O navegador chama o servidor do
// frontend, que chama a API (BFF); o corpo de cada handler nunca vai para o navegador.
// Só leitura e sem login: as rotas de produto da API são públicas.
import { createServerFn } from "@tanstack/react-start";
import type { Product } from "@/data/types";
import { produtoDaApi, type PaginaDaApi, type ProdutoDaApi } from "./adaptadores";
import { normalizarTag, SLUG, type FiltroDaTag, type TagDaApi } from "./tags";
import { ErroDaApi } from "./erros";
import { chamarApi } from "./server/http";

/** A API devolve no máximo 100 por página; o catálogo busca até 10 páginas (1.000 produtos). */
const POR_PAGINA = 100;
const MAXIMO_DE_PAGINAS = 10;
/** A busca por nome da API exige pelo menos 3 letras (com menos, responde 400). */
const MINIMO_DA_BUSCA = 3;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** O que o navegador manda é conferido aqui: só um texto curto de busca, opcional. */
function validarBusca(entrada: unknown): { nome?: string } {
  const nome = (entrada as { nome?: unknown } | null)?.nome;
  if (nome === undefined) return {};
  if (typeof nome !== "string") throw new Error("Busca inválida.");
  return { nome: nome.trim().slice(0, 100) };
}

/**
 * Todos os produtos da API (ou os que batem com a busca por nome), já no formato das telas. Usado
 * pela busca e pelo painel; o catálogo e o drop pedem só a página que mostram (catalogoDaApi e
 * dropEmDestaqueDaApi).
 */
export const produtosDaApi = createServerFn({ method: "GET" })
  .validator(validarBusca)
  .handler(async ({ data }): Promise<Product[]> => {
    const busca =
      data.nome && data.nome.length >= MINIMO_DA_BUSCA
        ? `&nome=${encodeURIComponent(data.nome)}`
        : "";
    const produtos: ProdutoDaApi[] = [];
    for (let pagina = 0; pagina < MAXIMO_DE_PAGINAS; pagina++) {
      const resposta = await chamarApi<PaginaDaApi<ProdutoDaApi>>(
        `/api/v1/products?pagina=${pagina}&tamanho=${POR_PAGINA}${busca}`,
      );
      produtos.push(...resposta.itens);
      if (pagina + 1 >= resposta.totalPaginas) break;
    }
    return produtos.map(produtoDaApi);
  });

/** Uma página do catálogo, já filtrada e ordenada pela API. */
export type PaginaDoCatalogo = { produtos: Product[]; total: number; temMais: boolean };

/** Os filtros do catálogo como o navegador manda: as tags pelo slug da URL ("drop-natal"). */
export type FiltrosParaApi = {
  estilo?: string;
  categoria?: string;
  colecao?: string;
  novidades?: boolean;
  disponiveis?: boolean;
  ordem?: "recent" | "price-asc" | "price-desc" | "name";
  pagina: number;
  tamanho: number;
};

const ORDEM_NA_API = {
  recent: "recentes",
  "price-asc": "menor-preco",
  "price-desc": "maior-preco",
  name: "nome",
} as const;

function validarFiltros(entrada: unknown): FiltrosParaApi {
  const e = (entrada ?? {}) as Record<string, unknown>;
  const slug = (v: unknown) => {
    if (v === undefined) return undefined;
    if (typeof v !== "string" || v.length > 60 || !SLUG.test(v))
      throw new Error("Filtro inválido.");
    return v;
  };
  const inteiro = (v: unknown, min: number, max: number) =>
    typeof v === "number" && Number.isInteger(v) ? Math.min(Math.max(v, min), max) : min;
  const ordem = typeof e.ordem === "string" && e.ordem in ORDEM_NA_API ? e.ordem : "recent";
  return {
    estilo: slug(e.estilo),
    categoria: slug(e.categoria),
    colecao: slug(e.colecao),
    novidades: e.novidades === true,
    disponiveis: e.disponiveis === true,
    ordem: ordem as FiltrosParaApi["ordem"],
    pagina: inteiro(e.pagina, 0, 10_000),
    tamanho: inteiro(e.tamanho, 1, POR_PAGINA),
  };
}

/**
 * Uma página do catálogo (GET /api/v1/products?estilo=&categoria=&colecao=&novidades=&disponiveis=
 * &ordem=&pagina=&tamanho=): quem filtra e ordena é o banco, e só a página pedida vem. A URL da loja
 * usa o slug da tag ("drop-natal") e a API o nome gravado ("drop natal"): a lista de tags faz a ponte.
 */
export const catalogoDaApi = createServerFn({ method: "GET" })
  .validator(validarFiltros)
  .handler(async ({ data }): Promise<PaginaDoCatalogo> => {
    const busca = new URLSearchParams();
    const pelasTags: [FiltroDaTag, string | undefined, string][] = [
      ["ESTILO", data.estilo, "estilo"],
      ["CATEGORIA", data.categoria, "categoria"],
      ["COLECAO", data.colecao, "colecao"],
    ];
    if (pelasTags.some(([, slug]) => slug)) {
      const tags = await chamarApi<TagDaApi[]>("/api/v1/tags");
      for (const [filtro, slug, parametro] of pelasTags) {
        if (!slug) continue;
        const nomes = tags
          .filter((t) => t.filtro === filtro && normalizarTag(t.tag) === slug)
          .map((t) => t.tag);
        // nenhuma tag com esse slug: nenhum produto combina
        if (!nomes.length) return { produtos: [], total: 0, temMais: false };
        for (const nome of nomes) busca.append(parametro, nome);
      }
    }
    if (data.novidades) busca.set("novidades", "true");
    if (data.disponiveis) busca.set("disponiveis", "true");
    busca.set("ordem", ORDEM_NA_API[data.ordem ?? "recent"]);
    busca.set("pagina", String(data.pagina));
    busca.set("tamanho", String(data.tamanho));
    const pagina = await chamarApi<PaginaDaApi<ProdutoDaApi>>(`/api/v1/products?${busca}`);
    return {
      produtos: pagina.itens.map(produtoDaApi),
      total: pagina.totalItens,
      temMais: data.pagina + 1 < pagina.totalPaginas,
    };
  });

/** O drop em destaque como a API devolve: a tag da coleção (null: nenhum drop) e as peças. */
export type DropDaApi = { colecao: string | null; produtos: Product[] };

/** Máximo que a API aceita em GET /products/drop-em-destaque. */
const MAXIMO_DO_DROP = 24;

/**
 * O drop em destaque (GET /api/v1/products/drop-em-destaque?limite=): a coleção da peça mais nova que
 * está em uma, com as peças dela. A API acha os dois em poucas consultas, sem a loja buscar o catálogo.
 */
export const dropEmDestaqueDaApi = createServerFn({ method: "GET" })
  .validator((limite: unknown) => {
    if (typeof limite !== "number" || !Number.isInteger(limite))
      throw new Error("Limite inválido.");
    return Math.min(Math.max(limite, 1), MAXIMO_DO_DROP);
  })
  .handler(async ({ data: limite }): Promise<DropDaApi> => {
    const drop = await chamarApi<{ colecao: string | null; produtos: ProdutoDaApi[] }>(
      `/api/v1/products/drop-em-destaque?limite=${limite}`,
    );
    return { colecao: drop.colecao, produtos: drop.produtos.map(produtoDaApi) };
  });

/** Máximo que a API aceita em GET /products/mais-vendidos. */
export const MAXIMO_DOS_MAIS_VENDIDOS = 48;

/**
 * Os mais vendidos, em ordem (GET /api/v1/products/mais-vendidos?limite=): os dos últimos 90 dias,
 * depois os de sempre e, faltando, os cadastrados mais recentemente. É a linha DESTAQUES.
 */
export const maisVendidosDaApi = createServerFn({ method: "GET" })
  .validator((limite: unknown) => {
    if (typeof limite !== "number" || !Number.isInteger(limite))
      throw new Error("Limite inválido.");
    return Math.min(Math.max(limite, 1), MAXIMO_DOS_MAIS_VENDIDOS);
  })
  .handler(async ({ data: limite }): Promise<Product[]> => {
    const produtos = await chamarApi<ProdutoDaApi[]>(
      `/api/v1/products/mais-vendidos?limite=${limite}`,
    );
    return produtos.map(produtoDaApi);
  });

/** Um produto pelo id (UUID). Id inválido ou produto que não existe → null (a tela mostra o 404). */
export const produtoDaApiPorId = createServerFn({ method: "GET" })
  .validator((id: unknown) => {
    if (typeof id !== "string") throw new Error("Id inválido.");
    return id;
  })
  .handler(async ({ data: id }): Promise<Product | null> => {
    if (!UUID.test(id)) return null;
    try {
      return produtoDaApi(await chamarApi<ProdutoDaApi>(`/api/v1/products/${id}`));
    } catch (erro) {
      if (erro instanceof ErroDaApi && erro.status === 404) return null;
      throw erro;
    }
  });
