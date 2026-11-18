import { useQuery } from "@tanstack/react-query";
import { painel, type ResumoDaApi } from "@/lib/api/painel";
import { money } from "@/lib/checkout";
import { STATUS_DA_API } from "@/lib/dominio";
import { Estado, Numero } from "./comum";

/** Visão geral: os números de GET /painel/resumo, só das áreas do papel de quem está logado. */
export function VisaoGeral() {
  const resumo = useQuery({
    queryKey: ["painel", "resumo"],
    queryFn: () => painel<ResumoDaApi>("GET", "/painel/resumo"),
  });
  const r = resumo.data;
  return (
    <>
      <Estado carregando={resumo.isPending} erro={resumo.error} />
      {r && (
        <div className="space-y-8">
          {r.pedidos && (
            <section>
              <h2 className="mb-4 text-2xl">VENDAS</h2>
              <div className="grid gap-px border border-ink/10 bg-ink/10 sm:grid-cols-3">
                <Numero rotulo="VENDAS DO MÊS" valor={money(Number(r.pedidos.vendasDoMes))} />
                <Numero rotulo="PEDIDOS PAGOS NO MÊS" valor={r.pedidos.pedidosDoMes} />
                <Numero
                  rotulo="AGUARDANDO ENVIO"
                  valor={
                    (r.pedidos.porStatus["PAGO"] ?? 0) + (r.pedidos.porStatus["EM_SEPARACAO"] ?? 0)
                  }
                />
              </div>
              <div className="mt-px grid gap-px border border-ink/10 bg-ink/10 sm:grid-cols-4">
                {Object.entries(r.pedidos.porStatus).map(([status, total]) => (
                  <Numero
                    key={status}
                    rotulo={(
                      STATUS_DA_API[status as keyof typeof STATUS_DA_API] ?? status
                    ).toUpperCase()}
                    valor={total}
                  />
                ))}
              </div>
            </section>
          )}
          {(r.catalogo || r.estoque) && (
            <section>
              <h2 className="mb-4 text-2xl">CATÁLOGO E ESTOQUE</h2>
              <div className="grid gap-px border border-ink/10 bg-ink/10 sm:grid-cols-3">
                {r.catalogo && <Numero rotulo="PRODUTOS NA LOJA" valor={r.catalogo.ativos} />}
                {r.catalogo && <Numero rotulo="PRODUTOS INATIVOS" valor={r.catalogo.inativos} />}
                {r.estoque && (
                  <Numero
                    rotulo={`VARIANTES COM ATÉ ${r.estoque.limite} UN.`}
                    valor={r.estoque.variantesComEstoqueBaixo}
                  />
                )}
              </div>
            </section>
          )}
          {r.clientes && (
            <section>
              <h2 className="mb-4 text-2xl">CLIENTES</h2>
              <div className="grid gap-px border border-ink/10 bg-ink/10 sm:grid-cols-2">
                <Numero rotulo="CLIENTES CADASTRADOS" valor={r.clientes.total} />
                <Numero rotulo="MENSAGENS NOVAS" valor={r.clientes.mensagensNovas} />
              </div>
            </section>
          )}
          {!r.pedidos && !r.catalogo && !r.estoque && !r.clientes && (
            <p className="text-sm">O seu papel ainda não tem nenhuma permissão.</p>
          )}
        </div>
      )}
    </>
  );
}
