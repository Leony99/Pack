import type { CheckoutAddress, Product } from "./types";

export type CustomerProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  newsletter: boolean;
};
export type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "operacao" | "atendimento";
  active: boolean;
};
export type SavedAddress = CheckoutAddress & { id: string; label: string; primary: boolean };
export type Collection = { id: string; name: string; tag: string; description: string };
export type StockMovement = {
  id: string;
  productId: string;
  size: string;
  delta: number;
  reason: string;
  date: string;
};
export type Message = { id: string; name: string; email: string; message: string; status: string };
export type Subscriber = { id: string; email: string; active: boolean };
export type ReturnRequest = { id: string; orderId: string; reason: string; status: string };

export const customers: CustomerProfile[] = [
  {
    id: "customer-demo",
    name: "Cliente PACK",
    email: "cliente@example.com",
    phone: "",
    newsletter: false,
  },
  {
    id: "customer-2",
    name: "Marina Silva",
    email: "marina@example.com",
    phone: "",
    newsletter: true,
  },
];
export const staffMembers: StaffMember[] = [
  {
    id: "staff-demo",
    name: "Administrador PACK",
    email: "admin@example.com",
    role: "admin",
    active: true,
  },
  {
    id: "staff-2",
    name: "Equipe de operação",
    email: "operacao@example.com",
    role: "operacao",
    active: true,
  },
];
export const collections: Collection[] = [
  {
    id: "drop-02",
    name: "DROP 02",
    tag: "drop-02",
    description: "Treino e rua. O segundo capítulo de PACK.",
  },
  {
    id: "essentials",
    name: "ESSENTIALS",
    tag: "essentials",
    description: "Peças essenciais em preto e branco.",
  },
];
export const addresses: SavedAddress[] = [
  {
    id: "address-demo",
    label: "Casa",
    primary: true,
    name: "Cliente PACK",
    email: "cliente@example.com",
    cep: "01001000",
    street: "Praça da Sé",
    number: "100",
    complement: "",
    neighborhood: "Sé",
    city: "São Paulo",
    state: "SP",
  },
];
export const messages: Message[] = [
  {
    id: "message-demo",
    name: "Marina Silva",
    email: "marina@example.com",
    message: "Gostaria de saber quando haverá reposição do tamanho P.",
    status: "Aberto",
  },
];
export const subscribers: Subscriber[] = [
  { id: "subscriber-demo", email: "marina@example.com", active: true },
];
export const returns: ReturnRequest[] = [];
export const stockMovements: StockMovement[] = [];
/** Completa os produtos de exemplo com tags, estoque por tamanho e "ativo" quando não vierem. */
export const decorateProduct = (product: Product): Product => ({
  ...product,
  tags: product.tags ?? [
    product.section === "novo-drop" ? "drop-02" : "essentials",
    ...product.styles,
    product.type,
  ],
  stock: product.stock ?? { PP: 0, P: 5, M: 12, G: 8, GG: 3 },
  active: product.active ?? true,
});
