// Painel da equipe com a API (USA_API): os tipos que a API devolve e as chamadas das telas
// (components/admin/api). Tudo passa pela ponte de painel-api.ts, com o token da equipe.
import type { PaginaDaApi, PedidoDaApi, ProdutoDaApi, VarianteDaApi } from "./adaptadores";
import { chamarPainelNaApi, enviarFotoNaApi, type Json } from "./painel-api";
import type { TagDaApi } from "./tags";

export type { PaginaDaApi, PedidoDaApi, ProdutoDaApi, TagDaApi, VarianteDaApi };

export type TamanhoDaApi = { id: string; label: string };
export type CorDaApi = { id: string; nome: string; hex: string };
export type CupomDaApi = {
  id: string;
  codigo: string;
  desconto: number;
  tipo: "PERCENTUAL" | "FIXO";
  validade: string | null;
};
export type ClienteDaApi = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  criadoEm: string;
};
export type PapelDaApi = { id: string; nome: string; permissoes: { id: string; nome: string }[] };
export type ColaboradorDaApi = {
  id: string;
  nome: string;
  email: string;
  role: PapelDaApi;
};
export type MensagemDaApi = {
  id: string;
  nome: string;
  email: string;
  assunto: string | null;
  mensagem: string;
  status: "NOVA" | "RESPONDIDA";
  criadoEm: string;
};
export type InscritoDaApi = { id: string; email: string; ativo: boolean; criadoEm: string };
export type ResumoDaApi = {
  pedidos?: { porStatus: Record<string, number>; vendasDoMes: number; pedidosDoMes: number };
  catalogo?: { ativos: number; inativos: number };
  estoque?: { variantesComEstoqueBaixo: number; limite: number };
  clientes?: { total: number; mensagensNovas: number };
};
export type MovimentoDaApi = {
  id: string;
  tipoMovimentacao: string;
  quantidade: number;
  motivo: string | null;
  data: string;
};

type Metodo = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** Uma chamada do painel: o caminho começa depois de /api/v1 (ex.: "/orders?pagina=0"). */
export async function painel<T>(metodo: Metodo, caminho: string, corpo?: unknown): Promise<T> {
  const resposta = await chamarPainelNaApi({
    data: { metodo, caminho: `/api/v1${caminho}`, corpo: corpo as Json },
  });
  return resposta as T;
}

/** Junta as páginas de uma listagem (até 10 páginas de 100): o painel filtra e ordena na tela. */
export async function todasAsPaginas<T>(caminho: string): Promise<T[]> {
  const itens: T[] = [];
  const separador = caminho.includes("?") ? "&" : "?";
  for (let pagina = 0; pagina < 10; pagina++) {
    const r = await painel<PaginaDaApi<T>>(
      "GET",
      `${caminho}${separador}pagina=${pagina}&tamanho=100`,
    );
    itens.push(...r.itens);
    if (pagina + 1 >= r.totalPaginas) break;
  }
  return itens;
}

/** Lado máximo da foto enviada e a qualidade do WebP: fica entre 150 e 300 KB. */
const LADO_MAXIMO = 1600;
const QUALIDADE = 0.85;

/**
 * Reduz a foto no navegador antes do envio (até 1600 px no lado maior, em WebP), para gastar menos
 * espaço e transferência do bucket. Sem suporte a WebP no canvas, manda a original.
 */
export async function reduzirFoto(arquivo: File): Promise<Blob> {
  const imagem = await createImageBitmap(arquivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagem.width, imagem.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(imagem.width * escala);
  canvas.height = Math.round(imagem.height * escala);
  canvas.getContext("2d")?.drawImage(imagem, 0, 0, canvas.width, canvas.height);
  imagem.close();
  const webp = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/webp", QUALIDADE));
  return webp && webp.type === "image/webp" ? webp : arquivo;
}

/** Envia a foto (já reduzida) de um produto. */
export async function enviarFoto(produtoId: string, arquivo: File) {
  const formulario = new FormData();
  formulario.append("produto", produtoId);
  formulario.append("arquivo", await reduzirFoto(arquivo), "foto.webp");
  return enviarFotoNaApi({ data: formulario });
}
