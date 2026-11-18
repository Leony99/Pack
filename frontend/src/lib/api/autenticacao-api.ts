// Login na Pack API: funções de servidor (createServerFn). O navegador manda e-mail e senha para o
// servidor do frontend, que chama a API e guarda o token num cookie httpOnly (o JavaScript da página
// nunca vê o token). As outras chamadas protegidas leem esse cookie no servidor (server/http.ts).
import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import type { CustomerProfile, StaffMember } from "@/data/dashboard";
import { ErroDaApi } from "./erros";
import { chamarApi, COOKIE_DO_TOKEN, type Sessao } from "./server/http";

/** O que a API devolve no login e no cadastro (TokenResponse). */
type TokenDaApi = { token: string; expiraEm: string; usuario: UsuarioDaApi };
/** GET /auth/me (UsuarioResponse). */
type UsuarioDaApi = {
  id: string;
  nome: string;
  email: string;
  tipo: "CUSTOMER" | "STAFF";
  permissoes: string[];
  papel: string | null;
};

/** Os limites da API (LoginRequest e RegisterRequest): o servidor confere antes de chamar. */
const LIMITE = { email: 254, senha: 128, nome: 100, telefone: 20 };

function texto(valor: unknown, campo: string, maximo: number): string {
  if (typeof valor !== "string" || !valor.trim() || valor.length > maximo)
    throw new ErroDaApi(400, `Confira o campo ${campo}.`);
  return valor;
}

function validarLogin(entrada: unknown): { sessao: Sessao; email: string; senha: string } {
  const e = (entrada ?? {}) as Record<string, unknown>;
  if (e["sessao"] !== "cliente" && e["sessao"] !== "equipe")
    throw new ErroDaApi(400, "Login inválido.");
  return {
    sessao: e["sessao"],
    email: texto(e["email"], "e-mail", LIMITE.email).trim(),
    senha: texto(e["senha"], "senha", LIMITE.senha),
  };
}

function validarCadastro(entrada: unknown) {
  const e = (entrada ?? {}) as Record<string, unknown>;
  return {
    nome: texto(e["nome"], "nome", LIMITE.nome).trim(),
    email: texto(e["email"], "e-mail", LIMITE.email).trim(),
    telefone: texto(e["telefone"], "telefone", LIMITE.telefone).trim(),
    senha: texto(e["senha"], "senha", LIMITE.senha),
  };
}

function validarSessao(entrada: unknown): Sessao {
  if (entrada !== "cliente" && entrada !== "equipe") throw new ErroDaApi(400, "Sessão inválida.");
  return entrada;
}

function validarTrocaDeSenha(entrada: unknown) {
  const e = (entrada ?? {}) as Record<string, unknown>;
  return {
    senhaAtual: texto(e["senhaAtual"], "senha atual", LIMITE.senha),
    novaSenha: texto(e["novaSenha"], "nova senha", LIMITE.senha),
  };
}

/**
 * Guarda o token no cookie da sessão: httpOnly (o JavaScript da página não lê), SameSite=Lax (outro
 * site não consegue mandar o cookie num POST) e Secure fora do modo de desenvolvimento (só HTTPS).
 * Vence junto com o token.
 */
function guardarToken(sessao: Sessao, resposta: TokenDaApi) {
  const segundos = Math.floor((Date.parse(resposta.expiraEm) - Date.now()) / 1000);
  setCookie(COOKIE_DO_TOKEN[sessao], resposta.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: !import.meta.env.DEV,
    path: "/",
    maxAge: Math.max(segundos, 0),
  });
}

function apagarToken(sessao: Sessao) {
  deleteCookie(COOKIE_DO_TOKEN[sessao], { path: "/" });
}

/** O cliente como as telas usam (o telefone vem da área do cliente). */
function clienteDaApi(u: UsuarioDaApi): CustomerProfile {
  return { id: u.id, name: u.nome, email: u.email, phone: "", newsletter: false };
}

/** O colaborador como as telas usam: o painel decide as abas pelas permissões (canStaff). */
function colaboradorDaApi(u: UsuarioDaApi): StaffMember {
  return {
    id: u.id,
    name: u.nome,
    email: u.email,
    role: (u.papel ?? "equipe").toLowerCase(),
    active: true,
    permissoes: u.permissoes,
  };
}

function usuarioDaSessao(sessao: Sessao, u: UsuarioDaApi) {
  return sessao === "cliente" ? clienteDaApi(u) : colaboradorDaApi(u);
}

/** Entra como cliente (POST /auth/login) ou colaborador (POST /auth/staff/login). */
export const entrarNaApi = createServerFn({ method: "POST" })
  .validator(validarLogin)
  .handler(async ({ data }) => {
    const caminho = data.sessao === "cliente" ? "/api/v1/auth/login" : "/api/v1/auth/staff/login";
    const resposta = await chamarApi<TokenDaApi>(caminho, {
      method: "POST",
      body: { email: data.email, senha: data.senha },
    });
    guardarToken(data.sessao, resposta);
    return usuarioDaSessao(data.sessao, resposta.usuario);
  });

/** Cria a conta do cliente e já entra (POST /auth/register). */
export const cadastrarNaApi = createServerFn({ method: "POST" })
  .validator(validarCadastro)
  .handler(async ({ data }) => {
    const resposta = await chamarApi<TokenDaApi>("/api/v1/auth/register", {
      method: "POST",
      body: data,
    });
    guardarToken("cliente", resposta);
    return clienteDaApi(resposta.usuario);
  });

/**
 * Quem está logado na sessão (GET /auth/me), ou null. Sem cookie, nem chama a API. Token vencido ou
 * inválido (401): apaga o cookie e responde null, como quem não entrou.
 */
export const sessaoDaApi = createServerFn({ method: "GET" })
  .validator(validarSessao)
  .handler(async ({ data: sessao }) => {
    if (!getCookie(COOKIE_DO_TOKEN[sessao])) return null;
    try {
      const usuario = await chamarApi<UsuarioDaApi>("/api/v1/auth/me", { sessao });
      const tipoCerto = usuario.tipo === (sessao === "cliente" ? "CUSTOMER" : "STAFF");
      if (tipoCerto) return usuarioDaSessao(sessao, usuario);
    } catch (erro) {
      if (!(erro instanceof ErroDaApi) || erro.status !== 401) throw erro;
    }
    apagarToken(sessao);
    return null;
  });

/** Sai da sessão: a API não guarda sessões (o JWT vale até vencer), então basta apagar o cookie. */
export const sairDaApi = createServerFn({ method: "POST" })
  .validator(validarSessao)
  .handler(async ({ data: sessao }) => {
    apagarToken(sessao);
  });

/** O cliente logado troca a senha (PATCH /auth/senha, com a senha atual). */
export const trocarSenhaNaApi = createServerFn({ method: "POST" })
  .validator(validarTrocaDeSenha)
  .handler(async ({ data }) => {
    await chamarApi<void>("/api/v1/auth/senha", { method: "PATCH", body: data, sessao: "cliente" });
  });
