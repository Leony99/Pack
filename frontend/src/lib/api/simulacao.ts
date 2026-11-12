// Estado da simulação: os dados de demonstração e as sessões, só na memória deste módulo.
// Recomeça a cada recarga da página. Nada aqui é autenticação nem segurança: quem protege os dados
// de verdade é a API, que confere o token e o dono de cada recurso em toda requisição.
import {
  addresses,
  collections,
  coupons,
  customers,
  decorateProduct,
  demoOrders,
  messages,
  products,
  returns,
  staffMembers,
  stockMovements,
  subscribers,
  type CustomerProfile,
  type Order,
  type StaffMember,
} from "@/data";

/** Cópias editáveis dos dados de demonstração (as telas de admin alteram estas listas). */
export const state = {
  products: products.map(decorateProduct),
  coupons: coupons.map((c) => ({ ...c })),
  customers: customers.map((c) => ({ ...c })),
  staff: staffMembers.map((s) => ({ ...s })),
  collections: collections.map((c) => ({ ...c })),
  addresses: addresses.map((a) => ({ ...a, customerId: "customer-demo" })),
  orders: demoOrders.map((o) => ({
    ...o,
    customerId: "customer-demo",
    createdAt: "2026-10-20",
    tracking: "",
  })),
  messages: messages.map((m) => ({ ...m })),
  subscribers: subscribers.map((s) => ({ ...s })),
  returns: [...returns],
  stockMovements: [...stockMovements],
};

/** Quem está logado na demonstração (cliente e colaborador são sessões separadas). */
export const sessao: { cliente: CustomerProfile | null; colaborador: StaffMember | null } = {
  cliente: null,
  colaborador: null,
};

/** Pedidos criados no checkout desta visita: não são gravados em lugar nenhum. */
export const pedidosDaSessao = new Map<string, Order>();

export function novoId(): string {
  return crypto.randomUUID();
}

export function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Pedidos de demonstração + os criados nesta visita. */
export function todosOsPedidos(): Order[] {
  return [...state.orders, ...pedidosDaSessao.values()];
}

/** Espera um pouco, para a tela mostrar o "carregando" como faria com a rede. */
export function simularLatencia(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
