import type { AdminRecord, AdminResource, getAdminData } from "@/lib/api";

export type AdminView =
  | "overview"
  | "products"
  | "collections"
  | "stock"
  | "orders"
  | "coupons"
  | "customers"
  | "staff"
  | "messages"
  | "subscribers"
  | "returns";

/** Tudo o que o painel carrega (cada lista vem vazia se o cargo não tem acesso a ela). */
export type AdminData = Awaited<ReturnType<typeof getAdminData>>;

/** Recursos com cadastro e exclusão (pedidos e estoque têm operações próprias). */
export type EditableResource = Exclude<AdminResource, "orders" | "stock">;

/** Executa uma ação, atualiza os dados em cache e mostra a mensagem de sucesso (ou o erro). */
export type RunAction = (action: () => Promise<unknown>, success?: string) => Promise<void>;

/** O que toda tela do painel recebe do AdminPanel. */
export type AdminScreenProps = {
  data: AdminData;
  busy: boolean;
  run: RunAction;
  /** Abre a janela de edição com o registro. */
  edit: (record: AdminRecord) => void;
  /** Pede confirmação e exclui o registro. */
  remove: (resource: EditableResource, id: string) => void;
};
