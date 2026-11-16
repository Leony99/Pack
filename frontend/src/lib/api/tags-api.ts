// Tags na Pack API: funções de servidor (createServerFn), no padrão BFF.
//   GET    /api/v1/tags        lista (pública)
//   POST   /api/v1/tags        { tag, filtro }  cria     (CATALOG_WRITE)
//   PUT    /api/v1/tags/{id}   { tag, filtro }  edita    (CATALOG_WRITE; o filtro só muda sem produtos)
//   DELETE /api/v1/tags/{id}                          apaga    (CATALOG_WRITE; os produtos só perdem a tag)
// As alterações vão com o token da equipe (cookie httpOnly); sem ele, a resposta é 401.
import { createServerFn } from "@tanstack/react-start";
import { ErroDaApi } from "./erros";
import { chamarApi } from "./server/http";
import type { FiltroDaTag, TagDaApi } from "./tags";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FILTROS: FiltroDaTag[] = ["ESTILO", "CATEGORIA", "COLECAO"];

export type TagParaSalvar = {
  id?: string;
  tag: string;
  filtro: FiltroDaTag | null;
};

function validarId(id: unknown): string {
  if (typeof id !== "string" || !UUID.test(id)) throw new ErroDaApi(400, "Tag inválida.");
  return id;
}

/** O que o navegador manda é conferido aqui antes de ir para a API (a API confere de novo). */
function validarTag(entrada: unknown): TagParaSalvar {
  const e = (entrada ?? {}) as Record<string, unknown>;
  const tag = typeof e["tag"] === "string" ? e["tag"].trim().slice(0, 50) : "";
  if (!tag) throw new ErroDaApi(400, "Informe o nome da tag.");
  const filtro = FILTROS.includes(e["filtro"] as FiltroDaTag) ? (e["filtro"] as FiltroDaTag) : null;
  return { id: e["id"] === undefined ? undefined : validarId(e["id"]), tag, filtro };
}

export const tagsDaApi = createServerFn({ method: "GET" }).handler(async (): Promise<TagDaApi[]> =>
  chamarApi<TagDaApi[]>("/api/v1/tags"),
);

export const salvarTagNaApi = createServerFn({ method: "POST" })
  .validator(validarTag)
  .handler(async ({ data }): Promise<TagDaApi> => {
    const corpo = { tag: data.tag, filtro: data.filtro };
    return data.id
      ? chamarApi<TagDaApi>(`/api/v1/tags/${data.id}`, {
          method: "PUT",
          body: corpo,
          sessao: "equipe",
        })
      : chamarApi<TagDaApi>("/api/v1/tags", { method: "POST", body: corpo, sessao: "equipe" });
  });

export const apagarTagNaApi = createServerFn({ method: "POST" })
  .validator(validarId)
  .handler(async ({ data: id }) => {
    await chamarApi(`/api/v1/tags/${id}`, { method: "DELETE", sessao: "equipe" });
  });
