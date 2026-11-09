// Cliente HTTP da API real. Ainda não é usado: cada função dos outros arquivos desta pasta
// tem, num comentário "BACKEND:", a chamada que substitui a simulação quando o backend for ligado.

/** Endereço da API, definido pela variável de ambiente VITE_API_URL. */
export const API_URL = import.meta.env["VITE_API_URL"] ?? "";

/** Faz a requisição em JSON e lança um Error com o status e o corpo quando a resposta não é 2xx. */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}
