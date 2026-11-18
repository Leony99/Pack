// Painel da equipe na Pack API: funções de servidor (createServerFn) com o token da equipe (cookie
// httpOnly). Uma ponte genérica serve todas as telas: ela só aceita caminhos da API e os métodos
// comuns, e quem decide o que cada colaborador pode fazer é a API, pelas permissões do papel dele
// (a ponte não dá a ninguém mais do que o próprio token daria).
import { createServerFn } from "@tanstack/react-start";
import { ErroDaApi } from "./erros";
import { chamarApi, enviarArquivoParaApi } from "./server/http";

/** O que a API devolve (JSON); um 204 vira null. */
export type Json = string | number | boolean | null | Json[] | { [chave: string]: Json };

const METODOS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type Metodo = (typeof METODOS)[number];

/** Só caminhos da API, sem "..", espaços nem outro host. */
const CAMINHO = /^\/api\/v1\/[A-Za-z0-9/_\-.~%?=&,]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** O painel reduz a foto antes de enviar; este é o limite da API. */
const MAXIMO_DA_FOTO = 5 * 1024 * 1024;

function validarChamada(entrada: unknown): { metodo: Metodo; caminho: string; corpo?: unknown } {
  const e = (entrada ?? {}) as Record<string, unknown>;
  const metodo = e["metodo"];
  const caminho = e["caminho"];
  if (!METODOS.includes(metodo as Metodo)) throw new ErroDaApi(400, "Método inválido.");
  if (typeof caminho !== "string" || !CAMINHO.test(caminho) || caminho.includes(".."))
    throw new ErroDaApi(400, "Caminho inválido.");
  return { metodo: metodo as Metodo, caminho, corpo: e["corpo"] };
}

/** Uma chamada do painel à API, com o token da equipe. */
export const chamarPainelNaApi = createServerFn({ method: "POST" })
  .validator(validarChamada)
  .handler(async ({ data }): Promise<Json> => {
    const resposta = await chamarApi<Json | undefined>(data.caminho, {
      method: data.metodo,
      body: data.corpo,
      sessao: "equipe",
    });
    return resposta ?? null;
  });

/** Envia a foto de um produto (o navegador já reduziu para WebP); a API guarda no bucket. */
export const enviarFotoNaApi = createServerFn({ method: "POST" })
  .validator((entrada: unknown) => {
    if (!(entrada instanceof FormData)) throw new ErroDaApi(400, "Envio inválido.");
    const produto = entrada.get("produto");
    const arquivo = entrada.get("arquivo");
    if (typeof produto !== "string" || !UUID.test(produto))
      throw new ErroDaApi(400, "Produto inválido.");
    if (!(arquivo instanceof Blob) || arquivo.size === 0 || arquivo.size > MAXIMO_DA_FOTO)
      throw new ErroDaApi(400, "A foto precisa ter até 5 MB.");
    return { produto, arquivo };
  })
  .handler(async ({ data }) => {
    const formulario = new FormData();
    formulario.append("arquivo", data.arquivo, "foto.webp");
    return enviarArquivoParaApi<{ id: string; url: string; ordem: number }>(
      `/api/v1/products/${data.produto}/images/upload`,
      formulario,
      "equipe",
    );
  });
