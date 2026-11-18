/**
 * Tipos de domínio da loja PACK.
 *
 * Espelham o diagrama ER do backend (backend/docs/erd.svg), achatados para as telas.
 * Enquanto a API não está ligada, os dados vivem em `src/data/*` e são lidos SEMPRE
 * através de `src/lib/api` — componentes e rotas importam daqui só os tipos.
 */

/**
 * Estilo e categoria: na API, são as tags com filtro ESTILO e CATEGORIA (a tag normalizada, como
 * "treino" ou "moletons"), então qualquer texto vale. A loja cria sozinha os estilos fixos
 * casual/treino e as categorias camisa/bermuda/conjunto, as mesmas da demonstração.
 */
export type Style = string;
export type ItemType = string;
export type Section = "destaques" | "novo-drop";

/** PRODUCT (+ PRODUCT_IMAGE, PRODUCT_TAG_LINK achatados) */
export type Product = {
  id: string;
  name: string;
  price: number;
  /** imagem de capa (PRODUCT_IMAGE.ordem = 0) */
  image: string;
  /** galeria (PRODUCT_IMAGE) */
  images: string[];
  color: "BLACK" | "WHITE";
  /** tags de estilo (PRODUCT_TAG) */
  styles: Style[];
  /** tag de categoria (PRODUCT_TAG) */
  type: ItemType;
  /** curadoria da demonstração (na API, destaques são os mais vendidos e novidades vêm da data) */
  section?: Section;
  description?: string;
  tags?: string[];
  /** coleções (drops) do produto: as tags com filtro COLECAO na API; na demonstração, as "drop-..." */
  colecoes?: string[];
  stock?: Record<string, number>;
  active?: boolean;
  /** data de cadastro (ISO); escolhe o drop em destaque, o da peça mais recente */
  createdAt?: string;
  /** cadastro mais recente do produto ou de uma variante dele (ISO): até 3 meses, selo NOVO */
  novidadeEm?: string;
};

/** COUPON */
export type Coupon = {
  code: string;
  /** percentual (tipo "percent") ou valor em R$ (tipo "fixed") */
  discount: number;
  type: "percent" | "fixed";
  /** ISO date — null = sem validade */
  validUntil: string | null;
};

/** SHIPMENT / cotação de frete */
export type ShippingOption = {
  label: string;
  days: string;
  price: number;
};

/** SIZE — tabela de medidas */
export type SizeRow = {
  size: string;
  chest: string;
  length: string;
  waist: string;
};

export type CheckoutAddress = {
  name: string;
  email: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};
export type Order = {
  id: string;
  customer: { name: string; email: string };
  // disponivel: false quando o produto foi desativado depois do pedido (vem da API: itens[].disponivel)
  items: (Product & { size: string; qty: number; disponivel?: boolean })[];
  address: CheckoutAddress;
  shipping: ShippingOption;
  payment: "pix" | "card";
  /** Com a API: o método e a situação do pagamento ("Pix · aprovado"). */
  paymentLabel?: string;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  customerId?: string;
  createdAt?: string;
  tracking?: string;
};
