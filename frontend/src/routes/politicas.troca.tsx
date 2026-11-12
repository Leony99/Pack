import { pageHead } from "@/lib/metadata";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/layout/PageLayout";

export const Route = createFileRoute("/politicas/troca")({
  head: () =>
    pageHead(
      "Política de troca",
      "Consulte as condições apresentadas para trocas e devoluções PACK.",
    ),
  component: Page,
});

function Page() {
  return (
    <PageLayout title="TROCA" eyebrow="POLÍTICAS / TROCA">
      <div>
        <div className="mx-auto max-w-3xl space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p>
            Você tem <strong className="text-foreground">30 dias</strong> a partir do recebimento
            para solicitar troca ou devolução. A peça deve estar sem uso, com etiquetas originais e
            na embalagem.
          </p>
          <div>
            <p className="mb-2 font-medium text-foreground">Como solicitar</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Envie um email para trocas@pack.com com o número do pedido.</li>
              <li>Nossa equipe responde em até 24h com o código de postagem.</li>
              <li>
                Após recebermos a peça, o reembolso ou nova peça é processado em até 7 dias úteis.
              </li>
            </ol>
          </div>
          <p>
            Primeira troca por defeito ou tamanho errado é{" "}
            <strong className="text-foreground">gratuita</strong>. Trocas adicionais têm custo de
            envio por conta do cliente.
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
