// Conteúdo institucional, newsletter e contato.
import { faq, terms } from "@/data";
import { enviarContatoNaApi, inscreverNaNewsletterDaApi } from "./conta-api";
import { USA_API } from "./modo";
import { emailValido, novoId, simularLatencia, state } from "./simulacao";

/** FAQ e termos. */
export async function getContent(_page: "faq" | "terms") {
  // PACK API: não tem conteúdo (FAQ, termos): continua em src/data/content.ts.
  return { faq, terms };
}

/** Inscreve na newsletter (na API, a lista de inscritos; na simulação, só guarda na memória). */
export async function subscribeNewsletter(email: string): Promise<{ simulated: boolean }> {
  // PACK API: POST /api/v1/newsletter { email } (pública; a resposta é a mesma se já estava na lista).
  if (USA_API) {
    if (!emailValido(email)) throw new Error("Informe um e-mail válido.");
    await inscreverNaNewsletterDaApi({ data: email });
    return { simulated: false };
  }
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
  // PACK API: POST /api/v1/contato { nome, email, mensagem } (a equipe lê na aba Atendimento).
  if (!data.name.trim() || !data.message.trim() || !emailValido(data.email))
    throw new Error("Preencha nome, e-mail válido e mensagem.");
  if (data.message.length > 2000) throw new Error("A mensagem pode ter até 2.000 letras.");
  if (USA_API) {
    await enviarContatoNaApi({
      data: { nome: data.name, email: data.email, mensagem: data.message },
    });
    return;
  }
  state.messages.push({ id: novoId(), ...data, status: "Aberto" });
  await simularLatencia(300);
}
