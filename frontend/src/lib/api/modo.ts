// De onde vêm os dados: da Pack API (VITE_USAR_API=true) ou da demonstração (src/data, padrão).
// É o único interruptor: as funções de src/lib/api olham para ele, e as telas não sabem a diferença.
// O endereço da API não fica aqui: é o PACK_API_URL, só do servidor (ver server/http.ts).
export const USA_API = import.meta.env["VITE_USAR_API"] === "true";
