// Tradução entre o formato da Pack API (campos em português, produto → variantes) e o formato que
// as telas usam (src/data/types.ts). As telas não conhecem a API: só esta camada muda se o contrato
// mudar. Funções puras, testadas em adaptadores.test.ts.
import type { SavedAddress } from "@/data/dashboard";
import type { Order, Product } from "@/data/types";
import { STATUS_DA_API } from "@/lib/dominio";
import { classificarTags, type TagDaApi } from "./tags";

/** Listagem paginada da API: GET /products?pagina=0&tamanho=20. */
export type PaginaDaApi<T> = {
  itens: T[];
  pagina: number;
  tamanho: number;
  totalItens: number;
  totalPaginas: number;
};

export type VarianteDaApi = {
  id: string;
  sku: string;
  size: { id: string; label: string } | null;
  color: { id: string; nome: string; hex: string } | null;
  precoEfetivo: number;
  quant: number;
  /** null nas variantes cadastradas antes de a API guardar a data */
  criadoEm?: string | null;
};

export type ProdutoDaApi = {
  id: string;
  /** false: fora da loja (a página do produto mostra como indisponível) */
  ativo?: boolean;
  nome: string;
  descricao: string | null;
  preco: number;
  slug: string;
  criadoEm: string;
  imagens: { id: string; url: string; ordem: number }[] | null;
  tags: TagDaApi[] | null;
  variantes: VarianteDaApi[] | null;
};

/** Imagem do produto sem foto cadastrada: um quadro cinza com o nome da marca. */
export const IMAGEM_SEM_FOTO =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect width="300" height="400" fill="#ececec"/><text x="150" y="208" text-anchor="middle" font-family="sans-serif" font-size="18" letter-spacing="6" fill="#9a9a9a">PACK</text></svg>',
  );

/** Só aceita imagens http(s): uma URL estranha vinda do banco não vira src de imagem. */
export function urlDeImagemSegura(url: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

/** Cor do produto para as telas (que só conhecem preto e branco), pela cor da primeira variante. */
function corDoProduto(variantes: VarianteDaApi[]): Product["color"] {
  const cor = variantes.find((v) => v.color)?.color;
  if (!cor) return "BLACK";
  const nome = cor.nome.toLowerCase();
  return nome.includes("branc") || nome.includes("white") || cor.hex.toLowerCase() === "#ffffff"
    ? "WHITE"
    : "BLACK";
}

/**
 * ProdutoDaApi → Product.
 * - estoque: soma a quantidade das variantes de cada tamanho (o produto pode ter várias cores);
 * - estilo, categoria e coleções saem do filtro de cada tag na API (ver tags.ts); destaques e novidades não usam tag (mais
 *   vendidos e data de cadastro);
 * - novidadeEm: o cadastro mais recente entre o do produto e o das variantes (selo NOVO);
 * - imagens em ordem, só http(s); sem foto, usa IMAGEM_SEM_FOTO.
 * O que a tela ainda não usa (SKU, cor por variante, preço por variante) fica na API: a escolha de
 * variante entra quando o carrinho for ligado.
 */
export function produtoDaApi(p: ProdutoDaApi): Product {
  const variantes = p.variantes ?? [];
  const imagens = [...(p.imagens ?? [])]
    .sort((a, b) => a.ordem - b.ordem)
    .map((i) => i.url)
    .filter(urlDeImagemSegura);
  const tags = classificarTags(p.tags ?? []);

  const stock: Record<string, number> = {};
  for (const v of variantes) {
    const tamanho = v.size?.label;
    if (tamanho) stock[tamanho] = (stock[tamanho] ?? 0) + Math.max(0, v.quant);
  }

  return {
    id: p.id,
    name: p.nome,
    price: Number(p.preco),
    image: imagens[0] ?? IMAGEM_SEM_FOTO,
    images: imagens.length ? imagens : [IMAGEM_SEM_FOTO],
    color: corDoProduto(variantes),
    styles: tags.estilos,
    // todo produto novo tem categoria; um antigo, sem ela, cai em camisa (a primeira categoria da loja)
    type: tags.categoria ?? "camisa",
    description: p.descricao ?? undefined,
    tags: tags.todas,
    colecoes: tags.colecoes,
    stock,
    active: p.ativo ?? true,
    createdAt: p.criadoEm,
    novidadeEm: ultimaData([p.criadoEm, ...variantes.map((v) => v.criadoEm)]),
  };
}

/** A data mais recente da lista (ignora as vazias e as inválidas). */
function ultimaData(datas: (string | null | undefined)[]): string | undefined {
  let maior: string | undefined;
  for (const data of datas) {
    if (data && !Number.isNaN(Date.parse(data)) && (!maior || Date.parse(data) > Date.parse(maior)))
      maior = data;
  }
  return maior;
}

/* --------------------------------------------------------------- área do cliente */

/** AddressResponse da API. */
export type EnderecoDaApi = {
  id: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string | null;
  bairro: string | null;
  cidade: string;
  estado: string;
  apelido: string | null;
  principal: boolean;
};

/** O que a API recebe num endereço (AddressRequest). */
export type EnderecoParaApi = Omit<EnderecoDaApi, "id">;

/** Endereço da API → o das telas. Nome e e-mail são os do cliente (a API não guarda no endereço). */
export function enderecoDaApi(
  e: EnderecoDaApi,
  cliente: { name: string; email: string },
): SavedAddress {
  return {
    id: e.id,
    label: e.apelido ?? "",
    primary: e.principal,
    name: cliente.name,
    email: cliente.email,
    cep: e.cep.replace(/\D/g, ""),
    street: e.rua,
    number: e.numero,
    complement: e.complemento ?? "",
    neighborhood: e.bairro ?? "",
    city: e.cidade,
    state: e.estado,
  };
}

/** Endereço das telas → o corpo da API (o CEP vai só com os números). */
export function enderecoParaApi(a: SavedAddress): EnderecoParaApi {
  return {
    cep: a.cep.replace(/\D/g, ""),
    rua: a.street.trim(),
    numero: a.number.trim(),
    complemento: a.complement.trim() || null,
    bairro: a.neighborhood.trim(),
    cidade: a.city.trim(),
    estado: a.state.trim().toUpperCase(),
    apelido: a.label.trim() || null,
    principal: a.primary,
  };
}

/** OrderResponse da API (o que as telas usam). */
export type PedidoDaApi = {
  id: string;
  customer: { nome: string; email: string };
  status: keyof typeof STATUS_DA_API;
  total: number | string;
  criadoEm: string;
  enderecoCep: string;
  enderecoRua: string;
  enderecoNumero: string;
  enderecoComplemento: string | null;
  enderecoBairro: string | null;
  enderecoCidade: string;
  enderecoEstado: string;
  coupon: { codigo: string } | null;
  itens: {
    id: string;
    variantSku: string;
    produtoId: string;
    imagem: string | null;
    tamanho: string;
    cor: string;
    produtoNome: string;
    disponivel: boolean;
    quantidade: number;
    precoUnit: number | string;
  }[];
  payment: { metodo: string; status: string } | null;
  shipment: { transportadora: string; codigoRastreio: string | null; status: string } | null;
};

/** Como cada método de pagamento da API aparece na tela. */
const METODO_DE_PAGAMENTO: Record<string, string> = {
  PIX: "Pix",
  CARTAO_CREDITO: "Cartão de crédito",
  CARTAO_DEBITO: "Cartão de débito",
  BOLETO: "Boleto",
  OUTRO: "Outro",
};

const STATUS_DO_PAGAMENTO: Record<string, string> = {
  PENDENTE: "aguardando confirmação",
  APROVADO: "aprovado",
  RECUSADO: "recusado",
  ESTORNADO: "estornado",
};

/**
 * Pedido da API → o das telas. A API não cobra frete (o envio vem depois, com a transportadora e o
 * rastreio): o frete aparece como R$ 0. O desconto é a diferença entre a soma dos itens e o total.
 */
export function pedidoDaApi(p: PedidoDaApi): Order {
  const items = p.itens.map((i) => {
    const foto = i.imagem && urlDeImagemSegura(i.imagem) ? i.imagem : IMAGEM_SEM_FOTO;
    return {
      id: i.produtoId,
      name: i.produtoNome,
      price: Number(i.precoUnit),
      image: foto,
      images: [foto],
      color: (i.cor.toLowerCase().includes("branc") ? "WHITE" : "BLACK") as Product["color"],
      styles: [],
      type: "",
      size: i.tamanho,
      qty: i.quantidade,
      disponivel: i.disponivel,
    };
  });
  const subtotal = items.reduce((soma, i) => soma + i.price * i.qty, 0);
  const total = Number(p.total);
  return {
    id: p.id,
    customer: { name: p.customer.nome, email: p.customer.email },
    items,
    address: {
      name: p.customer.nome,
      email: p.customer.email,
      cep: p.enderecoCep.replace(/\D/g, ""),
      street: p.enderecoRua,
      number: p.enderecoNumero,
      complement: p.enderecoComplemento ?? "",
      neighborhood: p.enderecoBairro ?? "",
      city: p.enderecoCidade,
      state: p.enderecoEstado,
    },
    // sem envio ainda: a loja cria o envio (transportadora e rastreio) depois do pagamento
    shipping: {
      label: p.shipment ? `Envio pela ${p.shipment.transportadora}` : "Aguardando envio",
      days: "",
      price: 0,
    },
    payment: p.payment?.metodo === "PIX" ? "pix" : "card",
    paymentLabel: p.payment
      ? `${METODO_DE_PAGAMENTO[p.payment.metodo] ?? p.payment.metodo} · ${STATUS_DO_PAGAMENTO[p.payment.status] ?? p.payment.status}`
      : "Pagamento ainda não informado",
    subtotal,
    discount: Math.max(0, Math.round((subtotal - total) * 100) / 100),
    total,
    status: STATUS_DA_API[p.status] ?? p.status,
    createdAt: p.criadoEm,
    tracking: p.shipment?.codigoRastreio ?? "",
  };
}
