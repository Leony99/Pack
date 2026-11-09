import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LockKeyhole, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/common/FormField";
import { enterDemo, loginCustomer, registerCustomer, loginStaff } from "@/lib/api";
import { useSession } from "@/lib/session";

/**
 * Login do cliente (com a opção de criar conta) ou do colaborador. Entrando, vai para a área da conta
 * ou para o painel. "ACESSAR DEMONSTRAÇÃO" entra com o usuário de exemplo, sem senha.
 */
export function AuthForm({ kind }: { kind: "customer" | "staff" }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { refresh } = useSession();
  async function complete(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      await refresh();
      await navigate({ to: kind === "customer" ? "/conta" : "/admin/painel" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const campos = new FormData(e.currentTarget);
    const email = String(campos.get("email"));
    const password = String(campos.get("password"));
    await complete(() => {
      if (kind === "staff") return loginStaff(email, password);
      if (mode === "signup")
        return registerCustomer({ name: String(campos.get("name")), email, password });
      return loginCustomer(email, password);
    });
  }
  return (
    <main className="mx-auto min-h-[70svh] max-w-md px-6 py-16">
      <p className="mb-5 text-xs text-muted-foreground">
        PACK / {kind === "staff" ? "ACESSO DE COLABORADORES" : "CONTA"}
      </p>
      {kind === "staff" && <LockKeyhole className="mb-4" />}
      <h1 className="text-5xl">
        {kind === "staff" ? "PAINEL PACK" : mode === "login" ? "ENTRAR" : "CRIAR CONTA"}
      </h1>
      <p className="my-6 border-y border-border py-4 text-xs leading-6">
        AMBIENTE DEMONSTRATIVO — sem autenticação real. Não use sua senha pessoal. Contas e
        alterações são apagadas ao recarregar.
      </p>
      <form onSubmit={submit} className="space-y-5">
        {mode === "signup" && kind === "customer" && (
          <FormField label="Nome completo" name="name" autoComplete="name" required />
        )}
        <FormField label="E-mail" name="email" type="email" autoComplete="email" required />
        <FormField
          label="Senha de demonstração"
          name="password"
          type="password"
          autoComplete="off"
          minLength={mode === "signup" ? 6 : 1}
          required
        />
        {error && (
          <p role="alert" className="text-sm">
            {error}
          </p>
        )}
        <Button disabled={busy} className="h-12 w-full rounded-none">
          {busy ? "AGUARDE..." : mode === "signup" ? "CRIAR CONTA" : "ENTRAR"}
          <ArrowRight />
        </Button>
      </form>
      <Button
        variant="outline"
        disabled={busy}
        className="mt-4 h-12 w-full rounded-none"
        onClick={() => void complete(() => enterDemo(kind))}
      >
        ACESSAR DEMONSTRAÇÃO
      </Button>
      {kind === "customer" && (
        <div className="mt-6 flex justify-between text-xs">
          <Button
            variant="link"
            className="px-0"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Criar conta" : "Já tenho conta"}
          </Button>
          <Button variant="link" asChild className="px-0">
            <Link to="/login/recuperar">Esqueci minha senha</Link>
          </Button>
        </div>
      )}
    </main>
  );
}
