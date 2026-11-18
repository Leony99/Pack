// Valores fixos do domínio da loja, usados pela simulação da API e pelas telas.
// Os status de pedido mudam com o modo: a API tem o fluxo real (com pagamento e devolução).
import { USA_API } from "./api/modo";

/** Tamanhos, na ordem em que aparecem nas telas e na ordenação das tabelas. */
export const TAMANHOS = ["PP", "P", "M", "G", "GG"] as const;

/** Como cada status de pedido da API (OrderStatus) aparece na tela. */
export const STATUS_DA_API = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGO: "Pago",
  EM_SEPARACAO: "Em separação",
  ENVIADO: "Enviado",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
  DEVOLVIDO: "Devolvido",
} as const;

/** Status de um pedido, na ordem do fluxo (os dois últimos encerram o pedido fora do fluxo). */
export const STATUS_DE_PEDIDO: readonly string[] = USA_API
  ? Object.values(STATUS_DA_API)
  : ["Pedido simulado", "Em separação", "Enviado", "Entregue", "Cancelado"];

/** As etapas que a linha do tempo do pedido mostra (cancelado e devolvido ficam de fora). */
export const ETAPAS_DO_PEDIDO = STATUS_DE_PEDIDO.slice(0, USA_API ? 5 : 4);

/**
 * Um pedido nesses status ainda pode ser cancelado pelo cliente. Com a API, só antes de a loja
 * começar a separar (POST /orders/{id}/cancelar); depois, pelo atendimento.
 */
export const CANCELAVEL: readonly string[] = USA_API
  ? [STATUS_DA_API.AGUARDANDO_PAGAMENTO, STATUS_DA_API.PAGO]
  : ["Pedido simulado", "Em separação"];

/** Status de uma solicitação de troca ou devolução. */
export const STATUS_DE_TROCA = ["Solicitada", "Em análise", "Aprovada", "Recusada", "Concluída"];

/** Pedidos nesses status já terminaram (não estão "em andamento"). */
export const FINALIZADO: readonly string[] = USA_API
  ? [STATUS_DA_API.ENTREGUE, STATUS_DA_API.CANCELADO, STATUS_DA_API.DEVOLVIDO]
  : ["Entregue", "Cancelado"];
