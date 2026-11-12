// Testes da simulação da camada de API, com dados de teste no lugar de src/data.
import { describe, expect, test, vi } from "vitest";

// vi.hoisted: os dados precisam existir antes do vi.mock, que o Vitest move para o topo do arquivo
const dados = vi.hoisted(() => {
  const product = {
    id: "p1",
    name: "Training Tee",
    price: 189,
    image: "/tee.jpg",
    images: ["/tee.jpg"],
    color: "BLACK",
    styles: ["treino"],
    type: "camisetas",
    section: "novo-drop",
    tags: ["drop-02"],
    stock: { P: 1, M: 5, G: 0 },
    active: true,
  };
  const customer = {
    id: "c1",
    name: "Cliente PACK",
    email: "cliente@example.com",
    phone: "",
    newsletter: false,
  };
  const staff = {
    id: "s1",
    name: "Admin",
    email: "admin@example.com",
    role: "admin",
    active: true,
  };
  const address = {
    name: "Cliente PACK",
    email: "cliente@example.com",
    cep: "01001000",
    street: "Rua Teste",
    number: "1",
    complement: "",
    neighborhood: "Centro",
    city: "São Paulo",
    state: "SP",
  };
  return { product, customer, staff, address };
});
const { address } = dados;

vi.mock("@/data", () => ({
  products: [dados.product],
  coupons: [{ code: "PACK10", discount: 10, type: "percent", validUntil: null }],
  shippingOptions: [{ label: "PAC", days: "5 dias", price: 24.9 }],
  paidOnlyOptions: [],
  freeShippingFrom: 350,
  sizeChart: [],
  demoOrders: [],
  paymentMethods: [],
  faq: [],
  terms: [],
  customers: [dados.customer],
  staffMembers: [dados.staff],
  collections: [{ id: "drop-02", name: "DROP 02", tag: "drop-02", description: "" }],
  addresses: [],
  messages: [],
  subscribers: [],
  returns: [],
  stockMovements: [],
  decorateProduct: (p: unknown) => p,
}));

import * as api from "@/lib/api";

describe("coleções e operações simuladas", () => {
  test("coleção filtra pela tag do produto", async () => {
    expect((await api.getProducts({ collection: "drop-02" })).map((p) => p.id)).toEqual(["p1"]);
    expect(await api.getProducts({ collection: "outra" })).toEqual([]);
  });
  test("operação não recebe acesso administrativo a colaboradores e cupons", () => {
    expect(api.canStaff("operacao", "stock")).toBe(true);
    expect(api.canStaff("operacao", "staff")).toBe(false);
    expect(api.canStaff("operacao", "coupons")).toBe(false);
    expect(api.canStaff("atendimento", "products")).toBe(false);
  });
  test("endereços mantêm apenas um principal por cliente", async () => {
    await api.enterDemo("customer");
    await api.saveAddress({ ...address, id: "a", label: "Casa", primary: true });
    await api.saveAddress({ ...address, id: "b", label: "Trabalho", primary: true });
    expect((await api.getAddresses()).filter((a) => a.primary).map((a) => a.id)).toEqual(["b"]);
  });
  test("nova conta não lê pedidos nem endereços de outro cliente", async () => {
    await api.registerCustomer({
      name: "Outro cliente",
      email: "outro@example.com",
      password: "demo123",
    });
    expect(await api.getAddresses()).toEqual([]);
    expect(await api.getMyOrders()).toEqual([]);
  });
  test("checkout rejeita tamanho esgotado e quantidade acima do estoque", async () => {
    const payload = {
      items: [{ productId: "p1", size: "G", qty: 1 }],
      address,
      shipping: "PAC",
      payment: "pix" as const,
    };
    await expect(api.createOrder(payload)).rejects.toThrow("Estoque insuficiente");
    await expect(
      api.createOrder({ ...payload, items: [{ productId: "p1", size: "M", qty: 6 }] }),
    ).rejects.toThrow("Estoque insuficiente");
  });
  test("pedido usa desconto e frete, baixa estoque e pertence ao cliente", async () => {
    await api.enterDemo("customer");
    const { orderId } = await api.createOrder({
      items: [{ productId: "p1", size: "M", qty: 1 }],
      address,
      shipping: "PAC",
      payment: "pix",
      couponCode: "PACK10",
    });
    const order = await api.getMyOrder(orderId);
    expect(order?.total).toBe(195);
    expect((await api.getProduct("p1"))?.stock?.M).toBe(4);
    await api.cancelMyOrder(orderId);
    expect((await api.getProduct("p1"))?.stock?.M).toBe(5);
    await expect(api.cancelMyOrder(orderId)).rejects.toThrow();
  });
  test("administrador não pode criar estoque negativo nem remover o próprio acesso", async () => {
    await api.enterDemo("staff");
    await expect(api.adjustStock("p1", "P", -2, "Saída")).rejects.toThrow();
    await expect(api.deleteAdminRecord("staff", "s1")).rejects.toThrow();
  });
  test("cupom de coleção editado na administração é validado pela loja", async () => {
    await api.saveAdminRecord("coupons", {
      code: "COLLECTION20",
      type: "percent",
      discount: 20,
      validUntil: null,
    });
    expect((await api.validateCoupon(" collection20 "))?.discount).toBe(20);
    await api.saveAdminRecord("coupons", {
      code: "EXPIRED",
      type: "fixed",
      discount: 10,
      validUntil: "2000-01-01",
    });
    expect(await api.validateCoupon("EXPIRED")).toBeNull();
  });
});
