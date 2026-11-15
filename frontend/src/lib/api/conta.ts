// Área do cliente: dados, endereços, pedidos, trocas e cancelamento.
import type { CustomerProfile, Order, SavedAddress } from "@/data";
import { CANCELAVEL } from "@/lib/dominio";
import { exigirCliente } from "./autenticacao";
import { devolverAoEstoque } from "./compra";
import { emailValido, novoId, sessao, state, todosOsPedidos } from "./simulacao";

/** Resumo da área do cliente. */
export async function getAccountData() {
  // PACK API: não tem painel do cliente; juntar GET /api/v1/auth/me, .../addresses e .../orders.
  const customer = exigirCliente();
  const doCliente = (orderId: string) =>
    todosOsPedidos().some((o) => o.id === orderId && o.customerId === customer.id);
  return {
    customer: { ...customer },
    orders: await getMyOrders(),
    addresses: await getAddresses(),
    returns: state.returns.filter((r) => doCliente(r.orderId)).map((r) => ({ ...r })),
  };
}

/** Atualiza os dados do cliente; também liga ou desliga a newsletter do e-mail. */
export async function updateProfile(
  patch: Pick<CustomerProfile, "name" | "email" | "phone" | "newsletter">,
) {
  // PACK API: PUT /api/v1/customers/{id} { nome, email, telefone }.
  const atual = exigirCliente();
  if (!patch.name.trim() || !emailValido(patch.email))
    throw new Error("Nome e e-mail válido são obrigatórios.");
  const emailEmUso = state.customers.some(
    (c) => c.id !== atual.id && c.email.toLowerCase() === patch.email.toLowerCase(),
  );
  if (emailEmUso) throw new Error("E-mail já cadastrado.");
  const row = state.customers.find((c) => c.id === atual.id);
  if (!row) throw new Error("Cliente indisponível.");
  Object.assign(row, patch);

  const inscrito = state.subscribers.find((s) => s.email === patch.email);
  if (inscrito) inscrito.active = patch.newsletter;
  else if (patch.newsletter)
    state.subscribers.push({ id: novoId(), email: patch.email, active: true });

  sessao.cliente = { ...row };
  return { ...row };
}

/* ----------------------------------------------------------------- endereços */

/** Endereços do cliente logado. */
export async function getAddresses(): Promise<SavedAddress[]> {
  // PACK API: GET /api/v1/customers/{id}/addresses.
  const cliente = exigirCliente();
  return state.addresses.filter((a) => a.customerId === cliente.id).map((a) => ({ ...a }));
}

function enderecoCompleto(a: SavedAddress): boolean {
  return (
    /^\d{8}$/.test(a.cep) &&
    /^[A-Z]{2}$/.test(a.state) &&
    [a.street, a.number, a.city, a.neighborhood].every((campo) => campo.trim())
  );
}

/** Cria ou edita um endereço; só um é o principal. */
export async function saveAddress(address: SavedAddress) {
  // PACK API: POST /api/v1/customers/{id}/addresses (novo) ou PUT .../addresses/{addressId}
  // { cep, rua, numero, complemento, cidade, estado }.
  const cliente = exigirCliente();
  if (!enderecoCompleto(address)) throw new Error("Preencha endereço, CEP e UF válidos.");
  const existente = state.addresses.find((a) => a.id === address.id);
  if (existente && existente.customerId !== cliente.id) throw new Error("Endereço indisponível.");

  const primeiro = !state.addresses.some((a) => a.customerId === cliente.id);
  const row = {
    ...address,
    id: address.id || novoId(),
    customerId: cliente.id,
    primary: address.primary || primeiro,
  };
  if (row.primary)
    state.addresses.forEach((a) => {
      if (a.customerId === cliente.id) a.primary = false;
    });
  if (existente) Object.assign(existente, row);
  else state.addresses.push(row);
  return { ...row };
}

/** Apaga um endereço; se for o principal, o próximo vira principal. */
export async function deleteAddress(addressId: string) {
  // PACK API: DELETE /api/v1/customers/{id}/addresses/{addressId}.
  const cliente = exigirCliente();
  const index = state.addresses.findIndex((a) => a.id === addressId && a.customerId === cliente.id);
  if (index < 0) throw new Error("Endereço indisponível.");
  state.addresses.splice(index, 1);
  const restantes = state.addresses.filter((a) => a.customerId === cliente.id);
  if (!restantes.some((a) => a.primary) && restantes[0]) restantes[0].primary = true;
}

/* ------------------------------------------------------------------- pedidos */

/** Pedidos do cliente logado. */
export async function getMyOrders(): Promise<Order[]> {
  // PACK API: GET /api/v1/customers/{id}/orders (paginado: { itens, totalItens... }).
  const cliente = exigirCliente();
  return todosOsPedidos()
    .filter((o) => o.customerId === cliente.id)
    .map((o) => ({ ...o }));
}

/** Um pedido do cliente logado. */
export async function getMyOrder(orderId: string): Promise<Order | null> {
  // PACK API: GET /api/v1/orders/{id} (a API confere se o pedido é do cliente).
  const cliente = exigirCliente();
  return todosOsPedidos().find((o) => o.id === orderId && o.customerId === cliente.id) ?? null;
}

/** Pede a troca de um pedido (uma solicitação por pedido). */
export async function requestReturn(orderId: string, reason: string) {
  // PACK API: não tem trocas (falta na API).
  if (!(await getMyOrder(orderId)) || !reason.trim()) throw new Error("Pedido ou motivo inválido.");
  if (state.returns.some((r) => r.orderId === orderId))
    throw new Error("Já existe uma solicitação para este pedido.");
  state.returns.push({ id: novoId(), orderId, reason, status: "Solicitada" });
}

/** Cancela um pedido do cliente: só antes do envio, e o estoque volta. */
export async function cancelMyOrder(orderId: string) {
  // PACK API: PATCH /api/v1/orders/{id}/status { status: "CANCELADO" } (antes do envio).
  const order = await getMyOrder(orderId);
  if (!order || !CANCELAVEL.includes(order.status))
    throw new Error("Este pedido não pode ser cancelado.");
  order.status = "Cancelado";
  devolverAoEstoque(order);
}
