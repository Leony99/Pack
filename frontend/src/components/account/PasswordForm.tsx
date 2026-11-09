import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { PageLayout } from "@/components/layout/PageLayout";
import { FormField } from "@/components/common/FormField";
import { Button } from "@/components/ui/button";
import { recoverPassword, resetPassword } from "@/lib/api";

/**
 * Recuperação de senha em duas telas: pedir o link por e-mail (/login/recuperar) e definir a nova
 * senha com o token do link (/login/redefinir, com reset=true). Na demonstração, nada é enviado.
 */
export function PasswordForm({ reset = false, token = "" }: { reset?: boolean; token?: string }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const campos = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      if (reset) {
        if (campos.get("password") !== campos.get("confirm"))
          throw new Error("As senhas não coincidem.");
        await resetPassword(String(campos.get("password")), token);
        setMessage("Redefinição simulada. Nenhuma senha real foi alterada.");
      } else {
        await recoverPassword(String(campos.get("email")));
        setMessage("Solicitação simulada. Nenhum e-mail foi enviado.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageLayout title={reset ? "NOVA SENHA" : "RECUPERAR SENHA"} eyebrow="CONTA">
      <form className="max-w-md space-y-5" onSubmit={enviar}>
        <p className="text-xs text-muted-foreground">
          AMBIENTE DEMONSTRATIVO — não use uma senha pessoal.
        </p>
        {reset ? (
          <>
            <FormField
              label="Nova senha de demonstração"
              name="password"
              type="password"
              minLength={6}
              required
              autoComplete="off"
            />
            <FormField
              label="Confirmar senha"
              name="confirm"
              type="password"
              minLength={6}
              required
              autoComplete="off"
            />
          </>
        ) : (
          <FormField label="E-mail" name="email" type="email" required />
        )}
        {error && (
          <p role="alert" className="text-sm">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
        <Button disabled={busy}>
          {busy ? "AGUARDE..." : reset ? "REDEFINIR SENHA" : "ENVIAR SOLICITAÇÃO"}
        </Button>
        {message && !reset && (
          <Button asChild variant="outline">
            <Link to="/login/redefinir" search={{ token: "demo" }}>
              VER REDEFINIÇÃO DEMONSTRATIVA
            </Link>
          </Button>
        )}
        <Button asChild variant="link">
          <Link to="/login">VOLTAR AO LOGIN</Link>
        </Button>
      </form>
    </PageLayout>
  );
}
