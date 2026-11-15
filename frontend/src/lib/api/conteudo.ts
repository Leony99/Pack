// Conteúdo institucional, newsletter e contato.
import { faq, terms } from "@/data";
import { emailValido, novoId, simularLatencia, state } from "./simulacao";

/** FAQ e termos. */
export async function getContent(_page: "faq" | "terms") {
  // PACK API: não tem conteúdo (FAQ, termos): continua em src/data/content.ts.
  return { faq, terms };
}

/** Inscreve na newsletter (na simulação, só guarda na memória). */
export async function subscribeNewsletter(email: string): Promise<{ simulated: boolean }> {
  // PACK API: não tem newsletter (falta na API).
  const limpo = email.trim().toLowerCase();
  if (!emailValido(email.trim())) throw new Error("Informe um e-mail válido.");
  if (!state.subscribers.some((s) => s.email === limpo))
    state.subscribers.push({ id: novoId(), email: limpo, active: true });
  return { simulated: true };
}

/** Mensagem do formulário de contato. */
export async function sendContact(data: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  // PACK API: não tem contato (falta na API).
  if (!data.name.trim() || !data.message.trim() || !emailValido(data.email))
    throw new Error("Preencha nome, e-mail válido e mensagem.");
  state.messages.push({ id: novoId(), ...data, status: "Aberto" });
  await simularLatencia(300);
}
