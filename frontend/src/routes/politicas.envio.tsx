import { pageHead } from "@/lib/metadata";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/layout/PageLayout";

export const Route = createFileRoute("/politicas/envio")({
  head: () =>
    pageHead("Política de envio", "Consulte informações sobre entrega e prazos de envio PACK."),
  component: Page,
});

function Page() {
  return (
    <PageLayout title="ENVIO" eyebrow="POLÍTICAS / ENVIO">
      <div>
        <div className="mx-auto max-w-3xl space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p>
            Enviamos para todo o Brasil via Correios e transportadoras parceiras. O prazo começa a
            contar após a confirmação do pagamento.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { r: "Sudeste", p: "2–5 dias úteis" },
              { r: "Sul / Centro-Oeste", p: "4–7 dias úteis" },
              { r: "Norte / Nordeste", p: "6–12 dias úteis" },
            ].map((x) => (
              <div key={x.r} className="border border-border p-5">
                <p className="text-xs tracking-[0.3em] text-muted-foreground">
                  {x.r.toUpperCase()}
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">{x.p}</p>
              </div>
            ))}
          </div>
          <p>
            <strong className="text-foreground">Frete grátis</strong> para pedidos acima de R$ 200
            em todo o país. Todos os pedidos incluem código de rastreio.
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
