// A consulta do catálogo, em páginas: a mesma no loader das rotas (que carrega a primeira página no
// servidor) e na grade (CatalogView), que pede as próximas no "CARREGAR MAIS".
import { infiniteQueryOptions } from "@tanstack/react-query";
import { getPaginaDoCatalogo, type ProductFilters } from "@/lib/api";

/** Quantos produtos vêm de cada vez. */
export const LOTE = 8;

export const catalogoQuery = (filters: ProductFilters, disponiveis = false) =>
  infiniteQueryOptions({
    queryKey: ["products", "catalogo", filters, disponiveis],
    queryFn: ({ pageParam }) => getPaginaDoCatalogo({ ...filters, disponiveis }, pageParam, LOTE),
    initialPageParam: 0,
    getNextPageParam: (ultima, todas) => (ultima.temMais ? todas.length : undefined),
  });
