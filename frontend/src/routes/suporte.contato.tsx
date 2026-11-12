import { pageHead } from "@/lib/metadata";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { sendContact } from "@/lib/api";
import hero from "@/assets/hero.jpg";
import { PageLayout } from "@/components/layout/PageLayout";
import { CardAviso, ROTULO } from "@/components/layout/PaginaTopo";
import { FormField } from "@/components/common/FormField";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/suporte/contato")({
  head: () =>
    pageHead(
      "Contato",
      "Encontre os canais de atendimento PACK para dúvidas sobre pedidos e peças.",
    ),
  component: Contato,
});

function Contato() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  return (
    <PageLayout
      title="CONTATO"
      eyebrow="SUPORTE / CONTATO"
      imagem={hero}
      texto="Fale com a PACK sobre pedidos, trocas e peças. Atendimento demonstrativo — nenhum e-mail é enviado."
      lado={
        <>
          <CardAviso rotulo="ASSUNTOS" valor="PEDIDOS" texto="trocas e dúvidas sobre peças" />
          <CardAviso
            escuro
            rotulo="ANTES DE ESCREVER"
            valor="FAQ"
            texto="as dúvidas mais comuns"
            to="/suporte/faq"
          />
        </>
      }
    >
      <form
        className="mx-auto max-w-2xl space-y-5 border border-ink/10 p-6 md:p-10"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const f = new FormData(form);
          setBusy(true);
          setError("");
          setMessage("");
          try {
            await sendContact({
              name: String(f.get("name")),
              email: String(f.get("email")),
              message: String(f.get("message")),
            });
            setMessage("Mensagem registrada na demonstração. Nenhum envio real foi realizado.");
            form.reset();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Não foi possível enviar.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className={`${ROTULO} flex items-center gap-2`}>
          <span className="h-1.5 w-1.5 bg-destaque" /> [ MENSAGEM ]
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Nome" name="name" required />
          <FormField label="E-mail" name="email" type="email" required />
        </div>
        <label className="block">
          <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
            Mensagem
          </span>
          <textarea
            name="message"
            required
            rows={5}
            className="w-full border border-input bg-background p-3 text-sm outline-none focus:border-foreground"
          />
        </label>
        <label className="flex items-start gap-3 text-xs">
          <input type="checkbox" required />
          <span>
            Concordo com o uso dos dados para atendimento conforme a política de privacidade.
          </span>
        </label>
        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm">
            {error}
          </p>
        )}
        <Button disabled={busy} className="h-12 rounded-none px-8 text-[11px] tracking-[0.2em]">
          {busy ? "ENVIANDO..." : "ENVIAR MENSAGEM"}
        </Button>
      </form>
    </PageLayout>
  );
}
