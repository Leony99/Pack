// Entrada do servidor (SSR), apontada no vite.config.ts. Repassa cada requisição ao TanStack Start
// e, se a renderização quebrar, responde com a página de erro 500 do site em vez de um JSON cru.
import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

/** Carrega a entrada do TanStack Start uma vez só e reaproveita nas próximas requisições. */
async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// O h3 (servidor por baixo do TanStack Start) transforma um erro lançado na renderização numa
// resposta 500 comum, com o corpo {"unhandled":true,"message":"HTTPError"}. Como o erro não chega
// ao try/catch, a resposta é reconhecida por esse corpo e trocada pela página de erro.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/**
 * Cabeçalhos de segurança em todas as respostas:
 * - nosniff: o navegador não "adivinha" o tipo de um arquivo (um texto não vira script);
 * - DENY / frame-ancestors: a loja não pode ser aberta dentro de um iframe de outro site (clickjacking);
 * - Referrer-Policy: outros sites recebem só o domínio de onde veio o clique, não a URL inteira;
 * - Permissions-Policy: a página não pede câmera, microfone nem localização.
 * O HSTS (só HTTPS) e a CSP ficam para a hospedagem: ver "Segurança" no README.
 */
const CABECALHOS_DE_SEGURANCA: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "frame-ancestors 'none'",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function comCabecalhosDeSeguranca(response: Response): Response {
  // a resposta pode ter cabeçalhos imutáveis: copia para uma nova, com o mesmo corpo (em stream)
  const segura = new Response(response.body, response);
  for (const [nome, valor] of Object.entries(CABECALHOS_DE_SEGURANCA)) {
    if (!segura.headers.has(nome)) segura.headers.set(nome, valor);
  }
  return segura;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return comCabecalhosDeSeguranca(await normalizeCatastrophicSsrResponse(response));
    } catch (error) {
      console.error(error);
      return comCabecalhosDeSeguranca(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );
    }
  },
};
