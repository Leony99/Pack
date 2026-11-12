// Guarda o último erro não tratado do servidor, para o server.ts conseguir registrar o erro de
// verdade (com a pilha de chamadas) quando o h3 já o transformou numa resposta 500 genérica.
// O erro guardado vale por 5 segundos: depois disso, já não é do pedido atual.

let lastCapturedError: { error: unknown; at: number } | undefined;
const VALIDADE_MS = 5_000;

function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
}

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}

/** Devolve o último erro guardado (e o apaga), se ainda estiver dentro da validade. */
export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  const { error, at } = lastCapturedError;
  lastCapturedError = undefined;
  return Date.now() - at > VALIDADE_MS ? undefined : error;
}
