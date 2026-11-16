// Classificação das tags dos produtos nos filtros do catálogo.
//
// Na Pack API, cada tag diz em qual filtro aparece (o campo `filtro`, escolhido no painel, aba Tags),
// e a própria tag é a opção do filtro:
//   ESTILO     "treino" é o estilo Treino (todo produto tem pelo menos um);
//   CATEGORIA  "moletons" é a categoria Moletons (todo produto tem exatamente uma);
//   COLECAO    "drop-natal" é a coleção (o drop) DROP NATAL (opcional);
//   sem filtro a tag fica no produto e só vale na busca.
// As opções dos filtros do catálogo e das rotas /catalogo/estilo/categoria são as tags.
// A curadoria (destaques e novidades) não usa tag: vem das vendas e da data de cadastro.
import type { Collection, ItemType, Style } from "@/data";

/** Os filtros que uma tag pode ter na API (null: nenhum). */
export type FiltroDaTag = "ESTILO" | "CATEGORIA" | "COLECAO";

/** A tag como a API devolve (no produto e em GET /tags). */
export type TagDaApi = {
  id: string;
  tag: string;
  filtro?: FiltroDaTag | null;
  /** os estilos fixos da loja (casual e treino): não mudam nem saem */
  fixa?: boolean;
};

/** Os estilos fixos e as categorias que a loja cria sozinha (TagsIniciais, no backend). */
export const ESTILOS_FIXOS = ["casual", "treino"];
export const CATEGORIAS_INICIAIS = ["camisa", "bermuda", "conjunto"];

/** Uma opção de filtro: o valor na URL (a tag normalizada) e o nome na tela. */
export type Opcao = { valor: string; nome: string };

/** "drop-natal" → "Drop natal": o nome da opção a partir da tag. */
export function nomeDaOpcao(tag: string): string {
  const texto = tag.replace(/-/g, " ").trim();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** As opções dos filtros na demonstração: as mesmas tags que a API cria sozinha. */
export const OPCOES_DA_DEMONSTRACAO: { estilos: Opcao[]; categorias: Opcao[] } = {
  estilos: ESTILOS_FIXOS.map((valor) => ({ valor, nome: nomeDaOpcao(valor) })),
  categorias: CATEGORIAS_INICIAIS.map((valor) => ({ valor, nome: nomeDaOpcao(valor) })),
};

/** As tags de um filtro como opções, sem repetir, em ordem alfabética. */
export function opcoesDoFiltro(tags: TagDaApi[], filtro: FiltroDaTag): Opcao[] {
  const valores = new Set(tags.filter((t) => t.filtro === filtro).map((t) => normalizarTag(t.tag)));
  return [...valores]
    .filter(Boolean)
    .sort()
    .map((valor) => ({ valor, nome: nomeDaOpcao(valor) }));
}

/** Valor de filtro que pode ir na URL: letras minúsculas, números e hífen. */
export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

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

/**
 * Tag de drop da demonstração ("drop-02"). Na API, a coleção é a tag com filtro COLECAO; a
 * demonstração não tem esse campo e reconhece o drop pelo nome.
 */
export const DROP = /^drop-[a-z0-9-]+$/;

export type TagsClassificadas = {
  estilos: Style[];
  categoria?: ItemType;
  /** Tags com filtro COLECAO, normalizadas (viram /colecao/<tag>). */
  colecoes: string[];
  /** Todas as tags normalizadas (a busca e o filtro de coleção usam esta lista). */
  todas: string[];
};

/** Distribui as tags de um produto nos filtros do catálogo, pelo filtro de cada tag na API. */
export function classificarTags(tags: TagDaApi[]): TagsClassificadas {
  const doFiltro = (filtro: FiltroDaTag) =>
    [...new Set(tags.filter((t) => t.filtro === filtro).map((t) => normalizarTag(t.tag)))].filter(
      Boolean,
    );
  const estilos = doFiltro("ESTILO");
  const categoria = doFiltro("CATEGORIA")[0];
  const colecoes = doFiltro("COLECAO");
  const todas = [...new Set(tags.map((t) => normalizarTag(t.tag)).filter(Boolean))];
  return { estilos, categoria, colecoes, todas };
}

/** As coleções do produto: as da API (filtro COLECAO) ou, na demonstração, as tags de drop. */
export function colecoesDoProduto(p: { colecoes?: string[]; tags?: string[] }): string[] {
  return p.colecoes ?? (p.tags ?? []).filter((t) => DROP.test(t));
}

/**
 * Peças da mais nova para a mais antiga, pela data de cadastro. Sem data (demonstração), a peça
 * conta como a mais antiga; empate mantém a ordem da lista.
 */
export function maisRecentesPrimeiro<T extends { createdAt?: string }>(produtos: T[]): T[] {
  const quando = (p: T) => (p.createdAt ? Date.parse(p.createdAt) || 0 : 0);
  return [...produtos].sort((a, b) => quando(b) - quando(a));
}

/**
 * O drop em destaque: a coleção ("drop-natal", "drop-02"...) da peça cadastrada mais recentemente
 * entre as que estão em alguma. Nenhuma peça em coleção → undefined (EM BREVE).
 */
export function tagDoDropEmDestaque(
  produtos: { tags?: string[]; colecoes?: string[]; createdAt?: string }[],
) {
  for (const p of maisRecentesPrimeiro(produtos)) {
    const tag = colecoesDoProduto(p)[0];
    if (tag) return tag;
  }
  return undefined;
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
