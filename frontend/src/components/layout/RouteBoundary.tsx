import { Link, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[65svh] max-w-[1400px] flex-col items-start justify-center px-6 py-16">
      <p className="text-xs text-muted-foreground">PACK / PÁGINA NÃO ENCONTRADA</p>
      <h1 className="mt-6 font-display text-8xl md:text-9xl">404</h1>
      <h2 className="mt-4 font-display text-3xl">FORA DO CAMINHO.</h2>
      <p className="mt-4 max-w-md text-sm text-muted-foreground">
        A página que você procura não existe ou não está mais disponível.
      </p>
      <Button asChild className="mt-8 h-12">
        <Link to="/catalogo">
          VOLTAR AO CATÁLOGO <ArrowRight />
        </Link>
      </Button>
      <Link to="/" className="mt-4 text-sm underline">
        Página inicial
      </Link>
    </main>
  );
}
export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <main className="mx-auto min-h-[60svh] max-w-[1400px] px-6 py-16">
      <h1 className="font-display text-4xl">NÃO FOI POSSÍVEL CARREGAR.</h1>
      <p role="alert" className="mt-4 text-sm text-muted-foreground">
        {error instanceof Error ? error.message : "Tente novamente em instantes."}
      </p>
      <Button
        className="mt-6"
        onClick={async () => {
          await router.invalidate();
          reset();
        }}
      >
        <RotateCcw /> Tentar novamente
      </Button>
    </main>
  );
}
