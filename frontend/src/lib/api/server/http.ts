// Cliente HTTP da Pack API, só do servidor do frontend (o padrão BFF: o navegador fala com o servidor
// do TanStack Start, e ele fala com a API). Fica na pasta server/, que o vite.config.ts proíbe no
// navegador: o endereço da API e o token nunca chegam ao JavaScript da página.
//
// Variável de ambiente (do servidor, sem o prefixo VITE_):
//   PACK_API_URL  endereço da API, sem barra no fim (ex.: http://localhost:8080)
// Vem do .env do modo (.env.development, .env.production) e pode ser trocado pela variável de
// ambiente de mesmo nome no servidor (a da hospedagem vale mais que a gravada no build).
import { getCookie } from "@tanstack/react-start/server";
import { ErroDaApi, type ErroDaApiJson } from "../erros";

/** Quanto esperar a API antes de desistir (a API no Cloud Run pode levar até 1 min para acordar). */
const TEMPO_LIMITE_MS = 15_000;

/** Nome do cookie httpOnly com o JWT de cada sessão (cliente e equipe são separadas). */
export const COOKIE_DO_TOKEN = {
  cliente: "pack_token_cliente",
  equipe: "pack_token_equipe",
} as const;
export type Sessao = keyof typeof COOKIE_DO_TOKEN;

function enderecoDaApi(): string {
  const doAmbiente = typeof process === "undefined" ? undefined : process.env["PACK_API_URL"];
  const doBuild = typeof __PACK_API_URL__ === "string" ? __PACK_API_URL__ : undefined;
  const url = doAmbiente || doBuild;
  if (!url) {
    throw new ErroDaApi(503, "A loja está sem conexão com a API (PACK_API_URL não configurada).");
  }
  return url.replace(/\/+$/, "");
}

type Opcoes = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Envia o token da sessão (lido do cookie httpOnly), para as rotas protegidas. */
  sessao?: Sessao;
};

/**
 * Chama a Pack API (`caminho` começa em /api/v1) e devolve o JSON da resposta.
 * Erros viram ErroDaApi com o status e a mensagem da própria API (o formato do ApiError do Spring);
 * a API fora do ar ou lenta demais vira 503.
 */
export async function chamarApi<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  if (!caminho.startsWith("/api/v1/")) throw new Error(`Caminho fora da API: ${caminho}`);

  const headers: Record<string, string> = { Accept: "application/json" };
  if (opcoes.body !== undefined) headers["Content-Type"] = "application/json";
  if (opcoes.sessao) {
    const token = getCookie(COOKIE_DO_TOKEN[opcoes.sessao]);
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${enderecoDaApi()}${caminho}`, {
      method: opcoes.method ?? "GET",
      headers,
      body: opcoes.body === undefined ? undefined : JSON.stringify(opcoes.body),
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    });
  } catch (erro) {
    if (erro instanceof ErroDaApi) throw erro;
    console.error("Pack API inacessível:", erro);
    throw new ErroDaApi(
      503,
      "Não foi possível falar com a loja agora. Tente de novo em instantes.",
    );
  }

  if (res.status === 204) return undefined as T;
  if (res.ok) return (await res.json()) as T;

  const corpo = (await res.json().catch(() => null)) as ErroDaApiJson | null;
  const espera = Number(res.headers.get("Retry-After")) || undefined;
  throw ErroDaApi.daResposta(res.status, corpo, espera);
}

/**
 * O id do usuário da sessão (o "sub" do token no cookie), ou null sem sessão. Não confere a
 * assinatura: quem confere é a API, em toda chamada, e ela só deixa o dono mexer nos próprios dados
 * (um id trocado no cookie só leva a um 401 ou 403).
 */
export function idDaSessao(sessao: Sessao): string | null {
  const token = getCookie(COOKIE_DO_TOKEN[sessao]);
  const parte = token?.split(".")[1];
  if (!parte) return null;
  try {
    const base64 = parte.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "="));
    const sub = (JSON.parse(json) as { sub?: unknown }).sub;
    return typeof sub === "string" && /^[0-9a-f-]{36}$/i.test(sub) ? sub : null;
  } catch {
    return null;
  }
}
