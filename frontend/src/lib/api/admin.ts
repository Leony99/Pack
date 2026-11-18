// Painel administrativo: listagens, cadastro e exclusão de registros, pedidos e estoque.
import type {
  Collection,
  Coupon,
  CustomerProfile,
  Message,
  Product,
  ReturnRequest,
  StaffMember,
  Subscriber,
} from "@/data";
import { STATUS_DE_PEDIDO } from "@/lib/dominio";
import { canStaff, exigirColaborador } from "./autenticacao";
import { devolverAoEstoque } from "./compra";
import { emailValido, novoId, sessao, state, todosOsPedidos } from "./simulacao";

export type AdminResource =
  | "products"
  | "orders"
  | "coupons"
  | "customers"
  | "staff"
  | "collections"
  | "stock"
  | "messages"
  | "subscribers"
  | "returns";

/** Recursos que têm cadastro e exclusão (pedidos e estoque têm operações próprias). */
type RecursoEditavel = Exclude<AdminResource, "orders" | "stock">;

export type AdminRecord =
  | Product
  | Coupon
  | Collection
  | CustomerProfile
  | StaffMember
  | Message
  | Subscriber
  | ReturnRequest;

/** Dados do painel; cada lista vem vazia se o cargo não tem acesso a ela. */
export async function getAdminData() {
  // PACK API: não tem painel com números; juntar as listagens (pedidos, estoque baixo em
  // GET /api/v1/variants/estoque-baixo...). Cada uma exige a permissão do papel.
  const colaborador = sessao.colaborador;
  if (!colaborador) throw new Error("Entre no painel de demonstração.");
  const pode = (resource: AdminResource) => canStaff(colaborador, resource);
  return {
    staffSession: { ...colaborador },
    products: pode("products") ? state.products.map((p) => ({ ...p, stock: { ...p.stock } })) : [],
    orders: pode("orders") ? todosOsPedidos().map((o) => ({ ...o })) : [],
    coupons: pode("coupons") ? state.coupons.map((c) => ({ ...c })) : [],
    customers: pode("customers") ? state.customers.map((c) => ({ ...c })) : [],
    staff: pode("staff") ? state.staff.map((s) => ({ ...s })) : [],
    collections: pode("collections") ? state.collections.map((c) => ({ ...c })) : [],
    stockMovements: pode("stock") ? [...state.stockMovements] : [],
    messages: pode("messages") ? state.messages.map((m) => ({ ...m })) : [],
    subscribers: pode("subscribers") ? state.subscribers.map((s) => ({ ...s })) : [],
    returns: pode("returns") ? state.returns.map((r) => ({ ...r })) : [],
  };
}

/* ---------------------------------------------------------- validação por recurso */

function validarProduto(p: Product): void {
  const dadosOk =
    p.name.trim() &&
    Number.isFinite(p.price) &&
    p.price >= 0 &&
    p.image &&
    p.styles.length &&
    p.type;
  if (!dadosOk) throw new Error("Produto inválido.");
  if (Object.values(p.stock ?? {}).some((v) => !Number.isInteger(v) || v < 0))
    throw new Error("Estoque inválido.");
  if (!p.id) p.id = novoId();
  p.images = p.images.length ? p.images : [p.image];
}

function validarCupom(c: Coupon): void {
  c.code = c.code.trim().toUpperCase();
  const descontoOk =
    c.code &&
    Number.isFinite(c.discount) &&
    c.discount > 0 &&
    !(c.type === "percent" && c.discount > 100);
  if (!descontoOk) throw new Error("Desconto inválido.");
}

function validarColaborador(m: StaffMember): void {
  if (m.id === sessao.colaborador?.id && (!m.active || m.role !== "admin"))
    throw new Error("Não remova seu próprio acesso administrativo.");
  if (state.staff.some((s) => s.id !== m.id && s.email.toLowerCase() === m.email.toLowerCase()))
    throw new Error("E-mail de colaborador já cadastrado.");
  if (!m.name.trim() || !emailValido(m.email))
    throw new Error("Nome e e-mail válidos são obrigatórios.");
}

function validarColecao(c: Collection): void {
  if (!/^[a-z0-9-]+$/.test(c.tag) || !c.name.trim())
    throw new Error("Use uma tag sem espaços e um nome válido.");
  if (state.collections.some((x) => x.tag === c.tag && x.id !== c.id))
    throw new Error("Tag de coleção já existente.");
}

/** Cupons são identificados pelo código; os outros registros, pelo id. */
function chaveDe(record: AdminRecord): string {
  return "code" in record ? record.code : record.id;
}

/** Cria ou edita um registro do painel. */
export async function saveAdminRecord(resource: RecursoEditavel, record: AdminRecord) {
  // PACK API: cada recurso tem a própria rota (products, variants, images, tags, coupons, staff,
  // roles...). Coleções, mensagens, newsletter e trocas: faltam na API.
  exigirColaborador(resource);
  if (resource === "products") validarProduto(record as Product);
  if (resource === "coupons") validarCupom(record as Coupon);
  if (resource === "staff") validarColaborador(record as StaffMember);
  if (resource === "collections") validarColecao(record as Collection);
  if ("id" in record && !record.id) record.id = novoId();

  const rows = state[resource] as AdminRecord[];
  const existente = rows.findIndex((r) => chaveDe(r) === chaveDe(record));
  if (existente >= 0) rows[existente] = { ...record };
  else rows.push({ ...record });
}

/**
 * Apaga um registro; apagar uma coleção tira a tag dela dos produtos. Um produto que já esteve em um
 * pedido não pode ser apagado (como na API): o caminho é desativá-lo.
 */
export async function deleteAdminRecord(resource: RecursoEditavel, recordId: string) {
  // PACK API: DELETE na rota de cada recurso (ex.: /api/v1/products/{id}).
  exigirColaborador(resource);
  if (resource === "staff" && recordId === sessao.colaborador?.id)
    throw new Error("Não exclua seu próprio acesso.");
  const rows = state[resource] as AdminRecord[];
  const index = rows.findIndex((r) => chaveDe(r) === recordId);
  if (index < 0) throw new Error("Registro indisponível.");
  if (resource === "collections") {
    const { tag } = rows[index] as Collection;
    state.products.forEach((p) => {
      p.tags = p.tags?.filter((t) => t !== tag);
    });
  }
  if (
    resource === "products" &&
    todosOsPedidos().some((o) => o.items.some((i) => i.id === recordId))
  )
    throw new Error(
      "Este produto já esteve em um pedido e não pode ser apagado. Desative-o para tirá-lo da loja.",
    );
  rows.splice(index, 1);
}

/** Muda o status e o rastreio do pedido; cancelado não reabre, e cancelar devolve o estoque. */
export async function updateOrder(orderId: string, status: string, tracking: string) {
  // PACK API: PATCH /api/v1/orders/{id}/status (só cancelar); o resto vem do pagamento e do envio
  // (PATCH /api/v1/payments/{id}/status, PATCH /api/v1/shipments/{id}/status e .../rastreio).
  exigirColaborador("orders");
  const order = todosOsPedidos().find((o) => o.id === orderId);
  if (!order) throw new Error("Pedido indisponível.");
  if (!(STATUS_DE_PEDIDO as readonly string[]).includes(status))
    throw new Error("Status inválido.");
  if (order.status === "Cancelado" && status !== "Cancelado")
    throw new Error("Pedido cancelado não pode ser reaberto.");
  if (status === "Cancelado" && order.status !== "Cancelado") devolverAoEstoque(order);
  order.status = status;
  order.tracking = tracking;
}

/** Ajusta o estoque de um tamanho; ele nunca fica negativo. */
export async function adjustStock(productId: string, size: string, delta: number, reason: string) {
  // PACK API: POST /api/v1/inventory/movements { variantId, tipoMovimentacao, quantidade, motivo }
  // (por variante, não por produto + tamanho).
  exigirColaborador("stock");
  const product = state.products.find((p) => p.id === productId);
  const valido =
    product?.stock &&
    size in product.stock &&
    Number.isInteger(delta) &&
    delta !== 0 &&
    reason.trim() &&
    (product.stock[size] ?? 0) + delta >= 0;
  if (!valido || !product?.stock) throw new Error("Movimentação inválida ou estoque insuficiente.");
  product.stock[size] = (product.stock[size] ?? 0) + delta;
  state.stockMovements.push({
    id: novoId(),
    productId,
    size,
    delta,
    reason,
    date: new Date().toISOString(),
  });
}
