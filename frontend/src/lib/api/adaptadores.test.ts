// Tradução da Pack API para as telas: tags nos filtros, produto → Product e erros da API.
import { describe, expect, it } from "vitest";
import { IMAGEM_SEM_FOTO, produtoDaApi, type ProdutoDaApi } from "./adaptadores";
import { filtrarProdutos } from "./catalogo";
import { ErroDaApi } from "./erros";
import { classificarTags, colecaoDoDrop, normalizarTag } from "./tags";

/** Um produto como a API devolve (GET /api/v1/products/{id}). */
function produto(extra: Partial<ProdutoDaApi> = {}): ProdutoDaApi {
  return {
    id: "8f14e45f-ceea-467f-a0e6-1b3b3a1f2c3d",
    nome: "Heavy Cotton Tee",
    descricao: "Camiseta pesada.",
    preco: 169.9,
    slug: "heavy-cotton-tee",
    criadoEm: "2026-11-01T10:00:00",
    imagens: [
      { id: "i2", url: "https://cdn.exemplo.com/costas.jpg", ordem: 1 },
      { id: "i1", url: "https://cdn.exemplo.com/frente.jpg", ordem: 0 },
    ],
    tags: [
      { id: "t1", tag: "Camiseta" },
      { id: "t2", tag: "Treino" },
      { id: "t3", tag: "Drop 02" },
      { id: "t4", tag: "Destaques" },
    ],
    variantes: [
      {
        id: "v1",
        sku: "TEE-P-PRETO",
        size: { id: "s1", label: "P" },
        color: { id: "c1", nome: "Preto", hex: "#000000" },
        precoEfetivo: 169.9,
        quant: 3,
      },
      {
        id: "v2",
        sku: "TEE-P-BRANCO",
        size: { id: "s1", label: "P" },
        color: { id: "c2", nome: "Branco", hex: "#FFFFFF" },
        precoEfetivo: 169.9,
        quant: 2,
      },
      {
        id: "v3",
        sku: "TEE-M-PRETO",
        size: { id: "s2", label: "M" },
        color: { id: "c1", nome: "Preto", hex: "#000000" },
        precoEfetivo: 169.9,
        quant: 0,
      },
    ],
    ...extra,
  };
}

describe("tags", () => {
  it("normaliza grafias diferentes da mesma tag", () => {
    expect(normalizarTag("Drop 02")).toBe("drop-02");
    expect(normalizarTag("  DROP-02 ")).toBe("drop-02");
    expect(normalizarTag("Lançamento")).toBe("lancamento");
  });

  it("distribui cada tag no seu filtro", () => {
    const tags = classificarTags([
      "camisetas",
      "Casual",
      "treino",
      "novidades",
      "drop 03",
      "verão",
    ]);
    expect(tags.categoria).toBe("camisetas");
    expect(tags.estilos).toEqual(["casual", "treino"]);
    expect(tags.curadoria).toBe("novo-drop");
    // a tag sem filtro continua no produto (a busca usa)
    expect(tags.todas).toContain("verao");
    expect(tags.todas).toContain("drop-03");
  });

  it("monta a coleção do drop a partir da tag", () => {
    expect(colecaoDoDrop("drop-02")).toEqual({
      id: "drop-02",
      name: "DROP 02",
      tag: "drop-02",
      description: "",
    });
  });
});

describe("produtoDaApi", () => {
  it("traduz o produto para o formato das telas", () => {
    const p = produtoDaApi(produto());
    expect(p).toMatchObject({
      id: "8f14e45f-ceea-467f-a0e6-1b3b3a1f2c3d",
      name: "Heavy Cotton Tee",
      price: 169.9,
      type: "camisetas",
      styles: ["treino"],
      section: "destaques",
      color: "BLACK",
      description: "Camiseta pesada.",
    });
    expect(p.tags).toContain("drop-02");
  });

  it("soma o estoque das cores de cada tamanho", () => {
    expect(produtoDaApi(produto()).stock).toEqual({ P: 5, M: 0 });
  });

  it("ordena as imagens e usa a de ordem 0 como capa", () => {
    const p = produtoDaApi(produto());
    expect(p.image).toBe("https://cdn.exemplo.com/frente.jpg");
    expect(p.images).toHaveLength(2);
  });

  it("descarta imagem que não é http(s) e usa a imagem sem foto", () => {
    const p = produtoDaApi(
      produto({ imagens: [{ id: "x", url: "javascript:alert(1)", ordem: 0 }] }),
    );
    expect(p.image).toBe(IMAGEM_SEM_FOTO);
    expect(p.images).toEqual([IMAGEM_SEM_FOTO]);
  });

  it("aceita produto recém-criado, sem imagens, tags nem variantes", () => {
    const p = produtoDaApi(
      produto({ imagens: null, tags: null, variantes: null, descricao: null }),
    );
    expect(p.image).toBe(IMAGEM_SEM_FOTO);
    expect(p.stock).toEqual({});
    expect(p.styles).toEqual([]);
    expect(p.type).toBe("camisetas");
    expect(p.description).toBeUndefined();
  });
});

describe("filtrarProdutos", () => {
  const camiseta = produtoDaApi(produto());
  const bermuda = produtoDaApi(
    produto({
      id: "b",
      nome: "Bermuda",
      preco: 120,
      tags: [{ id: "t", tag: "bermudas" }],
    }),
  );

  it("filtra pelas tags classificadas e ordena", () => {
    expect(filtrarProdutos([camiseta, bermuda], { type: "bermudas" })).toEqual([bermuda]);
    expect(filtrarProdutos([camiseta, bermuda], { collection: "drop-02" })).toEqual([camiseta]);
    expect(filtrarProdutos([camiseta, bermuda], { sort: "price-asc" }).map((p) => p.name)).toEqual([
      "Bermuda",
      "Heavy Cotton Tee",
    ]);
  });

  it("catálogo vazio continua vazio com qualquer filtro", () => {
    expect(filtrarProdutos([], {})).toEqual([]);
    expect(filtrarProdutos([], { style: "casual", sort: "name" })).toEqual([]);
  });
});

describe("ErroDaApi", () => {
  it("usa a mensagem e os campos do erro de validação da API", () => {
    const erro = ErroDaApi.daResposta(400, {
      status: 400,
      message: "Dados inválidos",
      fieldErrors: [{ field: "email", message: "Email inválido" }],
    });
    expect(erro.message).toBe("Dados inválidos");
    expect(erro.campos).toEqual([{ campo: "email", mensagem: "Email inválido" }]);
  });

  it("guarda a espera do 429", () => {
    expect(ErroDaApi.daResposta(429, null, 120).esperarSegundos).toBe(120);
    expect(ErroDaApi.daResposta(429, null).message).toMatch(/Muitas tentativas/);
  });

  it("nunca mostra a mensagem de um erro 5xx", () => {
    const erro = ErroDaApi.daResposta(500, { message: "NullPointerException em OrderService" });
    expect(erro.message).not.toMatch(/NullPointer/);
  });
});
