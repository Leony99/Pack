// Camada de API: o único caminho entre as telas e os dados. Rotas e componentes importam de "@/lib/api"
// e nunca de "@/data" (a não ser os tipos). Hoje cada função simula a resposta com os dados de src/data;
// para ligar a API real, troca-se só o corpo da função pela chamada do comentário "BACKEND:" dela.
// Detalhes e diferenças em relação à Pack API: frontend/README.md.
export * from "./http";
export * from "./catalogo";
export * from "./compra";
export * from "./autenticacao";
export * from "./conta";
export * from "./conteudo";
export * from "./admin";
