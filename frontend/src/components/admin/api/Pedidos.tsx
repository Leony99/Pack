import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { selectClass } from "@/components/common/classes";
import { FormField } from "@/components/common/FormField";
import { OrderDetail } from "@/components/order/OrderDetail";
import { Button } from "@/components/ui/button";
import { pedidoDaApi } from "@/lib/api/adaptadores";
import { painel, todasAsPaginas, type PedidoDaApi } from "@/lib/api/painel";
import { money } from "@/lib/checkout";
import { STATUS_DA_API } from "@/lib/dominio";
import { AdminRow, AdminTable } from "../AdminTable";
import { Estado, type PropsDaAba } from "./comum";
import { dataHora } from "./formato";

const rotulo = (s: string) => STATUS_DA_API[s as keyof typeof STATUS_DA_API] ?? s;

/** Pedidos: todos os pedidos da loja (GET /orders), com busca, filtro por status e exportação. */
export function Pedidos() {
  const lista = useQuery({
    queryKey: ["painel", "pedidos"],
    queryFn: () => todasAsPaginas<PedidoDaApi>("/orders"),
  });
  return (
    <>
      <Estado carregando={lista.isPending} erro={lista.error} />
      {lista.data && (
        <AdminTable
          exportName="pedidos"
          filters={[{ key: "status", label: "Status", options: Object.values(STATUS_DA_API) }]}
          headers={["Pedido", "Data", "Cliente", "Total", "Status", "Detalhes"]}
        >
          {lista.data.map((p) => (
            <AdminRow
              key={p.id}
              values={[p.id, p.criadoEm, p.customer.nome, Number(p.total), rotulo(p.status)]}
              filters={{ status: rotulo(p.status) }}
            >
              <td className="font-mono text-xs">{p.id.slice(0, 8)}</td>
              <td>{dataHora(p.criadoEm)}</td>
              <td>
                {p.customer.nome}
                <br />
                <span className="text-xs text-muted-foreground">{p.customer.email}</span>
              </td>
              <td>{money(Number(p.total))}</td>
              <td>{rotulo(p.status)}</td>
              <td>
                <Link to="/admin/pedidos/$id" params={{ id: p.id }} className="text-xs underline">
                  ABRIR
                </Link>
              </td>
            </AdminRow>
          ))}
        </AdminTable>
      )}
    </>
  );
}

type Pagamento = { id: string; metodo: string; status: string; valor: number };
type Envio = { id: string; transportadora: string; codigoRastreio: string | null; status: string };

/**
 * Um pedido no painel: o detalhe (o mesmo da área do cliente) e o que a equipe faz com ele, na ordem
 * do fluxo da API: registrar e aprovar o pagamento, criar o envio, despachar, entregar ou devolver, e
 * cancelar (antes do envio).
 */
export function DetalheDoPedido({ id, busy, run }: PropsDaAba & { id: string }) {
  const consulta = useQuery({
    queryKey: ["painel", "pedido", id],
    queryFn: () => painel<PedidoDaApi>("GET", `/orders/${id}`),
  });
  const [transportadora, setTransportadora] = useState("Correios");
  const [rastreio, setRastreio] = useState("");
  const p = consulta.data;
  const pagamento = p?.payment as Pagamento | null | undefined;
  const envio = p?.shipment as Envio | null | undefined;

  return (
    <>
      <Link to="/admin/pedidos" className="mb-6 inline-flex items-center gap-2 text-xs underline">
        <ArrowLeft className="h-4 w-4" /> TODOS OS PEDIDOS
      </Link>
      <Estado carregando={consulta.isPending} erro={consulta.error} />
      {p && (
        <>
          <OrderDetail order={pedidoDaApi(p)} />
          <section className="mt-10 grid gap-8 border-t border-border pt-8 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-xl">PAGAMENTO</h3>
              {!pagamento && p.status === "AGUARDANDO_PAGAMENTO" && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void run(
                      () =>
                        painel("POST", `/orders/${id}/payment`, {
                          metodo: "OUTRO",
                          valor: Number(p.total),
                        }),
                      "Pagamento recebido por fora registrado. Aprove-o para o pedido ficar pago.",
                    )
                  }
                >
                  REGISTRAR PAGAMENTO RECEBIDO POR FORA
                </Button>
              )}
              {pagamento && (
                <p className="mb-3 text-sm">
                  {pagamento.metodo} · {pagamento.status} · {money(Number(pagamento.valor))}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {pagamento?.status === "PENDENTE" &&
                  (["APROVADO", "RECUSADO"] as const).map((s) => (
                    <Button
                      key={s}
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        void run(
                          () => painel("PATCH", `/payments/${pagamento.id}/status?status=${s}`),
                          `Pagamento ${s.toLowerCase()}.`,
                        )
                      }
                    >
                      {s === "APROVADO" ? "APROVAR" : "RECUSAR"}
                    </Button>
                  ))}
                {pagamento?.status === "APROVADO" && !envio && (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Estornar o pagamento? O pedido é cancelado e o estoque volta.",
                        )
                      )
                        void run(
                          () =>
                            painel("PATCH", `/payments/${pagamento.id}/status?status=ESTORNADO`),
                          "Pagamento estornado e pedido cancelado.",
                        );
                    }}
                  >
                    ESTORNAR
                  </Button>
                )}
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-xl">ENVIO</h3>
              {!envio && p.status === "PAGO" && (
                <div className="flex flex-wrap items-end gap-3">
                  <FormField
                    label="Transportadora"
                    value={transportadora}
                    maxLength={50}
                    onChange={(e) => setTransportadora(e.target.value)}
                  />
                  <Button
                    disabled={busy || !transportadora.trim()}
                    onClick={() =>
                      void run(
                        () => painel("POST", `/orders/${id}/shipment`, { transportadora }),
                        "Envio criado: o pedido está em separação.",
                      )
                    }
                  >
                    CRIAR ENVIO
                  </Button>
                </div>
              )}
              {envio && (
                <>
                  <p className="mb-3 text-sm">
                    {envio.transportadora} · {envio.status}
                    {envio.codigoRastreio ? ` · ${envio.codigoRastreio}` : ""}
                  </p>
                  <div className="mb-3 flex flex-wrap items-end gap-3">
                    <FormField
                      label="Código de rastreio"
                      value={rastreio}
                      maxLength={50}
                      onChange={(e) => setRastreio(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      disabled={busy || !rastreio.trim()}
                      onClick={() =>
                        void run(
                          () =>
                            painel(
                              "PATCH",
                              `/shipments/${envio.id}/rastreio?codigo=${encodeURIComponent(rastreio.trim())}`,
                            ),
                          "Rastreio salvo.",
                        )
                      }
                    >
                      SALVAR RASTREIO
                    </Button>
                  </div>
                  <ProximoStatusDoEnvio envio={envio} busy={busy} run={run} />
                </>
              )}
            </div>
          </section>
          {["AGUARDANDO_PAGAMENTO", "PAGO", "EM_SEPARACAO"].includes(p.status) && (
            <Button
              variant="outline"
              className="mt-8"
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm("Cancelar este pedido? O estoque volta e o pagamento é acertado.")
                )
                  void run(
                    () => painel("PATCH", `/orders/${id}/status?status=CANCELADO`),
                    "Pedido cancelado.",
                  );
              }}
            >
              CANCELAR PEDIDO
            </Button>
          )}
        </>
      )}
    </>
  );
}

/** Os próximos passos do envio: PREPARANDO → DESPACHADO → ENTREGUE, ou DEVOLVIDO depois de sair. */
function ProximoStatusDoEnvio({ envio, busy, run }: PropsDaAba & { envio: Envio }) {
  const proximos: Record<string, string[]> = {
    PREPARANDO: ["DESPACHADO"],
    DESPACHADO: ["ENTREGUE", "DEVOLVIDO"],
    ENTREGUE: ["DEVOLVIDO"],
  };
  const opcoes = proximos[envio.status] ?? [];
  const [status, setStatus] = useState(opcoes[0] ?? "");
  if (!opcoes.length) return null;
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label>
        <span className="mb-2 block text-xs">Mudar o envio para</span>
        <select
          aria-label="Mudar o envio para"
          className={selectClass}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {opcoes.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </label>
      <Button
        variant="outline"
        disabled={busy}
        onClick={() => {
          if (
            status === "DEVOLVIDO" &&
            !window.confirm("Devolvido: o estoque volta e o pagamento é estornado. Confirmar?")
          )
            return;
          void run(
            () => painel("PATCH", `/shipments/${envio.id}/status?status=${status}`),
            `Envio ${status.toLowerCase()}.`,
          );
        }}
      >
        ATUALIZAR ENVIO
      </Button>
    </div>
  );
}
