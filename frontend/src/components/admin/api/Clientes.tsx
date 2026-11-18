import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  painel,
  todasAsPaginas,
  type ClienteDaApi,
  type PaginaDaApi,
  type PedidoDaApi,
} from "@/lib/api/painel";
import { money } from "@/lib/checkout";
import { STATUS_DA_API } from "@/lib/dominio";
import { AdminRow, AdminTable } from "../AdminTable";
import { Estado, Janela } from "./comum";
import { dataHora } from "./formato";

/** Clientes: a lista (GET /customers, só leitura) e os pedidos de cada um. */
export function Clientes() {
  const lista = useQuery({
    queryKey: ["painel", "clientes"],
    queryFn: () => todasAsPaginas<ClienteDaApi>("/customers"),
  });
  const [aberto, setAberto] = useState<ClienteDaApi | null>(null);
  return (
    <>
      <Estado carregando={lista.isPending} erro={lista.error} />
      {lista.data && (
        <AdminTable
          exportName="clientes"
          headers={["Nome", "E-mail", "Telefone", "Desde", "Detalhes"]}
        >
          {lista.data.map((c) => (
            <AdminRow key={c.id} values={[c.nome, c.email, c.telefone, c.criadoEm]}>
              <td>{c.nome}</td>
              <td>{c.email}</td>
              <td>{c.telefone}</td>
              <td>{dataHora(c.criadoEm)}</td>
              <td>
                <Button size="sm" variant="outline" onClick={() => setAberto(c)}>
                  PEDIDOS
                </Button>
              </td>
            </AdminRow>
          ))}
        </AdminTable>
      )}
      <Janela titulo="PEDIDOS DO CLIENTE" aberta={!!aberto} fechar={() => setAberto(null)}>
        {aberto && <PedidosDoCliente cliente={aberto} />}
      </Janela>
    </>
  );
}

function PedidosDoCliente({ cliente }: { cliente: ClienteDaApi }) {
  const pedidos = useQuery({
    queryKey: ["painel", "pedidos-do-cliente", cliente.id],
    queryFn: () =>
      painel<PaginaDaApi<PedidoDaApi>>("GET", `/customers/${cliente.id}/orders?tamanho=100`),
  });
  return (
    <>
      <p className="text-sm">
        {cliente.nome} · {cliente.email} · {cliente.telefone}
      </p>
      <Estado carregando={pedidos.isPending} erro={pedidos.error} />
      {pedidos.data && !pedidos.data.itens.length && (
        <p className="text-sm">Nenhum pedido ainda.</p>
      )}
      <ul className="divide-y divide-border text-sm">
        {(pedidos.data?.itens ?? []).map((p) => (
          <li key={p.id} className="flex justify-between gap-3 py-2">
            <Link
              to="/admin/pedidos/$id"
              params={{ id: p.id }}
              className="font-mono text-xs underline"
            >
              {p.id.slice(0, 8)}
            </Link>
            <span>{dataHora(p.criadoEm)}</span>
            <span>{STATUS_DA_API[p.status] ?? p.status}</span>
            <span>{money(Number(p.total))}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
