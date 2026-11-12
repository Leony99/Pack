/**
 * NOTÍCIAS HARDCODED do card de notícias do topo da home.
 * Viriam de um endpoint de conteúdo (ex.: `GET /content/news`) quando houver um.
 */
export type Noticia = { data: string; titulo: string };

export const noticias: Noticia[] = [
  { data: "11 NOV", titulo: "Novo drop no ar: peças de casual e treino em preto e branco" },
  { data: "04 NOV", titulo: "Frete grátis agora nas compras acima de R$ 200" },
  { data: "28 OUT", titulo: "Trocas em até 30 dias e parcelamento em até 6x" },
];
