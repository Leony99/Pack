import { products } from "./products";
import type { Order } from "./types";
export const paymentMethods = [
  { id: "pix", label: "Pix", detail: "Pagamento instantâneo" },
  { id: "card", label: "Cartão de crédito", detail: "Pagamento por checkout seguro" },
] as const;
// Exemplo para abrir /pedido/PACK-DEMO diretamente. Nenhum pagamento é realizado.
export const demoOrders: Order[] = [
  {
    id: "PACK-DEMO",
    customer: { name: "Cliente PACK", email: "cliente@example.com" },
    items: [{ ...products[0], size: "M", qty: 1 }],
    address: {
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
    shipping: { label: "PAC", days: "5–8 dias úteis", price: 24.9 },
    payment: "pix",
    subtotal: 189,
    discount: 0,
    total: 213.9,
    status: "Pedido simulado",
  },
];
