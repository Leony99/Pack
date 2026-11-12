import { Link, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaginaTopo } from "./PaginaTopo";
export function NotFoundPage() {
  return (
    <main className="min-h-[65svh]">
      <PaginaTopo
        caminho="PACK / PÁGINA NÃO ENCONTRADA"
        titulo="404"
        texto="Fora do caminho. A página que você procura não existe ou não está mais disponível."
      />
      <div className="flex flex-col items-start px-4 py-10 md:px-6">
        <Button asChild className="h-12 rounded-none text-[11px] tracking-[0.2em]">
          <Link to="/catalogo">
            VOLTAR AO CATÁLOGO <ArrowRight />
          </Link>
        </Button>
        <Link to="/" className="mt-4 text-sm underline">
          Página inicial
        </Link>
      </div>
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
