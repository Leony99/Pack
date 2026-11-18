// Login, cadastro, sessão e senha de clientes e colaboradores.
// Com a API (USA_API), o login é real: o token fica num cookie httpOnly do servidor do frontend
// (autenticacao-api.ts) e a API confere o dono e as permissões em toda requisição. Na demonstração,
// as travas de cargo e de sessão daqui são só experiência de tela.
import { customers, staffMembers, type CustomerProfile, type StaffMember } from "@/data";
import {
  cadastrarNaApi,
  entrarNaApi,
  sairDaApi,
  sessaoDaApi,
  trocarSenhaNaApi,
} from "./autenticacao-api";
import { USA_API } from "./modo";
import { emailValido, novoId, sessao, state } from "./simulacao";

export type Customer = CustomerProfile;
export type Staff = StaffMember;

/** A senha da API: de 8 a 32 caracteres (RegisterRequest e TrocaDeSenhaRequest). */
export const SENHA_MINIMA = 8;
export const SENHA_MAXIMA = 32;

/**
 * A permissão da API que libera cada parte do painel. Atendimento e trocas ficam com quem cuida dos
 * clientes e dos pedidos (o papel ATENDENTE); a newsletter, só com quem gerencia a equipe (admin).
 */
const PERMISSAO_DO_RECURSO: Record<string, string> = {
  orders: "ORDER_MANAGE",
  returns: "ORDER_MANAGE",
  products: "CATALOG_WRITE",
  collections: "CATALOG_WRITE",
  tags: "CATALOG_WRITE",
  stock: "INVENTORY_MANAGE",
  coupons: "COUPON_MANAGE",
  customers: "CUSTOMER_READ",
  messages: "CUSTOMER_READ",
  staff: "STAFF_MANAGE",
  subscribers: "STAFF_MANAGE",
};

/**
 * O que o colaborador vê no painel. Com a API, pelas permissões do papel dele (um papel novo funciona
 * sem mudar o site). Na demonstração, pelo cargo: admin vê tudo. A tela só esconde: quem barra de
 * verdade é a API, em cada requisição.
 */
export function canStaff(
  staff: Pick<StaffMember, "role" | "permissoes">,
  resource: string,
): boolean {
  if (staff.permissoes) {
    const permissao = PERMISSAO_DO_RECURSO[resource];
    return !!permissao && staff.permissoes.includes(permissao);
  }
  if (staff.role === "admin") return true;
  if (staff.role === "operacao")
    return ["orders", "products", "stock", "collections", "tags"].includes(resource);
  return ["orders", "customers", "messages", "returns"].includes(resource); // atendimento
}

/** Cliente logado, ou erro se ninguém entrou. */
export function exigirCliente(): CustomerProfile {
  if (!sessao.cliente) throw new Error("Entre na conta de demonstração.");
  return sessao.cliente;
}

/** Colaborador logado com acesso ao recurso, ou erro. */
export function exigirColaborador(resource: string): StaffMember {
  if (!sessao.colaborador || !canStaff(sessao.colaborador, resource))
    throw new Error("Acesso indisponível para este cargo na demonstração.");
  return sessao.colaborador;
}

/** Entra como o cliente ou o colaborador de demonstração (só no modo demonstração). */
export async function enterDemo(kind: "customer" | "staff") {
  if (USA_API) throw new Error("O acesso de demonstração não existe com a loja ligada à API.");
  if (kind === "customer") {
    sessao.cliente = { ...customers[0] };
    return sessao.cliente;
  }
  sessao.colaborador = { ...staffMembers[0] };
  return sessao.colaborador;
}

/** Entra como cliente. */
export async function loginCustomer(email: string, password: string): Promise<Customer> {
  // PACK API: POST /api/v1/auth/login { email, senha } → { token, expiraEm, usuario }. O token vai
  // para o cookie httpOnly COOKIE_DO_TOKEN.cliente (server/http.ts), nunca para o navegador.
  if (USA_API)
    return (await entrarNaApi({ data: { sessao: "cliente", email, senha: password } })) as Customer;
  if (!password.trim()) throw new Error("Informe uma senha de demonstração.");
  const customer = state.customers.find(
    (c) => c.email.toLowerCase() === email.trim().toLowerCase(),
  );
  if (!customer)
    throw new Error(
      "Conta não encontrada nesta demonstração. Crie uma conta ou use o acesso de demonstração.",
    );
  sessao.cliente = { ...customer };
  return { ...customer };
}

/** Cria a conta do cliente e já entra. */
export async function registerCustomer(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<Customer> {
  // PACK API: POST /api/v1/auth/register { nome, email, telefone, senha } → o mesmo do login.
  if (!data.name.trim() || !emailValido(data.email) || !data.phone.trim())
    throw new Error("Informe nome, e-mail válido e telefone.");
  if (data.password.length < SENHA_MINIMA || data.password.length > SENHA_MAXIMA)
    throw new Error(`A senha precisa ter de ${SENHA_MINIMA} a ${SENHA_MAXIMA} caracteres.`);
  if (USA_API)
    return cadastrarNaApi({
      data: { nome: data.name, email: data.email, telefone: data.phone, senha: data.password },
    });
  const email = data.email.trim().toLowerCase();
  if (state.customers.some((c) => c.email.toLowerCase() === email))
    throw new Error("E-mail já cadastrado na demonstração.");
  const customer = {
    id: novoId(),
    name: data.name.trim(),
    email,
    phone: data.phone.trim(),
    newsletter: false,
  };
  state.customers.push(customer);
  sessao.cliente = customer;
  return { ...customer };
}

/** Entra como colaborador (painel /admin). */
export async function loginStaff(email: string, password: string): Promise<Staff> {
  // PACK API: POST /api/v1/auth/staff/login { email, senha } → token no cookie COOKIE_DO_TOKEN.equipe.
  if (USA_API)
    return (await entrarNaApi({ data: { sessao: "equipe", email, senha: password } })) as Staff;
  if (!password.trim()) throw new Error("Informe uma senha de demonstração.");
  const member = state.staff.find(
    (s) => s.email.toLowerCase() === email.trim().toLowerCase() && s.active,
  );
  if (!member) throw new Error("Colaborador não encontrado ou inativo na demonstração.");
  sessao.colaborador = { ...member };
  return { ...member };
}

/** O cliente logado, ou null. */
export async function getCurrentCustomer(): Promise<Customer | null> {
  // PACK API: GET /api/v1/auth/me com o token do cliente (401 → ninguém logado).
  if (USA_API) return (await sessaoDaApi({ data: "cliente" })) as Customer | null;
  return sessao.cliente ? { ...sessao.cliente } : null;
}

/** O colaborador logado, ou null. */
export async function getCurrentStaff(): Promise<Staff | null> {
  // PACK API: GET /api/v1/auth/me com o token da equipe (traz as permissões do papel).
  if (USA_API) return (await sessaoDaApi({ data: "equipe" })) as Staff | null;
  return sessao.colaborador ? { ...sessao.colaborador } : null;
}

/** Sai da sessão (cliente ou equipe). */
export async function logout(kind: "customer" | "staff"): Promise<void> {
  // PACK API: não tem logout (o JWT vale até expirar). Sair = apagar o cookie do token no servidor.
  if (USA_API) return sairDaApi({ data: kind === "customer" ? "cliente" : "equipe" });
  if (kind === "customer") sessao.cliente = null;
  else sessao.colaborador = null;
}

/** A recuperação por e-mail ainda não existe na API: a tela mostra isto no lugar do formulário. */
export const RECUPERACAO_INDISPONIVEL =
  "A recuperação de senha ainda não está disponível. Fale com o suporte para recuperar o acesso.";

/** Envia o link de nova senha. */
export async function recoverPassword(email: string) {
  // PACK API: não tem recuperação de senha (precisa de um serviço de e-mail).
  if (USA_API) throw new Error(RECUPERACAO_INDISPONIVEL);
  if (!emailValido(email)) throw new Error("Informe um e-mail válido.");
  return { simulated: true };
}

/** Define a nova senha pelo link recebido. */
export async function resetPassword(password: string, token: string) {
  // PACK API: não tem recuperação de senha (precisa de um serviço de e-mail).
  if (USA_API) throw new Error(RECUPERACAO_INDISPONIVEL);
  if (!token || password.length < 6)
    throw new Error("Link inválido ou senha com menos de 6 caracteres.");
  return { simulated: true };
}

/** O cliente logado troca a senha. */
export async function changePassword(current: string, next: string) {
  // PACK API: PATCH /api/v1/auth/senha { senhaAtual, novaSenha } (senha atual errada → 422).
  if (!current || next.length < SENHA_MINIMA || next.length > SENHA_MAXIMA)
    throw new Error(
      `Informe a senha atual e uma nova senha de ${SENHA_MINIMA} a ${SENHA_MAXIMA} caracteres.`,
    );
  if (USA_API) {
    await trocarSenhaNaApi({ data: { senhaAtual: current, novaSenha: next } });
    return { simulated: false };
  }
  exigirCliente();
  return { simulated: true };
}
