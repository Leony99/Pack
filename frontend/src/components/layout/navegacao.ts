// Menus laterais da área do cliente e do painel administrativo.
// No admin, "resource" é o recurso que o cargo precisa poder ver para o item aparecer (ver canStaff).

export const accountNav = [
  { to: "/conta", label: "Visão geral" },
  { to: "/conta/pedidos", label: "Meus pedidos" },
  { to: "/conta/enderecos", label: "Endereços" },
  { to: "/conta/dados", label: "Dados pessoais" },
] as const;

export const adminNav = [
  { to: "/admin/painel", label: "Visão geral", resource: "orders" },
  { to: "/admin/produtos", label: "Produtos", resource: "products" },
  { to: "/admin/colecoes", label: "Coleções e tags", resource: "collections" },
  { to: "/admin/estoque", label: "Estoque", resource: "stock" },
  { to: "/admin/pedidos", label: "Pedidos", resource: "orders" },
  { to: "/admin/cupons", label: "Cupons", resource: "coupons" },
  { to: "/admin/clientes", label: "Clientes", resource: "customers" },
  { to: "/admin/colaboradores", label: "Colaboradores", resource: "staff" },
  { to: "/admin/mensagens", label: "Atendimento", resource: "messages" },
  { to: "/admin/newsletter", label: "Newsletter", resource: "subscribers" },
  { to: "/admin/trocas", label: "Trocas", resource: "returns" },
] as const;

/** Estilos do menu principal da loja: cada um abre as categorias. */
export const MENU_ESTILOS = [
  { style: "casual", label: "CASUAL" },
  { style: "treino", label: "TREINO" },
] as const;

/** Categorias de cada estilo no menu (levam a /catalogo/estilo/categoria). */
export const MENU_CATEGORIAS = [
  { type: "camisetas", label: "Camisetas" },
  { type: "bermudas", label: "Bermudas" },
  { type: "conjuntos", label: "Conjuntos" },
] as const;

export const MENU_SUPORTE = [
  { to: "/suporte/contato", label: "Contato" },
  { to: "/suporte/tamanhos", label: "Tamanhos" },
  { to: "/suporte/faq", label: "FAQ" },
] as const;
