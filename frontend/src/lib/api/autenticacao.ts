// Login, cadastro, sessão e senha de clientes e colaboradores.
// As travas de cargo e de sessão daqui são só experiência de tela na demonstração. A API real precisa
// autenticar cada requisição e conferir, ela mesma, o dono do recurso e as permissões do cargo.
import { customers, staffMembers, type CustomerProfile, type StaffMember } from "@/data";
import { emailValido, novoId, sessao, state } from "./simulacao";

export type Customer = CustomerProfile;
export type Staff = StaffMember;

/** O que cada cargo vê no painel: admin vê tudo. */
export function canStaff(role: StaffMember["role"], resource: string): boolean {
  if (role === "admin") return true;
  if (role === "operacao")
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
  if (!sessao.colaborador || !canStaff(sessao.colaborador.role, resource))
    throw new Error("Acesso indisponível para este cargo na demonstração.");
  return sessao.colaborador;
}

/** Entra como o cliente ou o colaborador de demonstração. Sai quando a API real for ligada. */
export async function enterDemo(kind: "customer" | "staff") {
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
  password: string;
}): Promise<Customer> {
  // PACK API: POST /api/v1/auth/register { nome, email, telefone, senha } → o mesmo do login.
  if (!data.name.trim() || !emailValido(data.email) || data.password.length < 6)
    throw new Error("Informe nome, e-mail válido e senha com pelo menos 6 caracteres.");
  const email = data.email.trim().toLowerCase();
  if (state.customers.some((c) => c.email.toLowerCase() === email))
    throw new Error("E-mail já cadastrado na demonstração.");
  const customer = { id: novoId(), name: data.name.trim(), email, phone: "", newsletter: false };
  state.customers.push(customer);
  sessao.cliente = customer;
  return { ...customer };
}

/** Entra como colaborador (painel /admin). */
export async function loginStaff(email: string, password: string): Promise<Staff> {
  // PACK API: POST /api/v1/auth/staff/login { email, senha } → token no cookie COOKIE_DO_TOKEN.equipe.
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
  return sessao.cliente ? { ...sessao.cliente } : null;
}

/** O colaborador logado, ou null. */
export async function getCurrentStaff(): Promise<Staff | null> {
  // PACK API: GET /api/v1/auth/me com o token da equipe (traz as permissões do papel).
  return sessao.colaborador ? { ...sessao.colaborador } : null;
}

/** Sai da sessão (cliente ou equipe). */
export async function logout(kind: "customer" | "staff"): Promise<void> {
  // PACK API: não tem logout (o JWT vale até expirar). Sair = apagar o cookie do token no servidor.
  if (kind === "customer") sessao.cliente = null;
  else sessao.colaborador = null;
}

/** Envia o link de nova senha. */
export async function recoverPassword(email: string) {
  // PACK API: não tem recuperação de senha (falta na API).
  if (!emailValido(email)) throw new Error("Informe um e-mail válido.");
  return { simulated: true };
}

/** Define a nova senha pelo link recebido. */
export async function resetPassword(password: string, token: string) {
  // PACK API: não tem recuperação de senha (falta na API).
  if (!token || password.length < 6)
    throw new Error("Link inválido ou senha com menos de 6 caracteres.");
  return { simulated: true };
}

/** O cliente logado troca a senha. */
export async function changePassword(current: string, next: string) {
  // PACK API: não tem troca de senha (falta na API).
  exigirCliente();
  if (!current || next.length < 6)
    throw new Error("Informe a senha atual e uma nova senha com pelo menos 6 caracteres.");
  return { simulated: true };
}
