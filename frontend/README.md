# Frontend: loja PACK

A loja da Pack em **TanStack Start** (React 19 com renderização no servidor). Tem a loja completa, a área do cliente e o painel administrativo.

**Estado atual:** o `npm run dev` e o build de produção usam a [Pack API](../README.md#backend-pack-api) no **catálogo** (produtos, busca, drops e página do produto); o resto (login, conta, carrinho, checkout e painel) continua na demonstração. O `npm run dev:demo` usa só a demonstração. A seção [Ligação com a Pack API](#ligação-com-a-pack-api) explica como funciona e o que falta.

O visual é próprio, com animações na rolagem e detalhes em laranja: veja [Visual](#visual).

## Sumário

- [O que tem](#o-que-tem)
- [Stack](#stack)
- [Visual](#visual)
- [Como rodar](#como-rodar)
- [Organização](#organização)
- [Como o código funciona](#como-o-código-funciona)
- [Ligação com a Pack API](#ligação-com-a-pack-api)
- [Segurança](#segurança)
- [Testes e qualidade](#testes-e-qualidade)
- [Pendências](#pendências)
- [Documentação](#documentação)

## O que tem

| Área                      | Páginas                                                                                                                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Loja**                  | Home, catálogo com filtros e ordenação, categorias por estilo, coleções, página do produto (galeria, zoom, tamanhos, frete), busca                                                                                 |
| **Compra**                | Gaveta do carrinho, carrinho, cupom, checkout em três etapas (endereço, entrega, pagamento) e confirmação do pedido                                                                                                |
| **Conta do cliente**      | Login, cadastro, recuperação de senha, visão geral, pedidos (acompanhar, cancelar, pedir troca), endereços, dados e senha                                                                                          |
| **Painel administrativo** | Visão geral, produtos, coleções, tags (com o filtro do catálogo de cada uma), estoque, pedidos, cupons, clientes, colaboradores, mensagens, newsletter e trocas, com busca, filtros, ordenação e exportação em CSV |
| **Conteúdo**              | Contato, FAQ, tabela de medidas, políticas, newsletter e página 404                                                                                                                                                |

Na demonstração, o botão **ACESSAR DEMONSTRAÇÃO** do `/login` e do `/admin` entra sem senha. O painel mostra só as seções do cargo:

| Cargo       | Acessa                                      |
| ----------- | ------------------------------------------- |
| admin       | Tudo                                        |
| operacao    | Produtos, coleções, tags, estoque e pedidos |
| atendimento | Pedidos, clientes, mensagens e trocas       |

## Stack

|           |                                                                                 |
| --------- | ------------------------------------------------------------------------------- |
| Framework | TanStack Start 1 (React 19, Vite 8, renderização no servidor)                   |
| Rotas     | TanStack Router, uma rota por arquivo em `src/routes`                           |
| Dados     | TanStack Query: carregados pelo `loader` da rota e enviados junto com o HTML    |
| Visual    | Tailwind CSS 4, shadcn/ui (só os componentes usados) e ícones Lucide            |
| Animação  | GSAP com ScrollTrigger e SplitText (abertura da home e drop em rolagem lateral) |
| Testes    | Vitest                                                                          |
| Qualidade | TypeScript estrito, ESLint e Prettier                                           |
| Pacotes   | npm                                                                             |

## Visual

Preto e branco, com Anton nos títulos e Inter no texto, e um **laranja** (`destaque`, em `src/styles.css`) só nos detalhes: o contador da sacola, o selo NOVO das peças cadastradas nos últimos 3 meses, a foto atual nos cards, os botões de comprar (adicionar ao carrinho, finalizar compra, concluir pedido), a confirmação do pedido e o hover dos cards do topo.

| Onde                                                                  | O que acontece                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Abertura** (`PreLoader`)                                            | Ao carregar a home, uma camada preta cobre a tela inteira e roda sozinha, sem precisar rolar: a foto abre numa janela estreita entre "NO LOGOS" e "JUST WORK.", as letras sobem e a janela se abre até ocupar tudo. A foto fica no lugar, e os elementos do topo aparecem nas laterais. A rolagem fica travada enquanto ela roda. Só roda quando a visita começa pela home, e uma vez: navegando pelo site não volta (recarregar a página roda outra vez). No celular, usa a foto vertical                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Topo da home** (`HeroSection`)                                      | A foto ocupa a tela, centralizada e alinhada pelo topo (sem cortar a cabeça), e os elementos ficam nas laterais, abaixo do menu solto. Esquerda: o nome PACK grande, na fonte do logo, com o número da página ([01]), o texto e dois cards compactos com foto de roupa lado a lado: COLEÇÃO (CASUAL + TREINO, com a faixa VER COLEÇÃO, leva ao catálogo) e ÚLTIMO DROP (com o ponto laranja piscando, o nome do drop em destaque, como DROP / NATAL, e a foto da peça mais nova dele; leva à coleção do drop. Sempre aparece e, sem nenhuma peça com tag de drop, vira PRÓXIMO DROP EM BREVE, com a faixa AVISE-ME, que leva à newsletter). Direita: data e hora, o card de promoções ativas, como "3 Bermudas por R$ 120" (`src/data/promocoes.ts`; em telas baixas, só as duas primeiras; por enquanto só aparecem no card, o carrinho não aplica esses preços) e uma frase. No celular ficam o título, o texto e os dois cards embaixo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Menu solto** (`MenuFlutuante`)                                      | Substitui o cabeçalho antigo (com a faixa de avisos e os menus de cards), em todas as páginas. Fica solto da borda da tela, por cima da página: à esquerda, a barra branca de pontas quadradas com HOME, CATÁLOGO e SUPORTE (que abre Contato, Tamanhos e FAQ ao passar o mouse; no celular, ao tocar), com a página atual em preto e o hover em cinza; à direita, busca, área do cliente e carrinho, cada um na sua caixa, com o mesmo preto (e a bordinha branca) e o mesmo cinza. Some ao rolar para baixo e volta ao rolar para cima. Na home, aparece quando a abertura termina                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Páginas lado a lado** (`router.tsx`, `navegacao.ts` e `styles.css`) | As páginas do menu ficam numa fila: HOME [01], CATÁLOGO [02], CONTATO [03], TAMANHOS [04], FAQ [05] e ÁREA DO CLIENTE [06] (`PAGINAS_EM_ORDEM`). Indo para uma página mais à direita, a tela arrasta para a esquerda; voltando, arrasta para a direita. Indo a uma página a duas ou mais posições (HOME → CONTATO), a tela **passa pelas páginas do meio** (HOME → CATÁLOGO → CONTATO): `src/lib/percurso.ts` visita cada uma em etapas, a primeira acelera, as do meio seguem constantes e a última freia, para parecer um arrasto só; só a primeira etapa entra no histórico. O percurso inteiro dura de 0,9 s a 1,15 s: quanto mais longe a página, mais rápida cada etapa. As páginas do caminho são carregadas antes de começar, para nenhuma etapa parar no meio. Vale para qualquer link da loja (menu, rodapé, textos); o voltar e o avançar do navegador arrastam direto. **Cada página guarda a própria rolagem** (`getScrollRestorationKey` pelo caminho, no `router.tsx`): sair da home no meio e voltar a deixa no meio; uma página nunca visitada abre no topo. Para voltar ao topo, rola-se para cima ou clica-se no link da própria página. O menu solto fica parado na frente: ele tem o próprio nome de transição (`menu-flutuante`), então só o que está atrás se move. A busca e o carrinho não arrastam, nem as páginas fora do menu (produto, checkout...). Usa as View Transitions do navegador (`defaultViewTransition` do TanStack Router com o tipo da transição); nos navegadores sem esse recurso, a troca é sem animação |
| **Topo das páginas** (`PaginaTopo`)                                   | As páginas internas (catálogo, suporte, área do cliente, login, políticas, busca, carrinho, checkout, 404...) seguem o visual do topo da home: fundo preto com uma foto de roupa apagada, o caminho em rótulo ("■ [ SUPORTE / FAQ ]"), o título grande em Anton com o número da página e cards de aviso à direita (`CardAviso`). O conteúdo vem embaixo, em branco, com caixas quadradas de borda fina, alinhado ao menu                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Abrir e fechar** (`usePresenca`)                                    | A gaveta do carrinho entra pela direita com o fundo escurecendo e sai pelo mesmo lado (Esc também fecha), e os itens entram em sequência. A busca desce de baixo dos botões e sobe ao fechar, com o ícone trocando girando. O menu de suporte desce com as opções em sequência. O número do carrinho dá um pulo quando muda. As animações são por keyframes (`tw-animate-css`), e `usePresenca` mantém o elemento na tela até a saída terminar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Último drop** (`DropHorizontal`)                                    | O drop em destaque (ver [Tags e filtros do catálogo](#tags-e-filtros-do-catálogo)), com as peças dele, da mais nova para a mais antiga. Com o mesmo espaço em cima e embaixo, a seção só fica presa quando chega ao meio da tela; aí a rolagem empurra as peças para o lado, com a barra de progresso laranja. As peças encolhem em telas baixas para a seção caber inteira. No celular, a fila rola com o dedo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Descida da home** (`StyleCards`, `useRevelar`)                      | A home segue: topo, os dois cards (CASUAL e TREINO, de ponta a ponta), DESTAQUES, o drop (ou o EM BREVE), a newsletter e o rodapé. O drop é uma faixa preta, sem borda, entre duas seções claras. Os títulos e as peças de DESTAQUES, o EM BREVE e a newsletter sobem de leve ao aparecer na tela, uma vez só (`src/hooks/useRevelar.ts`, com `data-revela` em cada elemento)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

As animações com GSAP usam o hook `useGsap` (`src/hooks/useGsap.ts`), que desfaz tudo quando o componente sai da tela. O aviso de que a abertura terminou passa por `src/lib/abertura.ts`. Com "reduzir movimento" ligado no sistema, a abertura não aparece (o topo já vem pronto), a página não arrasta e o drop rola de lado.

## Como rodar

Precisa do Node.js 22 ou mais novo.

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000, com a Pack API local
npm run dev:demo   # http://localhost:3000, só com a demonstração (sem API)
```

### Dev e produção

O que muda entre os modos é o arquivo `.env` de cada um, que o Vite escolhe sozinho pelo comando:

| Comando            | Arquivo            | Dados                                   |
| ------------------ | ------------------ | --------------------------------------- |
| `npm run dev`      | `.env.development` | Pack API local: `http://localhost:8080` |
| `npm run dev:demo` | `.env.demo`        | Demonstração (`src/data`), sem API      |
| `npm run build`    | `.env.production`  | Pack API publicada no Cloud Run         |

Os três arquivos vão para o git, porque só têm o endereço da API, que não é segredo. As variáveis:

| Variável        | Onde vale            | O que faz                                                                                                        |
| --------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `VITE_USAR_API` | Navegador e servidor | `true` busca os dados na API; `false` usa a demonstração                                                         |
| `PACK_API_URL`  | Só no servidor       | Endereço da API. Não tem `VITE_`, então nunca vai para a página (o build confere: só o código do servidor o tem) |

- **API local no `npm run dev`:** é preciso subir o backend antes, de dentro de `backend/`: `docker compose up -d` (para desligar, `docker compose stop`). Com a API fora do ar, a home abre sem as linhas de produtos, e o catálogo mostra o erro com o botão TENTAR DE NOVO.
- **Mudar só na sua máquina:** crie um `.env.development.local` (fica fora do git), com base no `.env.example`. Ele vale mais que o `.env.development`.
- **Produção:** o endereço do `.env.production` fica gravado no código do servidor no build. Se a hospedagem tiver a variável de ambiente `PACK_API_URL`, ela vale mais.

| Script              | O que faz                                                        |
| ------------------- | ---------------------------------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento, que recarrega a cada alteração      |
| `npm run dev:demo`  | O mesmo, só com os dados de demonstração                         |
| `npm run build`     | Build de produção (servidor e navegador), com a API do Cloud Run |
| `npm run preview`   | Roda o build de produção localmente                              |
| `npm test`          | Testes (Vitest)                                                  |
| `npm run typecheck` | Checagem de tipos do TypeScript                                  |
| `npm run lint`      | ESLint                                                           |
| `npm run format`    | Formata o código com o Prettier                                  |

## Organização

O mapa completo está em [`docs/estrutura-pastas.svg`](docs/estrutura-pastas.svg). Em resumo:

```
src/
├── routes/        uma página por arquivo; o nome do arquivo vira a URL
├── components/    peças das telas, por assunto (layout, catalog, cart, checkout, account, admin...)
├── lib/
│   ├── api/       o ÚNICO caminho para os dados: demonstração ou Pack API (ver abaixo)
│   ├── cart.tsx   estado do carrinho
│   └── session.tsx  quem está logado
├── data/          dados de demonstração e os tipos do domínio
└── hooks/         hooks reutilizáveis
```

**Arquivos da raiz:**

| Arquivo                              | Para que serve                                                                                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json` / `package-lock.json` | Dependências e scripts / versões exatas instaladas (os dois vão para o git)                                                                                   |
| `tsconfig.json`                      | Regras do TypeScript e o atalho `@/` para `src/`                                                                                                              |
| `vite.config.ts`                     | Build e servidor de desenvolvimento: plugins do Tailwind, TanStack Start, React e Nitro (destino Cloudflare)                                                  |
| `vitest.config.ts`                   | Configuração dos testes                                                                                                                                       |
| `eslint.config.js`                   | Regras de qualidade do código                                                                                                                                 |
| `.prettierrc` / `.prettierignore`    | Regras de formatação / o que o Prettier não formata                                                                                                           |
| `components.json`                    | Usado só pelo instalador do shadcn/ui, para acrescentar componentes novos (`npx shadcn add nome`). Os componentes já em `src/components/ui` funcionam sem ele |

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

### Como funciona

```
tela ──► lib/api (getProducts...) ──┬─ demonstração: src/data, na memória da página
                                    │
                                    └─ VITE_USAR_API=true: função de servidor (createServerFn)
                                         └─► servidor do frontend ──► Pack API (PACK_API_URL)
```

O navegador nunca chama a API direto: ele chama uma **função de servidor** do TanStack Start, e o servidor do frontend chama a API. É o padrão **BFF** (_backend for frontend_). Assim, o endereço da API e, quando o login for ligado, o token ficam só no servidor.

| Arquivo (`src/lib/api/`)      | O que faz                                                                                                                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modo.ts`                     | O interruptor: `USA_API`, lido de `VITE_USAR_API`                                                                                                                                               |
| `server/http.ts`              | `chamarApi`: o cliente HTTP da API, só do servidor (a pasta `server/` é proibida no navegador pelo `vite.config.ts`). Põe o token do cookie, espera até 15 s e transforma falhas em `ErroDaApi` |
| `erros.ts`                    | `ErroDaApi`: o erro no formato do `ApiError` do Spring (status, mensagem, erros por campo e o `Retry-After` do 429). Erros 5xx nunca mostram a mensagem do servidor                             |
| `adaptadores.ts`              | Tradução da API para as telas: `ProdutoDaApi` → `Product` (nomes em português, estoque somado das variantes de cada tamanho, imagens só http(s), produto sem foto ganha uma imagem neutra)      |
| `tags.ts`                     | Em qual filtro do catálogo cada tag entra, pelo filtro dela na API (ver abaixo)                                                                                                                 |
| `catalogo-api.ts`             | As funções de servidor do catálogo: todos os produtos (até 10 páginas de 100) e um produto pelo id                                                                                              |
| `catalogo.ts`, `compra.ts`... | As funções que as telas chamam. Cada uma olha o `USA_API`; as que ainda não foram ligadas têm, num comentário `PACK API:`, a rota real que vão usar ou o que falta na API                       |

### Tags e filtros do catálogo

Na API, cada tag guarda **em qual filtro aparece** (`filtro`, em `GET /api/v1/tags` e nas tags de cada produto), e **a própria tag é a opção do filtro**. O filtro é escolhido no painel, na aba **Tags** (`/admin/tags`), e `src/lib/api/tags.ts` só lê o que a API diz:

| Filtro da tag (`filtro`) | O que a tag é                              | Regra no produto | Exemplo                           |
| ------------------------ | ------------------------------------------ | ---------------- | --------------------------------- |
| `ESTILO`                 | Uma opção do filtro de estilo              | Pelo menos uma   | `treino` → estilo Treino          |
| `CATEGORIA`              | Uma opção do filtro de categoria           | Exatamente uma   | `moletons` → categoria Moletons   |
| `COLECAO`                | Uma coleção (um drop), em `/colecao/<tag>` | Opcional         | `drop-natal` → coleção DROP NATAL |
| sem filtro               | Fica no produto e só vale na busca         | Opcional         | `verao`                           |

A ordem dos filtros no catálogo é ESTILO, CATEGORIA, COLEÇÃO e CURADORIA. Os três primeiros vêm das tags; a curadoria segue as regras abaixo.

- **As opções vêm das tags:** os dropdowns de ESTILO, CATEGORIA e COLEÇÃO do `/catalogo` e as rotas `/catalogo/estilo/categoria` usam as tags da API com esses filtros (`getOpcoesDoCatalogo` e `getCollections`, em `src/lib/api/catalogo.ts`). Criar a tag `moletons` com o filtro Categoria já faz "Moletons" aparecer em todos esses lugares; um par estilo/categoria que não existe dá 404. Na demonstração, as opções são as tags iniciais abaixo.
- **Tags que a loja cria sozinha** (`TagsIniciais`, no backend, ao subir a API): os estilos **fixos** `casual` e `treino`, que não podem ser apagados, renomeados nem mudar de filtro (na aba Tags aparecem como FIXA, sem editar nem excluir), e as categorias `camisa`, `bermuda` e `conjunto`, criadas só num banco sem nenhuma categoria (podem ser editadas e apagadas, e não voltam depois). Os cards CASUAL e TREINO da home levam ao catálogo já filtrado pelo estilo (`/catalogo?style=casual`).
- **Tags obrigatórias:** a API só cria um produto com pelo menos uma tag de estilo e exatamente uma de categoria (`tagIds` no `POST /products`). Ela recusa tirar a categoria ou o único estilo de um produto, ligar uma segunda categoria, mudar o filtro de uma tag que está em produtos e apagar uma tag de estilo ou de categoria em uso.
- **O nome sozinho não decide nada:** uma tag `camisetas` sem filtro não vira categoria. Para entrar num filtro, a tag precisa ter o filtro escolhido no painel.
- **Normalização:** antes de comparar, a tag perde acentos e maiúsculas, e espaços viram hífen. "Drop Natal", "DROP-NATAL" e "drop natal" são a mesma tag.
- **Aba Tags** (`TagsPanel`, com `src/lib/api/tags-painel.ts` e as funções de servidor de `tags-api.ts`): lista todas as tags, o filtro de cada uma e quantos produtos a usam; cria, edita e apaga. No modo API, ler é público, mas criar, editar e apagar pedem o login da equipe na API, com a permissão `CATALOG_WRITE`, que ainda não está ligado. Na demonstração, as tags ficam na memória, com o filtro que cada tag de exemplo teria na API; renomear ou apagar muda também os produtos.
- **Curadoria sem tag:** no modo API, os filtros de curadoria não usam tag.
  - **Destaques** são os mais vendidos, em ordem (`GET /api/v1/products/mais-vendidos`): primeiro os mais vendidos dos últimos 90 dias; faltando peças, os mais vendidos desde sempre que ainda não estão na lista; faltando ainda, os cadastrados mais recentemente. Só contam os pedidos pagos (PAGO, EM_SEPARACAO, ENVIADO, ENTREGUE). A home mostra 4, e o filtro do catálogo até 48.
  - **Novidades** (filtro `novo-drop` do catálogo) e o **selo NOVO** dos cards: o produto, ou uma variante dele (uma cor ou um tamanho novo), foi cadastrado nos últimos 3 meses (`ehNovo`, em `src/lib/api/catalogo.ts`). As variantes cadastradas antes de a API guardar a data delas contam como antigas.
  - Na demonstração, os destaques continuam marcados na peça, e as peças do drop contam como novas.
- **Coleções:** a API não tem a entidade coleção. No modo API, as coleções são as tags com filtro `COLECAO` que estão em algum produto, na ordem de lançamento (primeiro o drop com a peça cadastrada mais recentemente).
- **Drop em destaque da home** (`getDropEmDestaque`, em `src/lib/api/catalogo.ts`): é o drop da peça cadastrada mais recentemente (`criadoEm` da API) entre as que estão em alguma coleção (tag com filtro `COLECAO`; na demonstração, as tags `drop-...`). O nome pode ser qualquer um (`drop-natal`, `natal`, `drop-02`). Para lançar um drop, basta criar a tag com o filtro Coleção e cadastrar as peças com ela: não precisa tirar nada das peças antigas. O card do topo e a seção do drop mostram o nome ("DROP NATAL"), as peças dele e os links para a coleção; sem nenhuma peça em coleção, os dois mostram o EM BREVE. Uma peça pode estar no drop e nos destaques ao mesmo tempo. A curadoria `novo-drop` continua só como filtro do catálogo e para o selo NOVO.

### Catálogo vazio

O banco da API começa vazio, e o site foi preparado para isso (`components/common/Vazio.tsx`):

| Onde                           | Sem produtos                                                                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Home                           | A linha DESTAQUES some; o card do último drop no topo e a seção do drop viram "PRÓXIMO DROP EM BREVE", com link para a newsletter |
| Catálogo e categorias          | "EM BREVE"; com filtros, "NENHUMA PEÇA" e o botão LIMPAR FILTROS                                                                  |
| Busca                          | Sem termo: "EM BREVE"; com termo: "NENHUMA PEÇA ENCONTRADA"                                                                       |
| Produto ou drop que não existe | Página 404                                                                                                                        |

Se a API estiver fora do ar, a home abre mesmo assim (sem as linhas de produtos), e o catálogo mostra o erro com o botão TENTAR DE NOVO.

### O que já está ligado

| Área                                     | No modo API                                                                                                                                                                                                     |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catálogo, busca e produto                | **Ligado.** `GET /api/v1/products` e `GET /api/v1/products/{id}`. A busca por nome vai para a API quando tem 3 letras ou mais, o mínimo dela                                                                    |
| Drops (coleções)                         | **Ligado**, a partir das tags                                                                                                                                                                                   |
| Tabela de medidas                        | Continua na demonstração: a API só tem os nomes dos tamanhos, sem as medidas                                                                                                                                    |
| Login, conta, carrinho, checkout, painel | Continuam na demonstração. O caminho de cada função está no comentário `PACK API:` dela. Enquanto isso, um produto da API até entra no carrinho, mas o checkout de demonstração não o conhece e recusa o pedido |

### O que falta no frontend

1. **Login (cliente e equipe):** uma função de servidor que chama `POST /api/v1/auth/login` (ou `/auth/staff/login`) e grava o token num cookie `httpOnly`, `Secure` e `SameSite=Strict` (os nomes estão em `COOKIE_DO_TOKEN`, em `server/http.ts`); `GET /api/v1/auth/me` para saber quem está logado; sair apaga o cookie, porque a API não tem logout.
2. **Área do cliente:** dados, endereços e pedidos pelas rotas `/api/v1/customers/{id}/...`, com o id vindo do `/auth/me`. As listas da API vêm em páginas.
3. **Carrinho e checkout:** a tela precisa escolher a **variante** (tamanho + cor), e não só o tamanho. O carrinho passa a ser o da API, item por item. O pedido sai do carrinho guardado (`POST .../orders { addressId, codigoCupom }`), e o pagamento é outra chamada.
4. **Painel:** cada recurso pela rota dele, com os papéis da API (ADMIN, ESTOQUISTA, ATENDENTE, SUPERVISOR) no lugar dos cargos da demonstração.

### O que falta na API

Continua simulado até a API ganhar o equivalente:

- cálculo de frete, pagamento real e conferência de cupom antes do checkout;
- recuperação e troca de senha;
- newsletter, contato, trocas e coleções com nome e descrição;
- conteúdo: FAQ, termos e as promoções do topo da home;
- os números do painel.

**O IP do visitante:** com o BFF, toda chamada chega à API com o IP do servidor do frontend, e o limite de 120 requisições por minuto por IP (`LimitePorIp`) passaria a valer para o site inteiro. Antes de pôr o modo API em produção, a API precisa receber o IP real (por exemplo, num cabeçalho que só o servidor do frontend pode mandar, com um segredo compartilhado) ou deixar o IP do frontend fora desse limite.

## Segurança

O frontend não protege dados: quem confere token, dono do recurso, permissões, preço, estoque, cupom e frete é a API, em toda requisição. As travas de cargo e de sessão das telas são só experiência de uso. O que o frontend faz:

- **Token fora do navegador:** no modo API, o JWT vai ficar num cookie `httpOnly` (o JavaScript da página não consegue ler), `Secure` e `SameSite=Strict` (outro site não consegue usá-lo). Nunca no `localStorage`.
- **Endereço da API só no servidor:** `PACK_API_URL` não tem `VITE_`, e o build proíbe o código da pasta `server/` no navegador. Conferido no build: nem o endereço nem o nome do cookie aparecem nos arquivos da página.
- **Entrada conferida no servidor:** as funções de servidor validam o que o navegador manda (id no formato UUID, busca curta) e só chamam caminhos que começam em `/api/v1/`.
- **Erros sem detalhes internos:** um erro 5xx da API vira uma mensagem genérica; os 4xx mostram a mensagem da API, que é escrita para o usuário.
- **Imagens:** só URLs `http(s)` vindas da API viram imagem.
- **Cabeçalhos em todas as respostas** (`src/server.ts`): `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` e `frame-ancestors 'none'` (a loja não abre dentro de um iframe de outro site), `Referrer-Policy` e `Permissions-Policy` (sem câmera, microfone e localização).
- **Ainda a fazer, na hospedagem:** HSTS (só com HTTPS) e uma CSP completa, que precisa de _nonce_ para os scripts que o TanStack Start põe na página.

## Testes e qualidade

```bash
npm test             # 31 testes (Vitest)
npm run typecheck    # TypeScript estrito, sem variáveis ou parâmetros sem uso
npm run lint         # ESLint
```

Os testes ficam ao lado do código testado (`*.test.ts`):

| Arquivo                       | O que testa                                                                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/api.test.ts`             | A simulação da API: coleções, permissões por cargo, endereços, estoque no checkout, cancelamento e cupons                                      |
| `lib/checkout.test.ts`        | O cálculo de subtotal, desconto, frete e total                                                                                                 |
| `lib/api/adaptadores.test.ts` | A tradução da Pack API: tags nos filtros, produto da API (com e sem imagens, tags e variantes), filtros com o catálogo vazio e os erros da API |
| `lib/table.test.ts`           | A busca, os filtros e a ordenação das tabelas do painel, e a exportação CSV (inclusive a proteção contra fórmulas)                             |

## Pendências

- **Ligar o resto da Pack API** (login, conta, carrinho, checkout e painel), como em [O que falta no frontend](#o-que-falta-no-frontend).
- **Compra de verdade:**
  - pagamento real (Pix e cartão) e o retorno do pagamento;
  - frete real por CEP;
  - e-mails do pedido.
- **Conta:** recuperação de senha e newsletter de verdade.
- **Conteúdo:** revisar os textos de demonstração (FAQ e termos, em `src/data/content.ts`).

## Documentação

| Arquivo                                                  | O que mostra                                                    |
| -------------------------------------------------------- | --------------------------------------------------------------- |
| [`docs/estrutura-pastas.svg`](docs/estrutura-pastas.svg) | As pastas e o que fica em cada uma                              |
| [`docs/rotas.svg`](docs/rotas.svg)                       | Cada página: URL, arquivo, o que mostra e de onde vêm os dados  |
| [`docs/fluxo.svg`](docs/fluxo.svg)                       | O código de uma compra, etapa por etapa, com os erros possíveis |

Os diagramas são gerados por scripts Python em `docs/geradores/`. O código mostrado no `fluxo.svg` é copiado à mão no `gen_fluxo.py`, então, quando o código mudar, esse script precisa ser atualizado e rodado de novo.
