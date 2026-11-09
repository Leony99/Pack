import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  canStaff,
  deleteAdminRecord,
  getAdminData,
  saveAdminRecord,
  type AdminRecord,
} from "@/lib/api";
import { useSession } from "@/lib/session";
import { RecordForm } from "./formularios/RecordForm";
import { NOVO, newRecord } from "./novoRegistro";
import { CollectionsScreen } from "./telas/CollectionsScreen";
import { CouponsScreen } from "./telas/CouponsScreen";
import { CustomerDetails, CustomersScreen } from "./telas/CustomersScreen";
import { MessagesScreen } from "./telas/MessagesScreen";
import { OrderEditor, OrdersScreen } from "./telas/OrdersScreen";
import { OverviewScreen } from "./telas/OverviewScreen";
import { ProductsScreen } from "./telas/ProductsScreen";
import { ReturnsScreen } from "./telas/ReturnsScreen";
import { StaffScreen } from "./telas/StaffScreen";
import { StockScreen } from "./telas/StockScreen";
import { SubscribersScreen } from "./telas/SubscribersScreen";
import type { AdminScreenProps, AdminView, EditableResource, RunAction } from "./tipos";

const titles: Record<AdminView, string> = {
  overview: "PAINEL PACK",
  products: "PRODUTOS",
  collections: "COLEÇÕES E TAGS",
  stock: "ESTOQUE",
  orders: "PEDIDOS",
  coupons: "CUPONS",
  customers: "CLIENTES",
  staff: "COLABORADORES",
  messages: "ATENDIMENTO",
  subscribers: "NEWSLETTER",
  returns: "TROCAS E DEVOLUÇÕES",
};

/** Telas que são só uma tabela (as outras recebem algo a mais ou têm tratamento próprio). */
const TABELAS = {
  products: ProductsScreen,
  collections: CollectionsScreen,
  stock: StockScreen,
  coupons: CouponsScreen,
  customers: CustomersScreen,
  staff: StaffScreen,
  messages: MessagesScreen,
  subscribers: SubscribersScreen,
  returns: ReturnsScreen,
} as const;

/**
 * Painel administrativo. Carrega os dados do painel e mostra a tela pedida pela rota, se o cargo
 * do colaborador tiver acesso a ela. Toda alteração passa por run(), que atualiza os caches das
 * telas afetadas (painel, catálogo, conta e pedidos) e mostra o resultado no topo.
 */
export function AdminPanel({ view, orderId }: { view: AdminView; orderId?: string }) {
  const { staff } = useSession();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", staff?.id, staff?.role],
    queryFn: getAdminData,
    enabled: !!staff,
  });
  const [editing, setEditing] = useState<AdminRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const data = query.data;

  const run: RunAction = async (action, success = "Alteração salva na demonstração.") => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      await Promise.all(
        ["admin", "products", "account", "my-order", "collections", "order"].map((chave) =>
          queryClient.invalidateQueries({ queryKey: [chave] }),
        ),
      );
      setMessage(success);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setBusy(false);
    }
  };

  function remove(resource: EditableResource, id: string) {
    if (window.confirm("Excluir este registro da demonstração?"))
      void run(() => deleteAdminRecord(resource, id), "Registro excluído.");
  }

  const allowed = !!staff && (view === "overview" || canStaff(staff.role, view));
  const novo = !orderId ? NOVO[view] : undefined;

  function conteudo(props: AdminScreenProps) {
    if (view === "overview") return <OverviewScreen data={props.data} />;
    if (view === "orders")
      return orderId ? <OrderEditor {...props} orderId={orderId} /> : <OrdersScreen {...props} />;
    const Tela = TABELAS[view];
    return <Tela {...props} />;
  }

  return (
    <DashboardLayout kind="staff" title={titles[view]}>
      {(error || query.error) && (
        <p role="alert" className="mb-5 bg-secondary p-4 text-sm">
          {error || String(query.error)}
        </p>
      )}
      {message && (
        <p role="status" className="mb-5 bg-secondary p-4 text-sm">
          {message}
        </p>
      )}
      {!allowed && staff && (
        <p className="py-10 text-sm">Este cargo não tem acesso a esta seção na demonstração.</p>
      )}
      {query.isPending && staff && <p role="status">Carregando painel...</p>}
      {data && allowed && (
        <>
          {view !== "overview" && novo && (
            <div className="mb-6 flex justify-end">
              <Button
                className="h-11 rounded-none"
                onClick={() => {
                  setError("");
                  setEditing(newRecord(view, data));
                }}
              >
                <Plus /> NOVO {novo}
              </Button>
            </div>
          )}
          {conteudo({ data, busy, run, edit: setEditing, remove })}
          <Dialog
            open={!!editing}
            onOpenChange={(open) => {
              if (!open) setEditing(null);
            }}
          >
            <DialogContent className="max-h-[85svh] overflow-y-auto rounded-none sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">
                  {view === "customers" ? "DETALHES DO CLIENTE" : "EDITAR " + titles[view]}
                </DialogTitle>
                <DialogDescription>
                  Dados de demonstração. As alterações não são persistidas.
                </DialogDescription>
              </DialogHeader>
              {error && (
                <p role="alert" className="text-sm">
                  {error}
                </p>
              )}
              {editing && view === "customers" && "email" in editing && (
                <CustomerDetails
                  customer={editing}
                  orders={data.orders}
                  onClose={() => setEditing(null)}
                />
              )}
              {editing && view !== "customers" && (
                <RecordForm
                  view={view}
                  record={editing}
                  collections={data.collections}
                  products={data.products}
                  busy={busy}
                  onSave={(record) =>
                    void run(async () => {
                      await saveAdminRecord(view as EditableResource, record);
                      setEditing(null);
                    })
                  }
                />
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </DashboardLayout>
  );
}
