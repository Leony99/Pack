import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import manga from "@/assets/product-longsleeve.jpg";
import { CardAviso, PaginaTopo, ROTULO } from "@/components/layout/PaginaTopo";
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
    <main className="min-h-[70svh]">
      <PaginaTopo
        caminho={kind === "staff" ? "PACK / ACESSO DE COLABORADORES" : "PACK / ÁREA DO CLIENTE"}
        titulo={kind === "staff" ? "PAINEL PACK" : mode === "login" ? "ENTRAR" : "CRIAR CONTA"}
        imagem={manga}
        texto="Ambiente demonstrativo — sem autenticação real. Não use sua senha pessoal. Contas e alterações são apagadas ao recarregar."
        lado={
          <>
            <CardAviso rotulo="PEDIDOS" valor="HISTÓRICO" texto="acompanhe as suas compras" />
            <CardAviso escuro rotulo="AMBIENTE" valor="DEMO" texto="sem cobranças ou envios" />
          </>
        }
      />
      <div className="px-4 py-10 md:px-6 md:py-14">
        <div className="mx-auto max-w-md border border-ink/10 p-6 md:p-8">
          <p className={`${ROTULO} mb-6 flex items-center gap-2`}>
            <span className="h-1.5 w-1.5 bg-destaque" />{" "}
            {kind === "staff"
              ? "[ COLABORADOR ]"
              : mode === "login"
                ? "[ JÁ TENHO CONTA ]"
                : "[ NOVA CONTA ]"}
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
            <Button
              disabled={busy}
              className="h-12 w-full rounded-none text-[11px] tracking-[0.2em]"
            >
              {busy ? "AGUARDE..." : mode === "signup" ? "CRIAR CONTA" : "ENTRAR"}
              <ArrowRight />
            </Button>
          </form>
          <Button
            variant="outline"
            disabled={busy}
            className="mt-3 h-12 w-full rounded-none text-[11px] tracking-[0.2em]"
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
        </div>
      </div>
    </main>
  );
}
