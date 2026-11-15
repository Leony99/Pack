// Erro da Pack API, no formato do ApiError do Spring. Fica fora da pasta server/ porque as telas
// também o recebem (as funções de servidor repassam o erro para o navegador).

/** Corpo de erro da API: { timestamp, status, error, message, path, fieldErrors? }. */
export type ErroDaApiJson = {
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  fieldErrors?: { field: string; message: string }[];
};

/** Mensagem para cada status quando a API não manda uma (ou manda uma que não é para a tela). */
const MENSAGEM_PADRAO: Record<number, string> = {
  400: "Confira os dados enviados.",
  401: "Sua sessão expirou. Entre de novo.",
  403: "Você não tem permissão para isso.",
  404: "Não encontrado.",
  409: "Isso conflita com o que já existe.",
  422: "Não foi possível concluir: confira os dados.",
  429: "Muitas tentativas. Espere um pouco e tente de novo.",
};

export class ErroDaApi extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** Erros de validação, campo a campo (só no 400 do @Valid). */
    readonly campos: { campo: string; mensagem: string }[] = [],
    /** Segundos até poder tentar de novo (cabeçalho Retry-After do 429). */
    readonly esperarSegundos?: number,
  ) {
    super(message);
    this.name = "ErroDaApi";
  }

  /**
   * Monta o erro a partir da resposta da API. Erros 5xx nunca mostram a mensagem do servidor (ela
   * pode ter detalhes internos); os 4xx usam a mensagem da API, que é escrita para o usuário.
   */
  static daResposta(status: number, corpo: ErroDaApiJson | null, esperarSegundos?: number) {
    const campos = (corpo?.fieldErrors ?? []).map((f) => ({ campo: f.field, mensagem: f.message }));
    const mensagem =
      status >= 500
        ? "A loja está com instabilidade. Tente de novo em instantes."
        : corpo?.message || MENSAGEM_PADRAO[status] || "Não foi possível concluir.";
    return new ErroDaApi(status, mensagem, campos, esperarSegundos);
  }
}
