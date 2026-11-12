/**
 * Tipos de domínio da loja PACK.
 *
 * Espelham o diagrama ER do backend (backend/docs/erd.svg), achatados para as telas.
 * Enquanto a API não está ligada, os dados vivem em `src/data/*` e são lidos SEMPRE
 * através de `src/lib/api` — componentes e rotas importam daqui só os tipos.
 */

export type Style = "casual" | "treino";
export type ItemType = "camisetas" | "bermudas" | "conjuntos";
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
  /** tag de curadoria: destaques / novo-drop (PRODUCT_TAG) */
  section?: Section;
  description?: string;
  tags?: string[];
  stock?: Record<string, number>;
  active?: boolean;
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
  items: (Product & { size: string; qty: number })[];
  address: CheckoutAddress;
  shipping: ShippingOption;
  payment: "pix" | "card";
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  customerId?: string;
  createdAt?: string;
  tracking?: string;
};
