import type { getAccountData } from "@/lib/api";

export type AccountView = "overview" | "orders" | "addresses" | "profile" | "order";

/** O que a área do cliente carrega: dados, pedidos, endereços e trocas. */
export type AccountData = Awaited<ReturnType<typeof getAccountData>>;

/** Executa uma ação, atualiza os dados da tela e mostra a mensagem de sucesso (ou o erro). */
export type RunAction = (action: () => Promise<unknown>, success: string) => Promise<void>;

/** O que toda tela da conta recebe do AccountPanel. */
export type AccountScreenProps = { data: AccountData; busy: boolean; run: RunAction };
