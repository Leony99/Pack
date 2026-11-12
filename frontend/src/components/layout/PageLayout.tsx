import type { ReactNode } from "react";
import { PaginaTopo } from "./PaginaTopo";

/**
 * Moldura das páginas de conteúdo (suporte, políticas, busca, carrinho, checkout...): o topo
 * escuro com o título (PaginaTopo) e, embaixo, o conteúdo em fundo branco, centralizado.
 * `eyebrow` é o caminho mostrado no rótulo ("SUPORTE / FAQ"); `texto`, `imagem` e `lado` vão
 * para o topo.
 */
export function PageLayout({
  title,
  eyebrow,
  texto,
  imagem,
  lado,
  children,
}: {
  title: string;
  eyebrow: string;
  texto?: ReactNode;
  imagem?: string;
  lado?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-h-[60svh] bg-background">
      <PaginaTopo caminho={eyebrow} titulo={title} texto={texto} imagem={imagem} lado={lado} />
      <div className="mx-auto w-full max-w-[1200px] px-4 py-10 md:px-6 md:py-14">{children}</div>
    </main>
  );
}
