// Conteúdo institucional, newsletter e contato.
import { faq, terms } from "@/data";
import { emailValido, novoId, simularLatencia, state } from "./simulacao";

/** GET /content/:page — FAQ e termos */
export async function getContent(_page: "faq" | "terms") {
  // BACKEND: return apiFetch<{ faq: typeof faq; terms: typeof terms }>(`/content/${_page}`);
  return { faq, terms };
}

/** POST /newsletter { email } — na simulação, só guarda na memória */
export async function subscribeNewsletter(email: string): Promise<{ simulated: boolean }> {
  // BACKEND: return apiFetch<{ simulated: boolean }>("/newsletter", { method: "POST", body: JSON.stringify({ email }) });
  const limpo = email.trim().toLowerCase();
  if (!emailValido(email.trim())) throw new Error("Informe um e-mail válido.");
  if (!state.subscribers.some((s) => s.email === limpo))
    state.subscribers.push({ id: novoId(), email: limpo, active: true });
  return { simulated: true };
}

/** POST /contact */
export async function sendContact(data: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  // BACKEND: await apiFetch("/contact", { method: "POST", body: JSON.stringify(data) });
  if (!data.name.trim() || !data.message.trim() || !emailValido(data.email))
    throw new Error("Preencha nome, e-mail válido e mensagem.");
  state.messages.push({ id: novoId(), ...data, status: "Aberto" });
  await simularLatencia(300);
}
