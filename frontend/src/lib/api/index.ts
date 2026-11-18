// Camada de API: o único caminho entre as telas e os dados. Rotas e componentes importam de "@/lib/api"
// e nunca de "@/data" (a não ser os tipos).
// Cada função olha para o modo (modo.ts): com VITE_USAR_API=true, chama a Pack API pelo servidor do
// frontend (funções de servidor + server/http.ts); sem ela, responde com a demonstração (src/data).
// Hoje o catálogo e o login estão ligados à API; o que falta e as diferenças de contrato: frontend/README.md.
export * from "./erros";
export * from "./modo";
export {
  CATEGORIAS_INICIAIS,
  ESTILOS_FIXOS,
  colecaoDoDrop,
  colecoesDoProduto,
  nomeDaOpcao,
  normalizarTag,
  SLUG,
  type FiltroDaTag,
  type Opcao,
} from "./tags";
export * from "./catalogo";
export * from "./compra";
export * from "./autenticacao";
export * from "./conta";
export * from "./conteudo";
export * from "./admin";
export * from "./tags-painel";
