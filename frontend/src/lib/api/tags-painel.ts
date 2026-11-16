// Aba Tags do painel: listar, criar, editar e apagar tags, e escolher o filtro de cada uma.
// A própria tag é a opção do filtro ("moletons" com filtro CATEGORIA é a categoria Moletons).
// API: tags-api.ts (as alterações exigem o login da equipe na API, com CATALOG_WRITE).
// Demonstração: as tags ficam na memória (state.tags) e mudam também nos produtos de exemplo, com
// as mesmas travas da API: o filtro só muda numa tag sem produtos, e uma tag de estilo ou de
// categoria em uso não pode ser apagada (todo produto tem um estilo e uma categoria). Os estilos
// fixos (casual e treino) não mudam nem saem.
import { exigirColaborador } from "./autenticacao";
import { USA_API } from "./modo";
import { novoId, state } from "./simulacao";
import { apagarTagNaApi, salvarTagNaApi, tagsDaApi, type TagParaSalvar } from "./tags-api";
import type { FiltroDaTag, TagDaApi } from "./tags";

/** Uma tag na tela do painel. */
export type TagDaLoja = { id: string; tag: string; filtro: FiltroDaTag | null; fixa: boolean };
export type { TagParaSalvar };

const daApi = (t: TagDaApi): TagDaLoja => ({
  id: t.id,
  tag: t.tag,
  filtro: t.filtro ?? null,
  fixa: t.fixa ?? false,
});

const ESTILO_FIXO = (tag: TagDaLoja) => `A tag '${tag.tag}' é um estilo fixo da loja e não muda.`;

/** Todas as tags, em ordem alfabética. */
export async function getTags(): Promise<TagDaLoja[]> {
  const tags = USA_API ? (await tagsDaApi()).map(daApi) : state.tags.map((t) => ({ ...t }));
  return tags.sort((a, b) => a.tag.localeCompare(b.tag));
}

const produtosCom = (tag: string) => state.products.filter((p) => p.tags?.includes(tag)).length;

/** Cria (sem id) ou edita a tag. */
export async function saveTag(entrada: TagParaSalvar): Promise<TagDaLoja> {
  const tag = entrada.tag.trim().toLowerCase();
  if (!tag) throw new Error("Informe o nome da tag.");
  const t = { ...entrada, tag };
  if (USA_API) return daApi(await salvarTagNaApi({ data: t }));

  exigirColaborador("tags");
  if (state.tags.some((x) => x.tag === t.tag && x.id !== t.id))
    throw new Error(`Tag já cadastrada: ${t.tag}`);
  const antiga = state.tags.find((x) => x.id === t.id);
  if (antiga?.fixa && (antiga.tag !== t.tag || antiga.filtro !== t.filtro))
    throw new Error(ESTILO_FIXO(antiga));
  if (antiga && antiga.filtro !== t.filtro && produtosCom(antiga.tag) > 0)
    throw new Error(
      `A tag '${antiga.tag}' está em ${produtosCom(antiga.tag)} produto(s): o filtro só muda numa tag sem produtos.`,
    );
  const salva: TagDaLoja = {
    id: t.id ?? novoId(),
    tag: t.tag,
    filtro: t.filtro,
    fixa: antiga?.fixa ?? false,
  };
  if (antiga) {
    // renomear a tag renomeia também nos produtos
    for (const p of state.products) p.tags = p.tags?.map((x) => (x === antiga.tag ? salva.tag : x));
    Object.assign(antiga, salva);
  } else state.tags.push(salva);
  return { ...salva };
}

/** Apaga a tag; os produtos continuam, só perdem a tag. */
export async function deleteTag(id: string): Promise<void> {
  if (USA_API) return apagarTagNaApi({ data: id });

  exigirColaborador("tags");
  const tag = state.tags.find((t) => t.id === id);
  if (!tag) return;
  if (tag.fixa) throw new Error(ESTILO_FIXO(tag));
  const emUso = produtosCom(tag.tag);
  if ((tag.filtro === "ESTILO" || tag.filtro === "CATEGORIA") && emUso > 0)
    throw new Error(
      `A tag '${tag.tag}' é de ${tag.filtro.toLowerCase()} e está em ${emUso} produto(s): troque a tag desses produtos antes.`,
    );
  state.tags = state.tags.filter((t) => t.id !== id);
  for (const p of state.products) p.tags = p.tags?.filter((x) => x !== tag.tag);
}

/** Quantos produtos usam cada tag (pelo nome normalizado, como o catálogo compara). */
export function contarProdutosPorTag(produtos: { tags?: string[] }[]): Map<string, number> {
  const contagem = new Map<string, number>();
  for (const p of produtos)
    for (const t of new Set(p.tags ?? [])) contagem.set(t, (contagem.get(t) ?? 0) + 1);
  return contagem;
}
