// Catálogo na Pack API: funções de servidor (createServerFn). O navegador chama o servidor do
// frontend, que chama a API (BFF); o corpo de cada handler nunca vai para o navegador.
// Só leitura e sem login: as rotas de produto da API são públicas.
import { createServerFn } from "@tanstack/react-start";
import type { Product } from "@/data/types";
import { produtoDaApi, type PaginaDaApi, type ProdutoDaApi } from "./adaptadores";
import { ErroDaApi } from "./erros";
import { chamarApi } from "./server/http";

/** A API devolve no máximo 100 por página; o catálogo busca até 10 páginas (1.000 produtos). */
const POR_PAGINA = 100;
const MAXIMO_DE_PAGINAS = 10;
/** A busca por nome da API exige pelo menos 3 letras (com menos, responde 400). */
const MINIMO_DA_BUSCA = 3;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** O que o navegador manda é conferido aqui: só um texto curto de busca, opcional. */
function validarBusca(entrada: unknown): { nome?: string } {
  const nome = (entrada as { nome?: unknown } | null)?.nome;
  if (nome === undefined) return {};
  if (typeof nome !== "string") throw new Error("Busca inválida.");
  return { nome: nome.trim().slice(0, 100) };
}

/**
 * Todos os produtos ativos da API (ou os que batem com a busca por nome), já no formato das telas.
 * Os filtros de estilo, categoria, curadoria e drop são aplicados depois, sobre as tags (tags.ts):
 * a API só filtra por uma tag exata, e as tags podem ter grafias diferentes.
 */
export const produtosDaApi = createServerFn({ method: "GET" })
  .validator(validarBusca)
  .handler(async ({ data }): Promise<Product[]> => {
    const busca =
      data.nome && data.nome.length >= MINIMO_DA_BUSCA
        ? `&nome=${encodeURIComponent(data.nome)}`
        : "";
    const produtos: ProdutoDaApi[] = [];
    for (let pagina = 0; pagina < MAXIMO_DE_PAGINAS; pagina++) {
      const resposta = await chamarApi<PaginaDaApi<ProdutoDaApi>>(
        `/api/v1/products?pagina=${pagina}&tamanho=${POR_PAGINA}${busca}`,
      );
      produtos.push(...resposta.itens);
      if (pagina + 1 >= resposta.totalPaginas) break;
    }
    return produtos.map(produtoDaApi);
  });

/** Um produto pelo id (UUID). Id inválido ou produto que não existe → null (a tela mostra o 404). */
export const produtoDaApiPorId = createServerFn({ method: "GET" })
  .validator((id: unknown) => {
    if (typeof id !== "string") throw new Error("Id inválido.");
    return id;
  })
  .handler(async ({ data: id }): Promise<Product | null> => {
    if (!UUID.test(id)) return null;
    try {
      return produtoDaApi(await chamarApi<ProdutoDaApi>(`/api/v1/products/${id}`));
    } catch (erro) {
      if (erro instanceof ErroDaApi && erro.status === 404) return null;
      throw erro;
    }
  });
