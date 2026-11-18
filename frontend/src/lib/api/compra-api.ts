// Compra na Pack API: funções de servidor (createServerFn). O carrinho e o pedido são do cliente logado
// (token no cookie httpOnly); o frete é público. Preço, estoque, cupom e frete são sempre recalculados
// pela API: o que vem do navegador só diz o que o cliente escolheu.
import { createServerFn } from "@tanstack/react-start";
import type { ShippingOption } from "@/data/types";
import {
  cupomDaApi,
  enderecoParaApi,
  itemDoCarrinhoDaApi,
  type EnderecoDaApi,
  type ItemDoCarrinhoDaApi,
} from "./adaptadores";
import { ErroDaApi } from "./erros";
import { chamarApi, idDaSessao } from "./server/http";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** A API aceita até 99 unidades de cada item no carrinho. */
const MAXIMO_POR_ITEM = 99;

type CarrinhoDaApi = { itens: ItemDoCarrinhoDaApi[] };

function clienteLogado(): string {
  const id = idDaSessao("cliente");
  if (!id) throw new ErroDaApi(401, "Entre na sua conta para continuar.");
  return id;
}

function uuid(valor: unknown): string {
  if (typeof valor !== "string" || !UUID.test(valor)) throw new ErroDaApi(400, "Id inválido.");
  return valor;
}

function quantidade(valor: unknown): number {
  if (!Number.isInteger(valor) || (valor as number) < 1 || (valor as number) > MAXIMO_POR_ITEM)
    throw new ErroDaApi(400, `A quantidade vai de 1 a ${MAXIMO_POR_ITEM}.`);
  return valor as number;
}

function campos(entrada: unknown): Record<string, unknown> {
  return (entrada ?? {}) as Record<string, unknown>;
}

const itens = (c: CarrinhoDaApi) => c.itens.map(itemDoCarrinhoDaApi);
const rotaDoCarrinho = (id: string) => `/api/v1/customers/${id}/cart`;

/* ------------------------------------------------------------------ carrinho */

export const carrinhoDaApi = createServerFn({ method: "GET" }).handler(async () => {
  const id = clienteLogado();
  return itens(await chamarApi<CarrinhoDaApi>(rotaDoCarrinho(id), { sessao: "cliente" }));
});

/** Soma a variante ao carrinho (a API junta na mesma linha e confere o estoque). */
export const adicionarAoCarrinhoNaApi = createServerFn({ method: "POST" })
  .validator((e: unknown) => ({
    variantId: uuid(campos(e)["variantId"]),
    quantidade: quantidade(campos(e)["quantidade"]),
  }))
  .handler(async ({ data }) => {
    const id = clienteLogado();
    return itens(
      await chamarApi<CarrinhoDaApi>(`${rotaDoCarrinho(id)}/items`, {
        method: "POST",
        sessao: "cliente",
        body: data,
      }),
    );
  });

export const mudarQuantidadeNaApi = createServerFn({ method: "POST" })
  .validator((e: unknown) => ({
    itemId: uuid(campos(e)["itemId"]),
    quantidade: quantidade(campos(e)["quantidade"]),
  }))
  .handler(async ({ data }) => {
    const id = clienteLogado();
    return itens(
      await chamarApi<CarrinhoDaApi>(`${rotaDoCarrinho(id)}/items/${data.itemId}`, {
        method: "PATCH",
        sessao: "cliente",
        body: { quantidade: data.quantidade },
      }),
    );
  });

export const removerDoCarrinhoNaApi = createServerFn({ method: "POST" })
  .validator(uuid)
  .handler(async ({ data }) => {
    const id = clienteLogado();
    return itens(
      await chamarApi<CarrinhoDaApi>(`${rotaDoCarrinho(id)}/items/${data}`, {
        method: "DELETE",
        sessao: "cliente",
      }),
    );
  });

export const esvaziarCarrinhoNaApi = createServerFn({ method: "POST" }).handler(async () => {
  const id = clienteLogado();
  await chamarApi<void>(rotaDoCarrinho(id), { method: "DELETE", sessao: "cliente" });
});

/* ------------------------------------------------------------- frete e cupom */

/** PAC e SEDEX para o CEP (público: a página do produto calcula antes do login). */
export const freteDaApi = createServerFn({ method: "GET" })
  .validator((e: unknown) => {
    const cep = String(campos(e)["cep"] ?? "").replace(/\D/g, "");
    const subtotal = Number(campos(e)["subtotal"]);
    if (cep.length !== 8) throw new ErroDaApi(400, "CEP inválido.");
    if (!Number.isFinite(subtotal) || subtotal < 0) throw new ErroDaApi(400, "Subtotal inválido.");
    return { cep, subtotal };
  })
  .handler(async ({ data }): Promise<ShippingOption[]> => {
    const opcoes = await chamarApi<
      { tipo: string; nome: string; preco: number | string; prazoDias: number }[]
    >(`/api/v1/frete?cep=${data.cep}&subtotal=${data.subtotal.toFixed(2)}`);
    return opcoes.map((o) => ({
      label: o.nome,
      days: `até ${o.prazoDias} dias úteis`,
      price: Number(o.preco),
    }));
  });

/** O cliente confere o cupom (erros contam no limite de 5 por 15 minutos da API). */
export const cupomNaApi = createServerFn({ method: "GET" })
  .validator((e: unknown) => {
    if (typeof e !== "string" || !e.trim() || e.length > 30)
      throw new ErroDaApi(400, "Cupom inválido.");
    return e.trim();
  })
  .handler(async ({ data }) => {
    clienteLogado();
    try {
      return cupomDaApi(
        await chamarApi(`/api/v1/coupons/validar?codigo=${encodeURIComponent(data)}`, {
          sessao: "cliente",
        }),
      );
    } catch (erro) {
      // inexistente: a tela mostra "Cupom inválido."; vencido (422) e bloqueio (429) seguem com a mensagem da API
      if (erro instanceof ErroDaApi && erro.status === 404) return null;
      throw erro;
    }
  });

/* -------------------------------------------------------------------- pedido */

/**
 * Fecha o pedido com o carrinho da API: usa o endereço salvo (addressId) ou salva o novo, cria o
 * pedido (com o frete e o cupom) e registra o pagamento pelo total que a API calculou. Com a
 * aprovação simulada da API, o pagamento já nasce aprovado.
 */
export const finalizarPedidoNaApi = createServerFn({ method: "POST" })
  .validator((e: unknown) => {
    const c = campos(e);
    const frete = c["frete"];
    if (frete !== "PAC" && frete !== "SEDEX") throw new ErroDaApi(400, "Escolha o frete.");
    const pagamento = c["pagamento"];
    if (pagamento !== "pix" && pagamento !== "card")
      throw new ErroDaApi(400, "Escolha o pagamento.");
    const cupom = c["cupom"];
    if (cupom !== undefined && (typeof cupom !== "string" || cupom.length > 30))
      throw new ErroDaApi(400, "Cupom inválido.");
    const addressId = c["addressId"];
    const endereco = campos(c["endereco"]);
    const texto = (v: unknown, max: number, obrigatorio = true) => {
      if (typeof v !== "string" || v.length > max || (obrigatorio && !v.trim()))
        throw new ErroDaApi(400, "Confira o endereço.");
      return v;
    };
    return {
      frete,
      pagamento,
      cupom: cupom || undefined,
      addressId: typeof addressId === "string" && UUID.test(addressId) ? addressId : undefined,
      endereco: {
        id: "",
        label: "",
        primary: false,
        name: "",
        email: "",
        cep: texto(endereco["cep"], 9),
        street: texto(endereco["street"], 150),
        number: texto(endereco["number"], 10),
        complement: texto(endereco["complement"] ?? "", 100, false),
        neighborhood: texto(endereco["neighborhood"], 100),
        city: texto(endereco["city"], 100),
        state: texto(endereco["state"], 2),
      },
    };
  })
  .handler(async ({ data }) => {
    const id = clienteLogado();
    // endereço digitado no checkout: vira um endereço salvo da conta (a API pede o id)
    const addressId =
      data.addressId ??
      (
        await chamarApi<EnderecoDaApi>(`/api/v1/customers/${id}/addresses`, {
          method: "POST",
          sessao: "cliente",
          body: enderecoParaApi(data.endereco),
        })
      ).id;
    const pedido = await chamarApi<{ id: string; total: number | string; status: string }>(
      `/api/v1/customers/${id}/orders`,
      {
        method: "POST",
        sessao: "cliente",
        body: { addressId, frete: data.frete, codigoCupom: data.cupom },
      },
    );
    // total zero (cupom cobriu tudo): o pedido já nasce pago, sem pagamento a registrar
    if (pedido.status === "AGUARDANDO_PAGAMENTO") {
      await chamarApi(`/api/v1/orders/${pedido.id}/payment`, {
        method: "POST",
        sessao: "cliente",
        body: {
          metodo: data.pagamento === "pix" ? "PIX" : "CARTAO_CREDITO",
          valor: Number(pedido.total),
        },
      });
    }
    return { orderId: pedido.id, checkoutUrl: "" };
  });
