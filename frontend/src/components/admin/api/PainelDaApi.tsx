import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { canStaff } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { AdminView } from "../tipos";
import { Atendimento } from "./Atendimento";
import { Clientes } from "./Clientes";
import { Colecoes } from "./Colecoes";
import { Cupons } from "./Cupons";
import { Equipe } from "./Equipe";
import { Estoque } from "./Estoque";
import { Newsletter } from "./Newsletter";
import { DetalheDoPedido, Pedidos } from "./Pedidos";
import { Produtos } from "./Produtos";
import type { Run } from "./comum";
import { VisaoGeral } from "./VisaoGeral";

const TITULOS: Record<AdminView, string> = {
  overview: "PAINEL PACK",
  products: "PRODUTOS",
  collections: "COLEÇÕES",
  stock: "ESTOQUE",
  orders: "PEDIDOS",
  coupons: "CUPONS",
  customers: "CLIENTES",
  staff: "COLABORADORES",
  messages: "ATENDIMENTO",
  subscribers: "NEWSLETTER",
  returns: "TROCAS E DEVOLUÇÕES",
};

/**
 * O painel com a Pack API. Cada aba busca os próprios dados na API (pela ponte de painel-api.ts, com o
 * token da equipe) e só aparece para quem tem a permissão dela. Toda alteração passa por run(): ela
 * mostra o resultado no topo e atualiza os dados do painel e da loja.
 */
export function PainelDaApi({ view, orderId }: { view: AdminView; orderId?: string }) {
  const { staff } = useSession();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const run: Run = async (acao, sucesso) => {
    setBusy(true);
    setErro("");
    setMensagem("");
    try {
      await acao();
      await Promise.all(
        ["painel", "products", "collections", "order", "account"].map((chave) =>
          queryClient.invalidateQueries({ queryKey: [chave] }),
        ),
      );
      setMensagem(sucesso);
      return true;
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível concluir.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const permitido = !!staff && (view === "overview" || canStaff(staff, view));
  const props = { busy, run };

  function tela() {
    switch (view) {
      case "overview":
        return <VisaoGeral />;
      case "products":
        return <Produtos {...props} />;
      case "collections":
        return <Colecoes {...props} />;
      case "stock":
        return <Estoque {...props} />;
      case "orders":
        return orderId ? <DetalheDoPedido {...props} id={orderId} /> : <Pedidos />;
      case "coupons":
        return <Cupons {...props} />;
      case "customers":
        return <Clientes />;
      case "staff":
        return <Equipe {...props} />;
      case "messages":
        return <Atendimento {...props} />;
      case "subscribers":
        return <Newsletter {...props} />;
      default:
        return (
          <p className="py-10 text-sm">
            Trocas e devoluções são pedidas pelo formulário de Contato e chegam em Atendimento.
          </p>
        );
    }
  }

  return (
    <DashboardLayout kind="staff" title={TITULOS[view]}>
      {erro && (
        <p role="alert" className="mb-5 bg-secondary p-4 text-sm">
          {erro}
        </p>
      )}
      {mensagem && (
        <p role="status" className="mb-5 bg-secondary p-4 text-sm">
          {mensagem}
        </p>
      )}
      {!permitido && staff && (
        <p className="py-10 text-sm">O seu papel não tem acesso a esta parte do painel.</p>
      )}
      {permitido && tela()}
    </DashboardLayout>
  );
}
