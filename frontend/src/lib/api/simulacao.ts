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
  type Product,
  type StaffMember,
} from "@/data";
import { CATEGORIAS_INICIAIS, DROP, ESTILOS_FIXOS, type FiltroDaTag } from "./tags";

/**
 * As tags da demonstração: as que a loja cria sozinha (estilos fixos e categorias iniciais, como a
 * API) e as que os produtos de exemplo usam, com o filtro que cada uma teria na API.
 */
function tagsDosProdutos(produtos: Product[]) {
  const colecoes = collections.map((c) => c.tag);
  const nomes = [
    ...ESTILOS_FIXOS,
    ...CATEGORIAS_INICIAIS,
    ...produtos.flatMap((p) => p.tags ?? []),
  ];
  return [...new Set(nomes)].sort().map((tag) => {
    const filtro: FiltroDaTag | null = ESTILOS_FIXOS.includes(tag)
      ? "ESTILO"
      : CATEGORIAS_INICIAIS.includes(tag)
        ? "CATEGORIA"
        : DROP.test(tag) || colecoes.includes(tag)
          ? "COLECAO"
          : null;
    return { id: `tag-${tag}`, tag, filtro, fixa: ESTILOS_FIXOS.includes(tag) };
  });
}

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
  tags: tagsDosProdutos(products.map(decorateProduct)),
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
