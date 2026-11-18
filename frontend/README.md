# Frontend: loja PACK

A loja da Pack em **TanStack Start** (React 19 com renderização no servidor). Tem a loja completa, a área do cliente e o painel administrativo.

**Estado atual:** o `npm run dev` e o build de produção usam a [Pack API](../README.md#backend-pack-api) em toda a loja: **catálogo**, **login** (cliente e equipe), **área do cliente**, **carrinho e checkout**, **painel da equipe**, **newsletter** e **contato**. Continuam fixos no site só os textos (FAQ, termos, tabela de medidas e as promoções do topo). O `npm run dev:demo` usa só a demonstração. A seção [Ligação com a Pack API](#ligação-com-a-pack-api) explica como funciona e o que falta.

O visual é próprio, com animações na rolagem e detalhes em laranja: veja [Visual](#visual).

## Sumário

- [O que tem](#o-que-tem)
- [Stack](#stack)
- [Visual](#visual)
- [Como rodar](#como-rodar)
- [Publicação (Cloudflare)](#publicação-cloudflare)
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

Na demonstração, o botão **ACESSAR DEMONSTRAÇÃO** do `/login` e do `/admin` entra sem senha. Com a API, o login é real: o botão, os avisos de demonstração e o "Esqueci minha senha" (a API ainda não manda e-mail) não aparecem, e o painel mostra as seções pelas **permissões do papel** da API (ver [O que já está ligado](#o-que-já-está-ligado)). Na demonstração, o painel mostra só as seções do cargo:

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

| Onde                                                                  | O que acontece                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Abertura** (`PreLoader`)                                            | Ao carregar a home, uma camada preta cobre a tela inteira e roda sozinha, sem precisar rolar: a foto abre numa janela estreita entre "NO LOGOS" e "JUST WORK.", as letras sobem e a janela se abre até ocupar tudo. A foto fica no lugar, e os elementos do topo aparecem nas laterais. Dura cerca de 2,5 s, com a rolagem travada. Só roda quando a visita começa pela home, e uma vez: navegando pelo site não volta (recarregar a página roda outra vez). No celular, usa a foto vertical. As fotos do topo são AVIF (54 KB no computador e 33 KB no celular); a versão em JPG serve só de imagem do link compartilhado nas redes                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Topo da home** (`HeroSection`)                                      | A foto ocupa a tela, centralizada e alinhada pelo topo (sem cortar a cabeça), e os elementos ficam nas laterais, abaixo do menu solto. Esquerda: o nome PACK grande, na fonte do logo, com o número da página ([01]), o texto e dois cards compactos com foto de roupa lado a lado: COLEÇÃO (CASUAL + TREINO, com a faixa VER COLEÇÃO, leva ao catálogo) e ÚLTIMO DROP (com o ponto laranja piscando, o nome do drop em destaque, como DROP / NATAL, e a foto da peça mais nova dele; leva à coleção do drop. Sempre aparece e, sem nenhuma peça com tag de drop, vira PRÓXIMO DROP EM BREVE, com a faixa AVISE-ME, que leva à newsletter). Direita: data e hora, o card de promoções ativas, como "3 Bermudas por R$ 120" (`src/data/promocoes.ts`; em telas baixas, só as duas primeiras; por enquanto só aparecem no card, o carrinho não aplica esses preços) e uma frase. No celular ficam o título, o texto e os dois cards embaixo                                                                                                                                                   |
| **Menu solto** (`MenuFlutuante`)                                      | Substitui o cabeçalho antigo (com a faixa de avisos e os menus de cards), em todas as páginas. Fica solto da borda da tela, por cima da página: à esquerda, a barra branca de pontas quadradas com HOME, CATÁLOGO e SUPORTE (que abre Contato, Tamanhos e FAQ ao passar o mouse; no celular, ao tocar), com a página atual em preto e o hover em cinza; à direita, busca, área do cliente e carrinho, cada um na sua caixa, com o mesmo preto (e a bordinha branca) e o mesmo cinza. Some ao rolar para baixo e volta ao rolar para cima. Na home, aparece quando a abertura termina                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Páginas lado a lado** (`router.tsx`, `navegacao.ts` e `styles.css`) | As páginas do menu ficam numa fila: HOME [01], CATÁLOGO [02], CONTATO [03], TAMANHOS [04], FAQ [05] e ÁREA DO CLIENTE [06] (`PAGINAS_EM_ORDEM`). Indo para uma página mais à direita, a tela arrasta para a esquerda; voltando, arrasta para a direita. Mesmo indo a uma página distante (HOME → CONTATO), o arrasto é de **uma página só**, para o lado da fila. **Cada página guarda a própria rolagem** (`getScrollRestorationKey` pelo caminho, no `router.tsx`): sair da home no meio e voltar a deixa no meio; uma página nunca visitada abre no topo. Para voltar ao topo, rola-se para cima ou clica-se no link da própria página (`src/lib/volta-ao-topo.ts`, em qualquer link da loja). O menu solto fica parado na frente: ele tem o próprio nome de transição (`menu-flutuante`), então só o que está atrás se move. A busca e o carrinho não arrastam, nem as páginas fora do menu (produto, checkout...). Usa as View Transitions do navegador (`defaultViewTransition` do TanStack Router com o tipo da transição); nos navegadores sem esse recurso, a troca é sem animação |
| **Topo das páginas** (`PaginaTopo`)                                   | As páginas internas (catálogo, suporte, área do cliente, login, políticas, busca, carrinho, checkout, 404...) seguem o visual do topo da home: fundo preto com uma foto de roupa apagada, o caminho em rótulo ("■ [ SUPORTE / FAQ ]"), o título grande em Anton com o número da página e cards de aviso à direita (`CardAviso`). O conteúdo vem embaixo, em branco, com caixas quadradas de borda fina, alinhado ao menu                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Abrir e fechar** (`usePresenca`)                                    | A gaveta do carrinho entra pela direita com o fundo escurecendo e sai pelo mesmo lado (Esc também fecha), e os itens entram em sequência. A busca desce de baixo dos botões e sobe ao fechar, com o ícone trocando girando. O menu de suporte desce com as opções em sequência. O número do carrinho dá um pulo quando muda. As animações são por keyframes (`tw-animate-css`), e `usePresenca` mantém o elemento na tela até a saída terminar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Último drop** (`DropHorizontal`)                                    | O drop em destaque (ver [Tags e filtros do catálogo](#tags-e-filtros-do-catálogo)), com as peças dele, da mais nova para a mais antiga. Com o mesmo espaço em cima e embaixo, a seção só fica presa quando chega ao meio da tela; aí a rolagem empurra as peças para o lado, com a barra de progresso laranja. As peças encolhem em telas baixas para a seção caber inteira. No celular, a fila rola com o dedo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Descida da home** (`StyleCards`, `useRevelar`)                      | A home segue: topo, os dois cards (CASUAL e TREINO, de ponta a ponta), DESTAQUES, o drop (ou o EM BREVE), a newsletter e o rodapé. O drop é uma faixa preta, sem borda, entre duas seções claras. Os títulos e as peças de DESTAQUES, o EM BREVE e a newsletter sobem de leve ao aparecer na tela, uma vez só (`src/hooks/useRevelar.ts`, com `data-revela` em cada elemento)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

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

| Variável         | Onde vale            | O que faz                                                                                                                             |
| ---------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_USAR_API`  | Navegador e servidor | `true` busca os dados na API; `false` usa a demonstração                                                                              |
| `PACK_BFF_CHAVE` | Só no servidor       | A chave do IP do visitante (ver [O IP real do visitante](#o-ip-real-do-visitante)). Na produção, vem só da hospedagem, nunca do build |
| `PACK_API_URL`   | Só no servidor       | Endereço da API. Não tem `VITE_`, então nunca vai para a página (o build confere: só o código do servidor o tem)                      |

- **API local no `npm run dev`:** é preciso subir o backend antes, de dentro de `backend/`: `docker compose up -d` (para desligar, `docker compose stop`). Com a API fora do ar, a home abre sem as linhas de produtos, e o catálogo mostra o erro com o botão TENTAR DE NOVO.
- **Mudar só na sua máquina:** crie um `.env.development.local` (fica fora do git), com base no `.env.example`. Ele vale mais que o `.env.development`.
- **Produção:** o endereço do `.env.production` fica gravado no código do servidor no build. A variável `PACK_API_URL` da hospedagem vale mais: na Cloudflare, ela fica no `wrangler.jsonc` (ver [Publicação](#publicação-cloudflare)).

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

## Publicação (Cloudflare)

O site fica na **Cloudflare Workers**: o servidor (o BFF, que monta as páginas e conversa com a API) e os arquivos da página ficam num Worker chamado `pack-loja`, em `https://pack-loja.<conta>.workers.dev`. O plano grátis cobre 100 mil acessos por dia, sem cartão: se passar, o site para de responder naquele dia, mas nada é cobrado. O HTTPS é automático, e o Worker não "dorme" quando fica parado.

**Como o build vira um Worker:** o Nitro (preset `cloudflare-module`, no `vite.config.ts`) empacota o servidor em `.output/server/` e os arquivos da página em `.output/public/`, e junta o [`wrangler.jsonc`](wrangler.jsonc) à configuração que ele mesmo gera. O `wrangler`, a ferramenta da Cloudflare, publica esse resultado. Ele é uma dependência de desenvolvimento, com a versão fixa no `package.json`: nada é instalado fora do projeto.

**O que fica onde:**

| O quê                                                | Onde                   | Observação                                                                                                                                      |
| ---------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Nome, data de compatibilidade, `nodejs_compat`, logs | `wrangler.jsonc` (git) | O `nodejs_compat` dá ao servidor o `process.env`, de onde ele lê as variáveis                                                                   |
| `PACK_API_URL`                                       | `wrangler.jsonc` (git) | O endereço público da API. Também fica gravado no build, pelo `.env.production`                                                                 |
| `PACK_BFF_CHAVE`                                     | Segredo na Cloudflare  | O mesmo valor do segredo `pack-bff-chave` do Secret Manager do Google. Nunca vai para o git nem para o build, e continua guardado a cada deploy |
| `CLOUDFLARE_API_TOKEN`                               | Segredo do GitHub      | Token que deixa o GitHub Actions publicar o Worker (e só isso)                                                                                  |
| `CLOUDFLARE_ACCOUNT_ID`                              | Variável do GitHub     | O ID da conta na Cloudflare. Não é segredo                                                                                                      |

**Deploy automático:** a cada envio para a `main`, o job "Deploy do site na Cloudflare" do [CI/CD](../.github/workflows/README.md#cd-do-site-cloudflare) confere o código, roda os testes, monta o build e publica. Se algo falha, a versão no ar continua a anterior.

**Comandos** (de dentro de `frontend/`):

```bash
npx wrangler login                       # entra na conta (abre o navegador); só para os comandos à mão
npm run build && npx wrangler dev        # roda o build como na Cloudflare, em http://localhost:8787
npm run build && npx wrangler deploy     # publica à mão (o normal é o deploy automático)
npx wrangler secret put PACK_BFF_CHAVE   # grava ou troca o segredo (pede o valor, sem mostrar)
npx wrangler tail                        # logs do site no ar, ao vivo
npx wrangler rollback                    # volta para a versão publicada anterior
```

**Configuração inicial** (feita uma vez):

1. Criar a conta na Cloudflare (grátis) e entrar com `npx wrangler login`.
2. Publicar a primeira vez: `npm run build && npx wrangler deploy`.
3. Gravar a chave do IP do visitante, copiada do Google sem aparecer na tela (o `gcloud` é temporário, ver [`google-cloud/FERRAMENTAS.md`](../google-cloud/FERRAMENTAS.md)):
   `gcloud secrets versions access latest --secret=pack-bff-chave | npx wrangler secret put PACK_BFF_CHAVE`
4. Criar o token para o GitHub no painel da Cloudflare (_My Profile → API Tokens → Create Token_, modelo **Edit Cloudflare Workers**) e guardá-lo no GitHub como o segredo `CLOUDFLARE_API_TOKEN`. O ID da conta (na página inicial do painel) vira a variável `CLOUDFLARE_ACCOUNT_ID`.

**Cuidados:**

- **Data de compatibilidade:** a do `wrangler.jsonc` não pode passar da que o `wrangler` do `package.json` suporta, senão o `wrangler dev` não sobe. Ao mudar a data, confira o site de novo.
- **Trocar a chave do IP:** troque nos dois lados (o segredo `pack-bff-chave` no Google e o `PACK_BFF_CHAVE` na Cloudflare). Com chaves diferentes, a API não aceita o IP enviado pelo site, e os limites por IP voltam a valer para o site inteiro.

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
| `wrangler.jsonc`                     | Configuração do site na Cloudflare: nome do Worker, compatibilidade e o `PACK_API_URL` (ver [Publicação](#publicação-cloudflare))                             |
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

O navegador nunca chama a API direto: ele chama uma **função de servidor** do TanStack Start, e o servidor do frontend chama a API. É o padrão **BFF** (_backend for frontend_). Assim, o endereço da API e o token do login ficam só no servidor.

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

- **O banco filtra, não a loja:** no modo API, cada página do catálogo é um `GET /api/v1/products?estilo=&categoria=&colecao=&novidades=&disponiveis=&ordem=&pagina=&tamanho=8` (`catalogoDaApi`, em `src/lib/api/catalogo-api.ts`). A URL da loja usa o slug da tag (`drop-natal`) e a API o nome gravado (`drop natal`): o servidor da loja faz a ponte pela lista de tags. O total de peças vem com a primeira página, e o CARREGAR MAIS pede a próxima (`useInfiniteQuery`, com a consulta em `components/catalog/consulta.ts`). As rotas `/catalogo`, `/catalogo/estilo/categoria` e `/colecao/...` já trazem a primeira página do servidor. O filtro DESTAQUES é a exceção: os até 48 mais vendidos são filtrados e recortados na loja.

- **As opções vêm das tags:** os dropdowns de ESTILO, CATEGORIA e COLEÇÃO do `/catalogo` e as rotas `/catalogo/estilo/categoria` usam as tags da API com esses filtros (`getOpcoesDoCatalogo` e `getCollections`, em `src/lib/api/catalogo.ts`). Criar a tag `moletons` com o filtro Categoria já faz "Moletons" aparecer em todos esses lugares; um par estilo/categoria que não existe dá 404. Na demonstração, as opções são as tags iniciais abaixo.
- **Tags que a loja cria sozinha** (`TagsIniciais`, no backend, ao subir a API): os estilos **fixos** `casual` e `treino`, que não podem ser apagados, renomeados nem mudar de filtro (na aba Tags aparecem como FIXA, sem editar nem excluir), e as categorias `camisa`, `bermuda` e `conjunto`, criadas só num banco sem nenhuma categoria (podem ser editadas e apagadas, e não voltam depois). Os cards CASUAL e TREINO da home levam ao catálogo já filtrado pelo estilo (`/catalogo?style=casual`).
- **Tags obrigatórias:** a API só cria um produto com pelo menos uma tag de estilo e exatamente uma de categoria (`tagIds` no `POST /products`). Ela recusa tirar a categoria ou o único estilo de um produto, ligar uma segunda categoria, mudar o filtro de uma tag que está em produtos e apagar uma tag de estilo ou de categoria em uso.
- **O nome sozinho não decide nada:** uma tag `camisetas` sem filtro não vira categoria. Para entrar num filtro, a tag precisa ter o filtro escolhido no painel.
- **Normalização:** antes de comparar, a tag perde acentos e maiúsculas, e espaços viram hífen. "Drop Natal", "DROP-NATAL" e "drop natal" são a mesma tag.
- **Produto ativo ou inativo** (painel, aba Produtos): todo produto novo começa **inativo** e só aparece na loja depois de ATIVAR. DESATIVAR tira da loja (catálogo, busca, destaques, drop) sem perder pedidos nem estoque; a página do produto continua abrindo, com PRODUTO INDISPONÍVEL no lugar da compra. Excluir só vale para produto que nunca esteve em um pedido; se esteve, o painel pede para desativar. Na API: `PATCH /api/v1/products/{id}/ativar` e `/desativar`, e o campo `ativo` do produto vira o `active` das telas.
- **Aba Tags** (`TagsPanel`, com `src/lib/api/tags-painel.ts` e as funções de servidor de `tags-api.ts`): lista todas as tags, o filtro de cada uma e quantos produtos a usam; cria, edita e apaga. No modo API, ler é público, mas criar, editar e apagar pedem o login da equipe na API, com a permissão `CATALOG_WRITE`, que ainda não está ligado. Na demonstração, as tags ficam na memória, com o filtro que cada tag de exemplo teria na API; renomear ou apagar muda também os produtos.
- **Curadoria sem tag:** no modo API, os filtros de curadoria não usam tag.
  - **Destaques** são os mais vendidos, em ordem (`GET /api/v1/products/mais-vendidos`): primeiro os mais vendidos dos últimos 90 dias; faltando peças, os mais vendidos desde sempre que ainda não estão na lista; faltando ainda, os cadastrados mais recentemente. Só contam os pedidos pagos (PAGO, EM_SEPARACAO, ENVIADO, ENTREGUE). A home mostra 4, e o filtro do catálogo até 48. A API guarda o ranking na memória por 3 dias (os produtos em si, com preço e estoque, são lidos a cada visita).
  - **Novidades** (filtro `novo-drop` do catálogo) e o **selo NOVO** dos cards: o produto, ou uma variante dele (uma cor ou um tamanho novo), foi cadastrado nos últimos 3 meses (`ehNovo`, em `src/lib/api/catalogo.ts`). As variantes cadastradas antes de a API guardar a data delas contam como antigas.
  - Na demonstração, os destaques continuam marcados na peça, e as peças do drop contam como novas.
- **Coleções:** a API não tem a entidade coleção. No modo API, as coleções são as tags com filtro `COLECAO`, já na ordem de lançamento (`GET /api/v1/tags/colecoes`: primeiro o drop com a peça cadastrada mais recentemente; as sem peças no fim).
- **Drop em destaque da home** (`getDropEmDestaque`, em `src/lib/api/catalogo.ts`; no modo API, `GET /api/v1/products/drop-em-destaque`, que acha o drop e as peças sem a loja buscar o catálogo): é o drop da peça cadastrada mais recentemente (`criadoEm` da API) entre as que estão em alguma coleção (tag com filtro `COLECAO`; na demonstração, as tags `drop-...`). O nome pode ser qualquer um (`drop-natal`, `natal`, `drop-02`). Para lançar um drop, basta criar a tag com o filtro Coleção e cadastrar as peças com ela: não precisa tirar nada das peças antigas. O card do topo e a seção do drop mostram o nome ("DROP NATAL"), as peças dele e os links para a coleção; sem nenhuma peça em coleção, os dois mostram o EM BREVE. Uma peça pode estar no drop e nos destaques ao mesmo tempo. A curadoria `novo-drop` continua só como filtro do catálogo e para o selo NOVO.

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

| Área                                | No modo API                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catálogo, busca e produto           | **Ligado.** `GET /api/v1/products` (com os filtros e em páginas) e `GET /api/v1/products/{id}`. A busca por nome vai para a API quando tem 3 letras ou mais, o mínimo dela                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Drops (coleções)                    | **Ligado**, a partir das tags (`GET /api/v1/tags/colecoes` e `GET /api/v1/products/drop-em-destaque`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Tabela de medidas                   | Continua na demonstração: a API só tem os nomes dos tamanhos, sem as medidas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Login e cadastro (cliente e equipe) | **Ligado** (`autenticacao-api.ts`). Entrar e criar conta chamam `POST /api/v1/auth/login`, `/auth/staff/login` ou `/auth/register` e guardam o token num cookie `httpOnly` (`pack_token_cliente` ou `pack_token_equipe`, duas sessões separadas) que vence junto com ele (60 min). Quem está logado vem do `GET /api/v1/auth/me`; token vencido ou inválido apaga o cookie e a pessoa volta a ver o "entrar". Sair apaga o cookie (a API não tem logout). A troca de senha vai para `PATCH /api/v1/auth/senha`. A recuperação por e-mail ainda não existe: a tela manda falar com o suporte                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Abas do painel                      | **Pelas permissões da API** (`canStaff`, em `autenticacao.ts`): Produtos, Coleções e Tags com `CATALOG_WRITE`; Estoque com `INVENTORY_MANAGE`; Pedidos com `ORDER_MANAGE`; Clientes e Atendimento com `CUSTOMER_READ`; Cupons com `COUPON_MANAGE`; Colaboradores e Newsletter com `STAFF_MANAGE`. Um papel novo criado na API funciona sem mudar o site. O topo mostra o nome do papel                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Área do cliente                     | **Ligado** (`conta-api.ts`). Dados (`GET`/`PUT /customers/{id}`, telefone obrigatório), newsletter da conta (`.../newsletter`), endereços com bairro, apelido e principal (`.../addresses`) e pedidos (`.../orders`, em páginas, e `GET /orders/{id}`), com a foto, o tamanho e a cor de cada item. O id do cliente vem do próprio token, e a API confere o dono em toda chamada. O cliente cancela o pedido enquanto ele está aguardando pagamento ou pago (`POST /orders/{id}/cancelar`). Trocas e devoluções são pelo atendimento: com a API, não há formulário. Os status são os da API (aguardando pagamento, pago, em separação, enviado, entregue, cancelado e devolvido, em `src/lib/dominio.ts`); a API não cobra frete, então o frete do pedido aparece como R$ 0                                                                                                                                                                                                                                                                                                           |
| Newsletter                          | **Ligado.** O formulário da home e da página da newsletter chama `POST /api/v1/newsletter`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Carrinho                            | **Ligado** (`lib/cart.tsx` e `compra-api.ts`). A peça é a **variante** (tamanho + cor): a página do produto mostra o seletor de cor quando o produto tem mais de uma, e o estoque de cada tamanho é o da cor. Sem login, o carrinho fica no navegador (`localStorage`); ao entrar, os itens vão para o carrinho da API (somando com o que já havia) e saem do navegador. Logado, cada mudança é uma chamada (`POST`, `PATCH` e `DELETE .../cart/items`), e a API confere o estoque (o aviso aparece no carrinho)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Frete e cupom                       | **Ligado.** A calculadora da página do produto e o checkout usam `GET /api/v1/frete` (PAC e SEDEX da tabela da API). O cupom é conferido com `GET /api/v1/coupons/validar` (precisa de login)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Checkout e confirmação              | **Ligado.** Pede login (e volta ao checkout depois de entrar), começa pelo endereço principal, salva o endereço digitado na conta, cria o pedido (`POST .../orders { addressId, frete, codigoCupom }`) e registra o pagamento pelo total da API. O pagamento é **aprovado na hora, simulado pela API** (sem cobrança), até entrar um gateway                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Painel                              | **Ligado** (`components/admin/api/` e `painel-api.ts`). Cada aba busca os próprios dados pela ponte do painel, uma função de servidor que chama a API com o token da equipe: ela só aceita caminhos da API, e quem decide o que cada colaborador pode fazer é a própria API. **Visão geral** (`GET /painel/resumo`, para toda a equipe); **Produtos** (ativos e inativos, ativar e desativar, e o editor com dados, tags, variantes com tamanho, cor, SKU e estoque inicial, e fotos enviadas para o bucket, reduzidas no navegador para até 1600 px em WebP); **Coleções** (as tags de coleção, as peças de cada uma, pôr e tirar peças, criar, renomear e apagar); **Estoque** (cada variante, com o filtro de estoque baixo, os movimentos e o histórico); **Pedidos** (todos, e no detalhe o pagamento, o envio, o rastreio e o cancelamento); **Cupons**, **Clientes**, **Colaboradores** (com o papel e as permissões), **Atendimento** (as mensagens do Contato) e **Newsletter**. Trocas são pelo Contato: com a API, a aba não aparece. A aba Tags é a mesma da demonstração |

### O IP real do visitante

O navegador não fala com a API: quem chama é o servidor do frontend. Sem cuidado, todos os visitantes chegariam à API com o IP dele e dividiriam os limites por IP (120 requisições por minuto, tentativas de login, cadastro, newsletter e contato). Por isso, em toda chamada, o servidor do frontend (`cabecalhosDoVisitante`, em `server/http.ts`) manda:

- `X-Pack-Ip-Visitante`: o IP do visitante. Na Cloudflare, o `CF-Connecting-IP`, que ela mesma preenche; fora dela, o IP da conexão (nunca o `X-Forwarded-For`, que o navegador pode inventar);
- `X-Pack-Bff-Chave`: a chave combinada com a API (`PACK_BFF_CHAVE`, só do servidor). A API só aceita o IP informado quando a chave confere.

No `npm run dev`, a chave é a do `.env.development`, a mesma do `backend/docker-compose.yml`, um valor público que só vale na sua máquina. Na produção, ela fica no segredo `pack-bff-chave` (etapa `ipreal` do [`setup.sh`](../google-cloud/gcloud-cli-scripts/setup.sh)) e, na hospedagem do site, na variável `PACK_BFF_CHAVE`. Ela nunca vai para o build.

### O que falta na API

Continua simulado até a API ganhar o equivalente:

- pagamento real (com a API, a aprovação é simulada) e frete com o preço real (com a API, o frete é de uma tabela por região);
- recuperação de senha (precisa de um serviço de e-mail);
- contato, trocas (com a API, são pelo atendimento) e coleções com nome e descrição;
- conteúdo: FAQ, termos e as promoções do topo da home;
- os números do painel.

**O IP do visitante:** a API recebe o IP real de cada visitante, com a chave combinada (ver [O IP real do visitante](#o-ip-real-do-visitante)), e os limites por IP valem por pessoa, e não para o site inteiro.

## Segurança

O frontend não protege dados: quem confere token, dono do recurso, permissões, preço, estoque, cupom e frete é a API, em toda requisição. As travas de cargo e de sessão das telas são só experiência de uso. O que o frontend faz:

- **Token fora do navegador:** no modo API, o JWT fica num cookie `httpOnly` (o JavaScript da página não consegue ler), `Secure` fora do `npm run dev` (só vai por HTTPS) e `SameSite=Lax`: outro site não consegue mandá-lo num POST (as funções de servidor que alteram dados são POST), mas quem chega por um link de fora (e-mail, rede social) já abre a página logado, o que o `Strict` não deixaria. Nunca no `localStorage`.
- **Endereço da API só no servidor:** `PACK_API_URL` não tem `VITE_`, e o build proíbe o código da pasta `server/` no navegador. Conferido no build: nem o endereço nem o nome do cookie aparecem nos arquivos da página.
- **Entrada conferida no servidor:** as funções de servidor validam o que o navegador manda (id no formato UUID, busca curta) e só chamam caminhos que começam em `/api/v1/`.
- **Erros sem detalhes internos:** um erro 5xx da API vira uma mensagem genérica; os 4xx mostram a mensagem da API, que é escrita para o usuário.
- **Imagens:** só URLs `http(s)` vindas da API viram imagem.
- **Cabeçalhos em todas as respostas** (`src/server.ts`): `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` e `frame-ancestors 'none'` (a loja não abre dentro de um iframe de outro site), `Referrer-Policy` e `Permissions-Policy` (sem câmera, microfone e localização). Quando o site é aberto por HTTPS (na Cloudflare, sempre), também o **HSTS** (`Strict-Transport-Security`, por um ano): o navegador passa a entrar só por HTTPS, mesmo num link `http://`.
- **Ainda a fazer:** uma CSP completa, que precisa de _nonce_ para os scripts que o TanStack Start põe na página.

## Testes e qualidade

```bash
npm test             # 50 testes (Vitest)
npm run typecheck    # TypeScript estrito, sem variáveis ou parâmetros sem uso
npm run lint         # ESLint
```

No GitHub, o job "Frontend (testes + build)" do [CI/CD](../.github/workflows/README.md) roda os três e o build a cada envio e pull request. O Prettier aceita o final de linha de cada sistema (`"endOfLine": "auto"`): no Windows o git baixa os arquivos com CRLF, e no repositório eles ficam com LF.

Os testes ficam ao lado do código testado (`*.test.ts`):

| Arquivo                       | O que testa                                                                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/api.test.ts`             | A simulação da API: coleções, permissões por cargo, endereços, estoque no checkout, cancelamento e cupons                                      |
| `lib/checkout.test.ts`        | O cálculo de subtotal, desconto, frete e total                                                                                                 |
| `lib/api/adaptadores.test.ts` | A tradução da Pack API: tags nos filtros, produto da API (com e sem imagens, tags e variantes), filtros com o catálogo vazio e os erros da API |
| `lib/table.test.ts`           | A busca, os filtros e a ordenação das tabelas do painel, e a exportação CSV (inclusive a proteção contra fórmulas)                             |

## Pendências

- **Recuperar senha por e-mail:** precisa de um serviço de envio de e-mail na API.
- **Compra de verdade:**
  - pagamento real (Pix e cartão) e o retorno do pagamento;
  - frete com o preço real (por peso e medidas, num serviço externo);
  - e-mails do pedido.
- **Conta:** recuperação de senha por e-mail.
- **Conteúdo:** revisar os textos de demonstração (FAQ e termos, em `src/data/content.ts`).

## Documentação

| Arquivo                                                  | O que mostra                                                    |
| -------------------------------------------------------- | --------------------------------------------------------------- |
| [`docs/estrutura-pastas.svg`](docs/estrutura-pastas.svg) | As pastas e o que fica em cada uma                              |
| [`docs/rotas.svg`](docs/rotas.svg)                       | Cada página: URL, arquivo, o que mostra e de onde vêm os dados  |
| [`docs/fluxo.svg`](docs/fluxo.svg)                       | O código de uma compra, etapa por etapa, com os erros possíveis |

Os diagramas são gerados por scripts Python em `docs/geradores/`. O código mostrado no `fluxo.svg` é copiado à mão no `gen_fluxo.py`, então, quando o código mudar, esse script precisa ser atualizado e rodado de novo.
