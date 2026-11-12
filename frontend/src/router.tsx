import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { NotFoundPage, RouteError } from "@/components/layout/RouteBoundary";
import { posicaoDaPagina } from "@/components/layout/navegacao";
import { routeTree } from "./routeTree.gen";

/**
 * As páginas do menu ficam lado a lado (HOME, CATÁLOGO, CONTATO, TAMANHOS, FAQ, ÁREA DO CLIENTE):
 * indo para uma mais à direita, a tela arrasta para a esquerda ("para-frente"); voltando, arrasta
 * para a direita ("para-tras"). Dentro da mesma página (ex.: /conta → /conta/pedidos) e nas páginas
 * fora do menu (busca, produto, carrinho...), a troca é sem animação.
 */
function tiposDeTransicao({
  fromLocation,
  toLocation,
}: {
  fromLocation?: { pathname: string };
  toLocation: { pathname: string };
}): string[] | false {
  if (!fromLocation) return false;
  const de = posicaoDaPagina(fromLocation.pathname);
  const para = posicaoDaPagina(toLocation.pathname);
  if (de < 0 || para < 0 || de === para) return false;
  return [para > de ? "para-frente" : "para-tras"];
}

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
    // Entre as páginas do menu, a página "arrasta" para o lado (View Transitions do navegador;
    // a animação está no styles.css). As outras navegações trocam a página sem animação.
    defaultViewTransition: { types: tiposDeTransicao },
  });

  // Manda junto com o HTML os dados que o servidor já carregou. Sem isso, o navegador começava com
  // o cache vazio: mostrava "carregando" por um instante e o React acusava diferença na hidratação.
  // Também envolve o app com o QueryClientProvider.
  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
};
