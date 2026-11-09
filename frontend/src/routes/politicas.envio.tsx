import { pageHead } from "@/lib/metadata";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/politicas/envio")({
  head: () =>
    pageHead("Política de envio", "Consulte informações sobre entrega e prazos de envio PACK."),
  component: Page,
});

function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-xs font-medium tracking-[0.3em] text-muted-foreground">POLÍTICAS</p>
        <h1 className="mt-4 font-display text-5xl md:text-7xl leading-none">ENVIO</h1>
        <div className="mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground">
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
            <strong className="text-foreground">Frete grátis</strong> para pedidos acima de R$ 350
            em todo o país. Todos os pedidos incluem código de rastreio.
          </p>
        </div>
      </div>
    </div>
  );
}
