import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { NewsletterForm } from "@/components/common/NewsletterForm";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/newsletter")({
  validateSearch: (search: Record<string, unknown>) => ({
    confirmed: search.confirmed === true || search.confirmed === "true",
  }),
  head: () => pageHead("Newsletter", "Novidades e próximos drops da PACK."),
  component: Newsletter,
});
function Newsletter() {
  const { confirmed } = Route.useSearch();
  const [done, setDone] = useState(confirmed);
  return (
    <PageLayout title={done ? "VOCÊ ESTÁ NO PACK." : "JOIN THE PACK"} eyebrow="NEWSLETTER">
      <div className="max-w-xl">
        {done ? (
          <>
            <Check className="mb-6 h-10 w-10" />
            <h2 className="text-2xl">INSCRIÇÃO SIMULADA CONCLUÍDA.</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Seu e-mail fica somente na memória desta demonstração e nenhuma mensagem foi enviada.
              O cadastro definitivo estará disponível após a conexão com a API.
            </p>
            <Button asChild className="mt-8 h-12">
              <Link to="/catalogo">
                EXPLORAR A COLEÇÃO <ArrowRight />
              </Link>
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Próximos drops, novidades e peças essenciais. Cadastro demonstrativo, sem envio de
              e-mails.
            </p>
            <NewsletterForm onComplete={() => setDone(true)} />
          </>
        )}
      </div>
    </PageLayout>
  );
}
