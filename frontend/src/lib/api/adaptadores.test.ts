// Tradução da Pack API para as telas: tags nos filtros, produto → Product e erros da API.
import { describe, expect, it } from "vitest";
import { IMAGEM_SEM_FOTO, produtoDaApi, type ProdutoDaApi } from "./adaptadores";
import { ehNovo, filtrarProdutos } from "./catalogo";
import { ErroDaApi } from "./erros";
import {
  classificarTags,
  colecaoDoDrop,
  maisRecentesPrimeiro,
  nomeDaOpcao,
  normalizarTag,
  opcoesDoFiltro,
  tagDoDropEmDestaque,
} from "./tags";

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
      { id: "t1", tag: "camisetas", filtro: "CATEGORIA" },
      { id: "t2", tag: "Treino", filtro: "ESTILO" },
      { id: "t3", tag: "Drop 02", filtro: "COLECAO" },
      { id: "t4", tag: "Destaques", filtro: null },
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

  it("a própria tag é a opção do filtro que ela tem na API", () => {
    const tags = classificarTags([
      { id: "1", tag: "Moletons", filtro: "CATEGORIA" },
      { id: "2", tag: "Casual", filtro: "ESTILO" },
      { id: "3", tag: "treino", filtro: "ESTILO" },
      { id: "4", tag: "Drop Natal", filtro: "COLECAO" },
      { id: "5", tag: "verão", filtro: null },
    ]);
    expect(tags.categoria).toBe("moletons");
    expect(tags.estilos).toEqual(["casual", "treino"]);
    expect(tags.colecoes).toEqual(["drop-natal"]);
    // a tag sem filtro continua no produto (a busca usa)
    expect(tags.todas).toContain("verao");
  });

  it("o nome da tag sozinho não decide o filtro", () => {
    // sem filtro na API, "camisetas" e "drop-03" não viram categoria nem coleção
    const tags = classificarTags([
      { id: "1", tag: "camisetas" },
      { id: "2", tag: "drop-03" },
    ]);
    expect(tags.categoria).toBeUndefined();
    expect(tags.colecoes).toEqual([]);
  });

  it("as opções de cada filtro são as tags dele, sem repetir e em ordem", () => {
    const tags = [
      { id: "1", tag: "Treino", filtro: "ESTILO" as const },
      { id: "2", tag: "casual", filtro: "ESTILO" as const },
      { id: "3", tag: "treino", filtro: "ESTILO" as const },
      { id: "4", tag: "moletons", filtro: "CATEGORIA" as const },
      { id: "5", tag: "verao" },
    ];
    expect(opcoesDoFiltro(tags, "ESTILO")).toEqual([
      { valor: "casual", nome: "Casual" },
      { valor: "treino", nome: "Treino" },
    ]);
    expect(opcoesDoFiltro(tags, "CATEGORIA").map((o) => o.valor)).toEqual(["moletons"]);
    expect(nomeDaOpcao("drop-natal")).toBe("Drop natal");
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
      color: "BLACK",
      description: "Camiseta pesada.",
    });
    expect(p.tags).toContain("drop-02");
    expect(p.colecoes).toEqual(["drop-02"]);
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
    expect(p.type).toBe("camisa");
    expect(p.description).toBeUndefined();
  });
});

describe("drop em destaque", () => {
  const peca = (tags: string[], createdAt?: string) => ({ tags, createdAt });

  it("guarda a data de cadastro da API", () => {
    expect(produtoDaApi(produto()).createdAt).toBe("2026-11-01T10:00:00");
  });

  it("escolhe o drop da peça cadastrada mais recentemente, com qualquer nome", () => {
    const produtos = [
      peca(["drop-02", "camiseta"], "2026-10-01T10:00:00"),
      peca(["destaques"], "2026-12-20T10:00:00"),
      peca(["drop-natal"], "2026-12-01T10:00:00"),
      peca(["drop-10"], "2026-11-01T10:00:00"),
    ];
    expect(tagDoDropEmDestaque(produtos)).toBe("drop-natal");
  });

  it("sem peça com tag de drop, não há drop em destaque (EM BREVE)", () => {
    expect(tagDoDropEmDestaque([peca(["destaques"], "2026-12-01T10:00:00")])).toBeUndefined();
    expect(tagDoDropEmDestaque([])).toBeUndefined();
  });

  it("ordena da mais nova para a mais antiga; sem data, vai para o fim", () => {
    const ordem = maisRecentesPrimeiro([
      peca(["a"]),
      peca(["b"], "2026-01-01T00:00:00"),
      peca(["c"], "2026-06-01T00:00:00"),
    ]).map((p) => p.tags[0]);
    expect(ordem).toEqual(["c", "b", "a"]);
  });
});

describe("selo NOVO", () => {
  const agora = new Date("2026-11-16T12:00:00");

  it("a tag destaques não vira curadoria (destaques são os mais vendidos)", () => {
    expect(produtoDaApi(produto()).section).toBeUndefined();
  });

  it("usa o cadastro mais recente entre o do produto e o das variantes", () => {
    const p = produto({ criadoEm: "2026-01-10T10:00:00" });
    p.variantes![1]!.criadoEm = "2026-10-05T09:00:00";
    p.variantes![2]!.criadoEm = null;
    expect(produtoDaApi(p).novidadeEm).toBe("2026-10-05T09:00:00");
  });

  it("produto ou variante dos últimos 3 meses ganha o selo", () => {
    expect(ehNovo({ novidadeEm: "2026-08-20T00:00:00" }, agora)).toBe(true);
    expect(ehNovo({ novidadeEm: "2026-08-10T00:00:00" }, agora)).toBe(false);
    expect(ehNovo({}, agora)).toBe(false);
  });

  it("o filtro Novidades do catálogo segue o selo", () => {
    const novo = { ...produtoDaApi(produto()), id: "novo", novidadeEm: new Date().toISOString() };
    const antigo = { ...produtoDaApi(produto()), id: "antigo", novidadeEm: "2020-01-01T00:00:00" };
    expect(filtrarProdutos([novo, antigo], { section: "novo-drop" }).map((p) => p.id)).toEqual([
      "novo",
    ]);
  });
});

describe("filtrarProdutos", () => {
  const camiseta = produtoDaApi(produto());
  const bermuda = produtoDaApi(
    produto({
      id: "b",
      nome: "Bermuda",
      preco: 120,
      tags: [{ id: "t", tag: "bermudas", filtro: "CATEGORIA" }],
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
