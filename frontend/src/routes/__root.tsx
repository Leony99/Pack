import type { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";
import { SessionProvider } from "@/lib/session";
import { CartProvider } from "@/lib/cart";
import { SiteHeader } from "@/components/layout/SiteHeader";
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

/** Moldura de todas as páginas: sessão, carrinho, cabeçalho, a página da rota e o rodapé. */
function RootComponent() {
  return (
    <SessionProvider>
      <CartProvider>
        <SiteHeader />
        <Outlet />
        <SiteFooter />
      </CartProvider>
    </SessionProvider>
  );
}
