import { pageHead } from "@/lib/metadata";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/layout/PageLayout";

export const Route = createFileRoute("/politicas/privacidade")({
  head: () =>
    pageHead(
      "Política de privacidade",
      "Saiba como a PACK apresenta o tratamento e a proteção de dados pessoais.",
    ),
  component: Page,
});

function Page() {
  return (
    <PageLayout title="PRIVACIDADE" eyebrow="POLÍTICAS / PRIVACIDADE">
      <div>
        <div className="mx-auto max-w-3xl space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p>
            Respeitamos sua privacidade. Coletamos apenas os dados necessários para processar
            pedidos, entregar produtos e melhorar sua experiência.
          </p>
          <div>
            <p className="mb-2 font-medium text-foreground">Dados coletados</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Nome, email e telefone para contato e envio.</li>
              <li>Endereço para entrega.</li>
              <li>Dados de pagamento processados por parceiros certificados PCI-DSS.</li>
              <li>Dados de navegação (cookies) para melhorar a loja.</li>
            </ul>
          </div>
          <div>
            <p className="mb-2 font-medium text-foreground">Seus direitos</p>
            <p>
              Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento em{" "}
              <strong className="text-foreground">privacidade@pack.com</strong>.
            </p>
          </div>
          <p>
            Nunca vendemos ou compartilhamos seus dados com terceiros para fins publicitários. Em
            conformidade com a LGPD (Lei 13.709/2018).
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
