# Frontend: loja PACK

A loja da Pack em **TanStack Start** (React 19 com renderização no servidor). Tem a loja completa, a área do cliente e o painel administrativo.

**Estado atual:** tudo funciona com **dados de demonstração**, guardados só na memória da página. O frontend ainda não está ligado à [Pack API](../README.md#backend-pack-api); a seção [Ligação com a Pack API](#ligação-com-a-pack-api) explica o que muda quando for.

O projeto começou no [Lovable](https://lovable.dev) e foi reorganizado depois: o visual é o mesmo, e não sobrou nenhuma dependência do Lovable.

## Sumário

- [O que tem](#o-que-tem)
- [Stack](#stack)
- [Como rodar](#como-rodar)
- [Organização](#organização)
- [Como o código funciona](#como-o-código-funciona)
- [Ligação com a Pack API](#ligação-com-a-pack-api)
- [Testes e qualidade](#testes-e-qualidade)
- [Pendências](#pendências)
- [Documentação](#documentação)

## O que tem

| Área | Páginas |
|---|---|
| **Loja** | Home, catálogo com filtros e ordenação, categorias por estilo, coleções, página do produto (galeria, zoom, tamanhos, frete), busca |
| **Compra** | Gaveta do carrinho, carrinho, cupom, checkout em três etapas (endereço, entrega, pagamento) e confirmação do pedido |
| **Conta do cliente** | Login, cadastro, recuperação de senha, visão geral, pedidos (acompanhar, cancelar, pedir troca), endereços, dados e senha |
| **Painel administrativo** | Visão geral, produtos, coleções, estoque, pedidos, cupons, clientes, colaboradores, mensagens, newsletter e trocas, com busca, filtros, ordenação e exportação em CSV |
| **Conteúdo** | Manifesto, contato, FAQ, tabela de medidas, políticas, newsletter e página 404 |

Na demonstração, o botão **ACESSAR DEMONSTRAÇÃO** do `/login` e do `/admin` entra sem senha. O painel mostra só as seções do cargo:

| Cargo | Acessa |
|---|---|
| admin | Tudo |
| operacao | Produtos, coleções, estoque e pedidos |
| atendimento | Pedidos, clientes, mensagens e trocas |

## Stack

| | |
|---|---|
| Framework | TanStack Start 1 (React 19, Vite 8, renderização no servidor) |
| Rotas | TanStack Router, uma rota por arquivo em `src/routes` |
| Dados | TanStack Query: carregados pelo `loader` da rota e enviados junto com o HTML |
| Visual | Tailwind CSS 4, shadcn/ui (só os componentes usados) e ícones Lucide |
| Testes | Vitest |
| Qualidade | TypeScript estrito, ESLint e Prettier |
| Pacotes | npm |

## Como rodar

Precisa do Node.js 22 ou mais novo.

```bash
cd frontend
npm install
npm run dev      # o endereço local aparece no terminal
```

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento, que recarrega a cada alteração |
| `npm run build` | Build de produção (servidor e navegador) |
| `npm run preview` | Roda o build de produção localmente |
| `npm test` | Testes (Vitest) |
| `npm run typecheck` | Checagem de tipos do TypeScript |
| `npm run lint` | ESLint |
| `npm run format` | Formata o código com o Prettier |

## Organização

O mapa completo está em [`docs/estrutura-pastas.svg`](docs/estrutura-pastas.svg). Em resumo:

```
src/
├── routes/        uma página por arquivo; o nome do arquivo vira a URL
├── components/    peças das telas, por assunto (layout, catalog, cart, checkout, account, admin...)
├── lib/
│   ├── api/       o ÚNICO caminho para os dados (hoje, simulação)
│   ├── cart.tsx   estado do carrinho
│   └── session.tsx  quem está logado
├── data/          dados de demonstração e os tipos do domínio
└── hooks/         hooks reutilizáveis
```

**Arquivos da raiz:**

| Arquivo | Para que serve |
|---|---|
| `package.json` / `package-lock.json` | Dependências e scripts / versões exatas instaladas (os dois vão para o git) |
| `tsconfig.json` | Regras do TypeScript e o atalho `@/` para `src/` |
| `vite.config.ts` | Build e servidor de desenvolvimento: plugins do Tailwind, TanStack Start, React e Nitro (destino Cloudflare) |
| `vitest.config.ts` | Configuração dos testes |
| `eslint.config.js` | Regras de qualidade do código |
| `.prettierrc` / `.prettierignore` | Regras de formatação / o que o Prettier não formata |
| `components.json` | Usado só pelo instalador do shadcn/ui, para acrescentar componentes novos (`npx shadcn add nome`). Os componentes já em `src/components/ui` funcionam sem ele |

**Convenções:**
- **Rotas:** o ponto do nome vira barra (`suporte.faq.tsx` → `/suporte/faq`), e o `$` vira parâmetro (`produto.$id.tsx` → `/produto/p1`). O `_` no fim de um trecho (`conta_.pedidos.tsx`) não aparece na URL, mas impede que a página fique "dentro" da página pai. O `routeTree.gen.ts` é gerado automaticamente e não deve ser editado. Todas as rotas estão em [`docs/rotas.svg`](docs/rotas.svg).
- **Dados:** rotas e componentes buscam dados só por `@/lib/api`. De `@/data`, importam apenas os tipos.
- **Valores fixos** (tamanhos, status de pedido e de troca) ficam em `src/lib/dominio.ts`, e não repetidos nas telas.
- **Componentes:** cada arquivo exporta componentes. Constantes e funções auxiliares ficam em arquivos `.ts` próprios (como `navegacao.ts` e `filtros.ts`).
- **Idioma:** os comentários e textos de tela são em português; os nomes de componentes e tipos seguem os do projeto, em inglês.

## Como o código funciona

O caminho de uma compra, com o código de cada etapa, está em [`docs/fluxo.svg`](docs/fluxo.svg). As peças que se repetem em todas as telas:

```
rota (src/routes)  ──loader──►  camada de API (src/lib/api)  ──►  dados (src/data, por enquanto)
      │                                ▲
      ▼                                │ ações (salvar, comprar, entrar)
componentes (src/components)  ─────────┘
      │
      └── estado de todo o site: carrinho (lib/cart) e sessão (lib/session)
```

1. **A rota carrega os dados antes de a página aparecer.** O `loader` chama o `ensureQueryData`, que guarda o resultado no cache do TanStack Query, e o componente lê do cache com o `useSuspenseQuery`.
2. **No servidor, o cache vai junto com o HTML.** É o `setupRouterSsrQueryIntegration`, em `router.tsx`. Assim, o navegador não busca de novo nem mostra "carregando".
3. **As ações chamam a camada de API.** Depois de salvar, o painel invalida o cache das telas afetadas, que recarregam sozinhas.
4. **Os erros têm três caminhos:**
   - **numa ação**, a mensagem aparece na própria tela (`role="alert"`);
   - **recurso que não existe** mostra a página 404;
   - **falha ao carregar** mostra o `RouteError`, com o botão "Tentar novamente". No servidor, aparece a página de erro 500.

## Ligação com a Pack API

Cada função de `src/lib/api` tem, num comentário `// BACKEND:`, a chamada HTTP que substitui a simulação. O cliente HTTP (`apiFetch`) e o endereço da API (variável `VITE_API_URL`) já existem em `src/lib/api/http.ts`.

**Mas as chamadas previstas foram escritas antes de a Pack API existir e não batem com ela.** Ligar a API real exige adaptar cada função; as telas não mudam.

| O frontend espera | A Pack API tem |
|---|---|
| Campos em inglês (`name`, `price`) | Campos em português (`nome`, `preco`) |
| Produto com estoque por tamanho | Produto → variantes (tamanho + cor + SKU + estoque) |
| `/customers/me/...` | `/customers/{id}/...`, com o id vindo do token |
| `PUT /cart` com a lista inteira | Adicionar e remover um item por vez |
| `POST /orders` com os itens | Checkout a partir do carrinho guardado no servidor |
| Listas simples | Listas em páginas (`itens`, `totalItens`...) |
| Cargos `admin` / `operacao` / `atendimento` | Papéis com permissões (ADMIN, ESTOQUISTA, ATENDENTE, SUPERVISOR) |

**O frontend tem funções que a API ainda não tem:**
- cálculo de frete e pagamento real;
- newsletter, contato e coleções;
- trocas;
- recuperação e troca de senha e logout;
- os números do painel e a validação pública de cupom.

Elas continuam simuladas até a API ganhar o equivalente.

**Decisões pendentes:**
- **Onde guardar o token.** A recomendação é que o servidor do próprio TanStack Start guarde o JWT num cookie `httpOnly` e repasse as chamadas para a API (o padrão chamado BFF). Assim, o JavaScript do navegador nunca vê o token.
- **CORS** no Spring, se o navegador chamar a API direto.
- **O IP do visitante:** com renderização no servidor, as chamadas chegam à API com o IP do servidor do frontend, e o limite por IP da API (`LimitePorIp`) precisaria recebê-lo de outra forma.
- **A hospedagem:** Cloudflare, que é o destino padrão do build, ou Cloud Run.

**Segurança:** as travas de cargo e de sessão do frontend são só experiência de tela. Quem protege os dados é a API, que confere o token, o dono do recurso e as permissões em toda requisição, e recalcula preço, estoque, cupom e frete.

## Testes e qualidade

```bash
npm test             # 18 testes (Vitest)
npm run typecheck    # TypeScript estrito, sem variáveis ou parâmetros sem uso
npm run lint         # ESLint
```

Os testes ficam ao lado do código testado (`*.test.ts`):

| Arquivo | O que testa |
|---|---|
| `lib/api.test.ts` | A simulação da API: coleções, permissões por cargo, endereços, estoque no checkout, cancelamento e cupons |
| `lib/checkout.test.ts` | O cálculo de subtotal, desconto, frete e total |
| `lib/table.test.ts` | A busca, os filtros e a ordenação das tabelas do painel, e a exportação CSV (inclusive a proteção contra fórmulas) |

## Pendências

- **Ligar a Pack API**, como descrito acima.
- **Compra de verdade:**
  - pagamento real (Pix e cartão) e o retorno do pagamento;
  - frete real por CEP;
  - e-mails do pedido.
- **Conta:** recuperação de senha e newsletter de verdade.
- **Conteúdo:** revisar os textos de demonstração (manifesto, FAQ e termos, em `src/data/content.ts`).

## Documentação

| Arquivo | O que mostra |
|---|---|
| [`docs/estrutura-pastas.svg`](docs/estrutura-pastas.svg) | As pastas e o que fica em cada uma |
| [`docs/rotas.svg`](docs/rotas.svg) | Cada página: URL, arquivo, o que mostra e de onde vêm os dados |
| [`docs/fluxo.svg`](docs/fluxo.svg) | O código de uma compra, etapa por etapa, com os erros possíveis |

Os diagramas são gerados por scripts Python em `docs/geradores/`. O código mostrado no `fluxo.svg` é copiado à mão no `gen_fluxo.py`, então, quando o código mudar, esse script precisa ser atualizado e rodado de novo.
