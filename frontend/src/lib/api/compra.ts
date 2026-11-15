// Compra: cupom, frete, carrinho, criação do pedido e confirmação.
// A API real precisa recalcular tudo (preço, estoque, cupom e frete): nada que vem do navegador é confiável.
import {
  freeShippingFrom,
  paidOnlyOptions,
  paymentMethods,
  shippingOptions,
  type CheckoutAddress,
  type Coupon,
  type Order,
  type ShippingOption,
} from "@/data";
import { calculateTotals } from "@/lib/checkout";
import { pedidosDaSessao, sessao, simularLatencia, state } from "./simulacao";

/** Confere um cupom: vale até o fim do dia da validade. */
export async function validateCoupon(code: string): Promise<Coupon | null> {
  // PACK API: não há validação pública de cupom. O código vai no checkout (codigoCupom do
  // POST /api/v1/customers/{id}/orders), que recusa cupom inválido ou vencido. Falta na API: conferir antes.
  const codigo = code.trim().toUpperCase();
  const vigente = (c: Coupon) =>
    !c.validUntil || new Date(`${c.validUntil.slice(0, 10)}T23:59:59Z`).getTime() >= Date.now();
  return state.coupons.find((c) => c.code === codigo && vigente(c)) ?? null;
}

/** Opções de frete para o CEP; acima do valor de frete grátis, só as opções pagas cobram. */
export async function quoteShipping(cep: string, subtotal: number): Promise<ShippingOption[]> {
  // PACK API: não calcula frete (falta na API). O envio só existe depois do pedido pago:
  // POST /api/v1/orders/{id}/shipment, feito pela equipe.
  if (!/^\d{8}$/.test(cep)) throw new Error("CEP inválido");
  await simularLatencia(400);
  const gratis = subtotal >= freeShippingFrom;
  return shippingOptions.map((o) =>
    gratis && !paidOnlyOptions.includes(o.label) ? { ...o, price: 0 } : o,
  );
}

/* ------------------------------------------------------------------ carrinho */

export type CartLine = { productId: string; size: string; qty: number };

/** Carrinho guardado do cliente logado (na simulação, ele vive só na tela). */
export async function getCart(): Promise<CartLine[]> {
  // PACK API: GET /api/v1/customers/{id}/cart (cliente logado; id vem do /auth/me).
  return [];
}

/** Sincroniza o carrinho da tela com o servidor. */
export async function syncCart(_lines: CartLine[]): Promise<void> {
  // PACK API: não recebe o carrinho inteiro. Cada mudança é uma chamada: POST .../cart/items
  // { variantId, quantidade } e DELETE .../cart/items/{itemId}. Precisa da variante (tamanho + cor).
}

/* -------------------------------------------------------------------- pedido */

export type OrderPayload = {
  items: CartLine[];
  couponCode?: string;
  shipping: string;
  address: CheckoutAddress;
  payment: "pix" | "card";
};

/** Cria o pedido e devolve a URL do pagamento (vazia na simulação). */
export async function createOrder(
  payload: OrderPayload,
): Promise<{ orderId: string; checkoutUrl: string }> {
  // PACK API: POST /api/v1/customers/{id}/orders { addressId, codigoCupom }. O pedido sai do carrinho
  // guardado na API (não dos itens enviados) e nasce AGUARDANDO_PAGAMENTO; o pagamento é outra
  // chamada (POST /api/v1/orders/{id}/payment { metodo, valor }). Pagamento real: falta na API.
  if (!payload.items.length) throw new Error("Seu carrinho está vazio.");

  const items = payload.items.map((line) => {
    const product = state.products.find((p) => p.id === line.productId && p.active !== false);
    if (!product || !Number.isInteger(line.qty) || line.qty < 1)
      throw new Error("Item inválido no pedido.");
    return { ...product, size: line.size, qty: line.qty };
  });

  // soma as linhas do mesmo produto e tamanho antes de conferir o estoque
  const pedidoPorTamanho = new Map<string, number>();
  for (const item of items) {
    const chave = `${item.id}:${item.size}`;
    const total = (pedidoPorTamanho.get(chave) ?? 0) + item.qty;
    pedidoPorTamanho.set(chave, total);
    if ((item.stock?.[item.size] ?? 0) < total)
      throw new Error(`Estoque insuficiente: ${item.name} (${item.size}).`);
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = (await quoteShipping(payload.address.cep, subtotal)).find(
    (option) => option.label === payload.shipping,
  );
  if (!shipping) throw new Error("Selecione uma opção de entrega.");
  const coupon = payload.couponCode ? await validateCoupon(payload.couponCode) : null;
  if (payload.couponCode && !coupon) throw new Error("Cupom inválido.");

  const totals = calculateTotals(subtotal, coupon, shipping.price);
  const orderId = `PACK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  pedidosDaSessao.set(orderId, {
    id: orderId,
    customer: { name: payload.address.name, email: payload.address.email },
    items,
    address: payload.address,
    shipping,
    payment: payload.payment,
    subtotal: totals.subtotal,
    discount: totals.discount,
    total: totals.total,
    status: "Pedido simulado",
    customerId: sessao.cliente?.id,
    createdAt: new Date().toISOString(),
    tracking: "",
  });

  for (const item of items) {
    const product = state.products.find((p) => p.id === item.id);
    if (product?.stock) product.stock[item.size] = (product.stock[item.size] ?? 0) - item.qty;
  }
  return { orderId, checkoutUrl: "" };
}

/** Um pedido (a confirmação depois do checkout). */
export async function getOrder(id: string): Promise<Order | null> {
  // PACK API: GET /api/v1/orders/{id} (dono do pedido ou equipe).
  return pedidosDaSessao.get(id) ?? state.orders.find((order) => order.id === id) ?? null;
}

/** Formas de pagamento do checkout. */
export async function getPaymentMethods() {
  // PACK API: os métodos são o enum PaymentMetodo; não há rota que os liste (fica no frontend).
  return paymentMethods;
}

/** Devolve ao estoque os itens de um pedido criado nesta visita (cancelamento). */
export function devolverAoEstoque(order: Order): void {
  if (!pedidosDaSessao.has(order.id)) return;
  for (const item of order.items) {
    const product = state.products.find((p) => p.id === item.id);
    if (product?.stock) product.stock[item.size] = (product.stock[item.size] ?? 0) + item.qty;
  }
}
