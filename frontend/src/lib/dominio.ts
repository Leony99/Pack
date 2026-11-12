// Valores fixos do domínio da loja, usados pela simulação da API e pelas telas.

/** Tamanhos, na ordem em que aparecem nas telas e na ordenação das tabelas. */
export const TAMANHOS = ["PP", "P", "M", "G", "GG"] as const;

/** Status de um pedido, na ordem do fluxo. */
export const STATUS_DE_PEDIDO = [
  "Pedido simulado",
  "Em separação",
  "Enviado",
  "Entregue",
  "Cancelado",
] as const;

/** As etapas que a linha do tempo do pedido mostra (o cancelado fica de fora). */
export const ETAPAS_DO_PEDIDO = STATUS_DE_PEDIDO.slice(0, 4);

/** Um pedido nesses status ainda pode ser cancelado pelo cliente. */
export const CANCELAVEL = ["Pedido simulado", "Em separação"];

/** Status de uma solicitação de troca ou devolução. */
export const STATUS_DE_TROCA = ["Solicitada", "Em análise", "Aprovada", "Recusada", "Concluída"];

/** Pedidos nesses status já terminaram (não estão "em andamento"). */
export const FINALIZADO = ["Entregue", "Cancelado"];
