import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { NotFoundPage, RouteError } from "@/components/layout/RouteBoundary";
import { routeTree } from "./routeTree.gen";

/**
 * Cria o router (um por requisição no servidor, um no navegador). O QueryClient vai no contexto
 * para os loaders das rotas carregarem os dados antes de a página aparecer.
 */
export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: RouteError,
    defaultNotFoundComponent: NotFoundPage,
  });

  // Manda junto com o HTML os dados que o servidor já carregou. Sem isso, o navegador começava com
  // o cache vazio: mostrava "carregando" por um instante e o React acusava diferença na hidratação.
  // Também envolve o app com o QueryClientProvider.
  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
};
