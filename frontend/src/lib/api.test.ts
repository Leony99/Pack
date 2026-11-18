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
  test("catálogo vem em páginas, com o total e se há mais", async () => {
    const todos = await api.getProducts();
    const primeira = await api.getPaginaDoCatalogo({}, 0, 1);
    expect(primeira.total).toBe(todos.length);
    expect(primeira.produtos.map((p) => p.id)).toEqual([todos[0]!.id]);
    expect(primeira.temMais).toBe(todos.length > 1);
    const ultima = await api.getPaginaDoCatalogo({}, todos.length - 1, 1);
    expect(ultima.temMais).toBe(false);
  });
  test("operação não recebe acesso administrativo a colaboradores e cupons", () => {
    expect(api.canStaff({ role: "operacao" }, "stock")).toBe(true);
    expect(api.canStaff({ role: "operacao" }, "staff")).toBe(false);
    expect(api.canStaff({ role: "operacao" }, "coupons")).toBe(false);
    expect(api.canStaff({ role: "atendimento" }, "products")).toBe(false);
  });
  test("com a API, o painel segue as permissões do papel, não o nome", () => {
    const estoquista = { role: "estoquista", permissoes: ["CATALOG_WRITE", "INVENTORY_MANAGE"] };
    expect(api.canStaff(estoquista, "products")).toBe(true);
    expect(api.canStaff(estoquista, "stock")).toBe(true);
    expect(api.canStaff(estoquista, "orders")).toBe(false);
    // um papel chamado "admin" sem permissões não vê nada
    expect(api.canStaff({ role: "admin", permissoes: [] }, "orders")).toBe(false);
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
      phone: "21999990000",
      password: "demo1234",
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

describe("aba Tags (demonstração)", () => {
  test("cada tag dos produtos aparece com o filtro que teria na API", async () => {
    await api.enterDemo("staff");
    const tags = await api.getTags();
    expect(tags.find((t) => t.tag === "drop-02")).toMatchObject({ filtro: "COLECAO" });
  });

  test("a tag nova vira a opção do filtro; em uso, o filtro não muda", async () => {
    await api.enterDemo("staff");
    const salva = await api.saveTag({ tag: "Moletons", filtro: "CATEGORIA" });
    expect(salva).toMatchObject({ tag: "moletons", filtro: "CATEGORIA" });
    const drop = (await api.getTags()).find((t) => t.tag === "drop-02")!;
    await expect(api.saveTag({ ...drop, filtro: null })).rejects.toThrow(/só muda/);
  });

  test("tag de estilo em uso não pode ser apagada; sem produtos, pode", async () => {
    await api.enterDemo("staff");
    const emUso = await api.saveTag({ tag: "treino-x", filtro: "ESTILO" });
    const livre = await api.saveTag({ tag: "treino-y", filtro: "ESTILO" });
    // getProduct da demonstração devolve a peça da simulação: ligar a tag nela é ligar no produto
    (await api.getProduct("p1"))!.tags?.push("treino-x");
    await expect(api.deleteTag(emUso.id)).rejects.toThrow(/troque a tag/);
    await api.deleteTag(livre.id);
    expect((await api.getTags()).map((t) => t.tag)).not.toContain("treino-y");
  });

  test("renomear a tag renomeia nos produtos; apagar tira dos produtos", async () => {
    await api.enterDemo("staff");
    const drop = (await api.getTags()).find((t) => t.tag === "drop-02")!;
    await api.saveTag({ ...drop, tag: "drop-natal" });
    expect((await api.getProduct("p1"))?.tags).toContain("drop-natal");
    await api.deleteTag(drop.id);
    expect((await api.getProduct("p1"))?.tags).not.toContain("drop-natal");
  });

  test("a loja tem os estilos fixos e as categorias iniciais; os fixos não mudam nem saem", async () => {
    await api.enterDemo("staff");
    const tags = await api.getTags();
    const casual = tags.find((t) => t.tag === "casual")!;
    expect(casual).toMatchObject({ filtro: "ESTILO", fixa: true });
    for (const categoria of ["camisa", "bermuda", "conjunto"])
      expect(tags.find((t) => t.tag === categoria)).toMatchObject({
        filtro: "CATEGORIA",
        fixa: false,
      });
    await expect(api.deleteTag(casual.id)).rejects.toThrow(/fixo/);
    await expect(api.saveTag({ ...casual, tag: "casual-2" })).rejects.toThrow(/fixo/);
  });

  test("conta quantos produtos usam cada tag", () => {
    const contagem = api.contarProdutosPorTag([{ tags: ["a", "b"] }, { tags: ["a"] }, {}]);
    expect(contagem.get("a")).toBe(2);
    expect(contagem.get("b")).toBe(1);
  });
});

// Fica por último: desativa o produto p1, que os testes de cima usam
describe("produto desativado e exclusão (demonstração)", () => {
  test("produto que esteve em pedido não é apagado; desativado sai da loja", async () => {
    await api.enterDemo("customer");
    const { orderId } = await api.createOrder({
      items: [{ productId: "p1", size: "M", qty: 1 }],
      address,
      shipping: "PAC",
      payment: "pix",
    });
    await api.enterDemo("staff");
    await api.updateOrder(orderId, "Cancelado", "");
    // nem cancelado: o caminho é desativar
    await expect(api.deleteAdminRecord("products", "p1")).rejects.toThrow(/Desative/);

    const p1 = (await api.getAdminData()).products.find((p) => p.id === "p1")!;
    await api.saveAdminRecord("products", { ...p1, active: false });
    expect((await api.getProducts()).map((p) => p.id)).not.toContain("p1");
    // a página do produto ainda abre, como indisponível
    expect((await api.getProduct("p1"))?.active).toBe(false);
  });
});
