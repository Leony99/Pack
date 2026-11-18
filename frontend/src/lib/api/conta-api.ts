// Área do cliente na Pack API: funções de servidor (createServerFn), sempre com o token do cliente
// (cookie httpOnly). O id do cliente vem do próprio token (idDaSessao); a API confere, em toda
// chamada, que o recurso é dele.
import { createServerFn } from "@tanstack/react-start";
import type { CustomerProfile, SavedAddress } from "@/data/dashboard";
import type { Order } from "@/data/types";
import {
  enderecoDaApi,
  enderecoParaApi,
  pedidoDaApi,
  type EnderecoDaApi,
  type PaginaDaApi,
  type PedidoDaApi,
} from "./adaptadores";
import { ErroDaApi } from "./erros";
import { chamarApi, idDaSessao } from "./server/http";

/** CustomerResponse da API. */
type ClienteDaApi = { id: string; nome: string; email: string; telefone: string };

/** A API devolve no máximo 100 por página; a conta mostra até 500 pedidos. */
const POR_PAGINA = 100;
const MAXIMO_DE_PAGINAS = 5;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** O id do cliente logado, ou 401 (a tela volta para o "entrar"). */
function clienteLogado(): string {
  const id = idDaSessao("cliente");
  if (!id) throw new ErroDaApi(401, "Sua sessão expirou. Entre de novo.");
  return id;
}

function validarId(entrada: unknown): string {
  if (typeof entrada !== "string" || !UUID.test(entrada)) throw new ErroDaApi(400, "Id inválido.");
  return entrada;
}

function texto(valor: unknown, maximo: number, obrigatorio = true): string {
  if (typeof valor !== "string" || valor.length > maximo || (obrigatorio && !valor.trim()))
    throw new ErroDaApi(400, "Confira os dados enviados.");
  return valor;
}

/** O endereço que o navegador manda: só os campos conhecidos, nos limites da API (AddressRequest). */
function validarEndereco(entrada: unknown): SavedAddress {
  const e = (entrada ?? {}) as Record<string, unknown>;
  const id = e["id"];
  return {
    id: typeof id === "string" && UUID.test(id) ? id : "",
    label: texto(e["label"] ?? "", 40, false),
    primary: e["primary"] === true,
    name: "",
    email: "",
    cep: texto(e["cep"], 9),
    street: texto(e["street"], 150),
    number: texto(e["number"], 10),
    complement: texto(e["complement"] ?? "", 100, false),
    neighborhood: texto(e["neighborhood"], 100),
    city: texto(e["city"], 100),
    state: texto(e["state"], 2),
  };
}

function validarPerfil(entrada: unknown) {
  const e = (entrada ?? {}) as Record<string, unknown>;
  return {
    nome: texto(e["nome"], 100).trim(),
    email: texto(e["email"], 254).trim(),
    telefone: texto(e["telefone"], 20).trim(),
    newsletter: e["newsletter"] === true,
  };
}

async function cliente(id: string): Promise<ClienteDaApi> {
  return chamarApi<ClienteDaApi>(`/api/v1/customers/${id}`, { sessao: "cliente" });
}

async function newsletter(id: string): Promise<boolean> {
  const r = await chamarApi<{ inscrito: boolean }>(`/api/v1/customers/${id}/newsletter`, {
    sessao: "cliente",
  });
  return r.inscrito;
}

function perfil(c: ClienteDaApi, inscrito: boolean): CustomerProfile {
  return { id: c.id, name: c.nome, email: c.email, phone: c.telefone, newsletter: inscrito };
}

async function enderecos(id: string, dono: { name: string; email: string }) {
  const lista = await chamarApi<EnderecoDaApi[]>(`/api/v1/customers/${id}/addresses`, {
    sessao: "cliente",
  });
  return lista.map((e) => enderecoDaApi(e, dono));
}

/** Os pedidos do cliente, do mais antigo ao mais novo (a API manda do mais novo, em páginas). */
async function pedidos(id: string): Promise<Order[]> {
  const todos: PedidoDaApi[] = [];
  for (let pagina = 0; pagina < MAXIMO_DE_PAGINAS; pagina++) {
    const r = await chamarApi<PaginaDaApi<PedidoDaApi>>(
      `/api/v1/customers/${id}/orders?pagina=${pagina}&tamanho=${POR_PAGINA}`,
      { sessao: "cliente" },
    );
    todos.push(...r.itens);
    if (pagina + 1 >= r.totalPaginas) break;
  }
  return todos.reverse().map(pedidoDaApi);
}

/** Tudo da área do cliente de uma vez: dados, newsletter, endereços e pedidos. */
export const contaDaApi = createServerFn({ method: "GET" }).handler(async () => {
  const id = clienteLogado();
  const [dados, inscrito, lista] = await Promise.all([cliente(id), newsletter(id), pedidos(id)]);
  const customer = perfil(dados, inscrito);
  return {
    customer,
    orders: lista,
    addresses: await enderecos(id, customer),
    // trocas não existem na API: o cliente pede pelo atendimento
    returns: [] as { id: string; orderId: string; reason: string; status: string }[],
  };
});

/** Salva nome, e-mail e telefone (PUT /customers/{id}) e a newsletter (PUT .../newsletter). */
export const salvarPerfilNaApi = createServerFn({ method: "POST" })
  .validator(validarPerfil)
  .handler(async ({ data }) => {
    const id = clienteLogado();
    const dados = await chamarApi<ClienteDaApi>(`/api/v1/customers/${id}`, {
      method: "PUT",
      sessao: "cliente",
      body: { nome: data.nome, email: data.email, telefone: data.telefone },
    });
    // depois do e-mail novo: a newsletter vale para o e-mail da conta
    const r = await chamarApi<{ inscrito: boolean }>(`/api/v1/customers/${id}/newsletter`, {
      method: "PUT",
      sessao: "cliente",
      body: { inscrito: data.newsletter },
    });
    return perfil(dados, r.inscrito);
  });

export const enderecosDaApi = createServerFn({ method: "GET" }).handler(async () => {
  const id = clienteLogado();
  const dados = await cliente(id);
  return enderecos(id, { name: dados.nome, email: dados.email });
});

/** Cria (sem id) ou edita (com id) um endereço. */
export const salvarEnderecoNaApi = createServerFn({ method: "POST" })
  .validator(validarEndereco)
  .handler(async ({ data }) => {
    const id = clienteLogado();
    const caminho = `/api/v1/customers/${id}/addresses${data.id ? `/${data.id}` : ""}`;
    const salvo = await chamarApi<EnderecoDaApi>(caminho, {
      method: data.id ? "PUT" : "POST",
      sessao: "cliente",
      body: enderecoParaApi(data),
    });
    return enderecoDaApi(salvo, { name: "", email: "" });
  });

export const apagarEnderecoNaApi = createServerFn({ method: "POST" })
  .validator(validarId)
  .handler(async ({ data }) => {
    const id = clienteLogado();
    await chamarApi<void>(`/api/v1/customers/${id}/addresses/${data}`, {
      method: "DELETE",
      sessao: "cliente",
    });
  });

export const pedidosDoClienteNaApi = createServerFn({ method: "GET" }).handler(async () =>
  pedidos(clienteLogado()),
);

/** Um pedido do cliente; de outro cliente (403) ou inexistente (404) vira null. */
export const pedidoDoClienteNaApi = createServerFn({ method: "GET" })
  .validator(validarId)
  .handler(async ({ data }) => {
    clienteLogado();
    try {
      return pedidoDaApi(
        await chamarApi<PedidoDaApi>(`/api/v1/orders/${data}`, { sessao: "cliente" }),
      );
    } catch (erro) {
      if (erro instanceof ErroDaApi && (erro.status === 403 || erro.status === 404)) return null;
      throw erro;
    }
  });

export const cancelarPedidoNaApi = createServerFn({ method: "POST" })
  .validator(validarId)
  .handler(async ({ data }) => {
    clienteLogado();
    await chamarApi<PedidoDaApi>(`/api/v1/orders/${data}/cancelar`, {
      method: "POST",
      sessao: "cliente",
    });
  });

/** Inscrição pública na newsletter (o formulário da home e da página da newsletter). */
export const inscreverNaNewsletterDaApi = createServerFn({ method: "POST" })
  .validator((entrada: unknown) => texto(entrada, 254).trim())
  .handler(async ({ data }) => {
    await chamarApi<void>("/api/v1/newsletter", { method: "POST", body: { email: data } });
  });

/** Mensagem do formulário de Contato (pública; a API limita por IP). */
export const enviarContatoNaApi = createServerFn({ method: "POST" })
  .validator((entrada: unknown) => {
    const e = (entrada ?? {}) as Record<string, unknown>;
    return {
      nome: texto(e["nome"], 100).trim(),
      email: texto(e["email"], 254).trim(),
      mensagem: texto(e["mensagem"], 2000).trim(),
    };
  })
  .handler(async ({ data }) => {
    await chamarApi<void>("/api/v1/contato", { method: "POST", body: data });
  });
