/**
 * PROMOÇÕES HARDCODED do card de promoções do topo da home ("3 Bermudas por R$ 120").
 * Só aparecem no card: o carrinho e o checkout ainda não aplicam esses preços.
 * Viriam de um endpoint de conteúdo (ex.: `GET /content/promotions`) quando houver um.
 */
export type Promocao = {
  /** Quantidade e peça, como aparece no card. */
  oferta: string;
  /** Preço do conjunto, em reais. */
  preco: number;
  /** Até quando vale ("30 NOV"). */
  ate: string;
};

export const promocoes: Promocao[] = [
  { oferta: "3 Bermudas", preco: 120, ate: "30 NOV" },
  { oferta: "2 Camisetas", preco: 150, ate: "30 NOV" },
  { oferta: "4 Regatas", preco: 180, ate: "15 DEZ" },
];
