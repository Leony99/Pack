import type { QueryClient } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { abertura } from "@/lib/abertura";
import { SessionProvider } from "@/lib/session";
import { CartProvider } from "@/lib/cart";
import { MenuFlutuante } from "@/components/layout/MenuFlutuante";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { NotFoundPage, RouteError } from "@/components/layout/RouteBoundary";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PACK — Training & Casual Apparel" },
      {
        name: "description",
        content: "Roupas sem ruído. Casual e treino. Preto, branco, performance.",
      },
      { property: "og:title", content: "PACK — Training & Casual Apparel" },
      {
        property: "og:description",
        content: "Roupas sem ruído. Casual e treino. Preto, branco, performance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundPage,
  errorComponent: RouteError,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/**
 * Moldura de todas as páginas: sessão, carrinho, o menu solto por cima, a página da rota e o rodapé.
 * Um espaço no topo deixa o começo de cada página abaixo do menu; o topo da home sobe por cima
 * dele (margem negativa), e o menu fica sobre a foto. O espaço não depende da rota: assim a página
 * que sai no arrasto (home ↔ catálogo) não pula antes de sair.
 */
function RootComponent() {
  // a abertura da home só roda quando a visita começa pela home: entrando por outra página,
  // ela é dada como feita e a home já aparece pronta ao chegar lá
  const caminho = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    if (caminho !== "/") abertura.concluir();
  }, [caminho]);

  return (
    <SessionProvider>
      <CartProvider>
        <MenuFlutuante />
        {/* espaço do menu no começo de cada página (o topo da home sobe por cima dele) */}
        <div aria-hidden className="h-[74px] md:h-[98px]" />
        <Outlet />
        <SiteFooter />
      </CartProvider>
    </SessionProvider>
  );
}
