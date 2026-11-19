# CI/CD

Como cada mudança na Pack é testada (CI), verificada em segurança (CodeQL e Trivy) e publicada (CD) automaticamente pelo **GitHub Actions**: a API no Google Cloud Run e o site na Cloudflare.
- O desenvolvimento local e os testes estão no [README principal](../../README.md).
- Onde a API roda e como o custo fica em zero está em [`google-cloud/`](../../google-cloud/README.md).
- Como o site roda na Cloudflare está em [`frontend/README.md`](../../frontend/README.md#publicação-cloudflare).

## Como está organizado

Tudo o que o GitHub Actions usa fica em `.github/`, dividido em duas pastas, como é a convenção do GitHub:

```
.github/
├── workflows/
│   ├── ci-cd.yml             ← o workflow: QUANDO rodar e EM QUE ORDEM (o GitHub lê esta pasta sozinho)
│   └── README.md             ← este arquivo
└── actions/                  ← os PASSOS de cada etapa (ações locais, ou composite actions)
    ├── ci-backend/action.yml  ← o CI do backend: testes, imagem Docker e Trivy
    ├── ci-frontend/action.yml ← o CI do site: ESLint, tipos, testes e build
    ├── codeql/action.yml      ← a análise de segurança do código (CodeQL)
    ├── deploy/action.yml      ← o CD da API: publicação no Google Cloud Run
    └── deploy-site/action.yml ← o CD do site: publicação na Cloudflare
```

- **`workflows/`:** o GitHub roda **todo** arquivo `.yml` desta pasta como workflow. Por isso aqui fica só o `ci-cd.yml`, e os passos ficam em `actions/`. Este README não atrapalha, porque o GitHub só considera os arquivos `.yml`.
- **`actions/`:** cada pasta é uma ação com um `action.yml`. Ela só roda quando um workflow a chama com `uses:`.
- **O README fica em `workflows/`, e não solto em `.github/`:** um `README.md` direto em `.github/` tomaria o lugar do README principal na página do repositório.

O workflow só baixa o código e chama as ações:

```yaml
- uses: actions/checkout@3d3c42e5... # v7.0.1   baixa o código (as ações locais estão nele)
- uses: ./.github/actions/ci-backend          # roda os passos do CI
```

O frontend tem as suas ações (`ci-frontend` e `deploy-site`) e os seus jobs, que rodam ao lado dos da API sem depender deles.

### Quem faz o quê

O CI/CD roda **no GitHub**, mas usa ferramentas de vários donos:

| Dono | O que faz aqui |
|---|---|
| **GitHub** (Actions) | Cria a máquina Linux temporária de cada job, segue os passos e emite o token OIDC do deploy |
| **Maven** e **Testcontainers** | Compilam e rodam os testes, com um PostgreSQL descartável |
| **Docker** (já vem na máquina do GitHub) | `docker build` monta a imagem; no CD, `docker push` a envia ao Google |
| **Aqua Security** (Trivy) e **GitHub** (CodeQL) | Procuram vulnerabilidades na imagem e no código |
| **Google** (ações `google-github-actions/...`) | Entram no Google Cloud com o token, instalam o `gcloud` na máquina e publicam no Cloud Run |
| **Google Cloud** | Recebe a imagem (Artifact Registry) e a roda (Cloud Run). Fica fora do GitHub, em [`google-cloud/`](../../google-cloud/README.md). |
| **Node.js** e **npm** | Instalam as dependências do site e rodam o ESLint, o TypeScript, o Vitest e o build |
| **Cloudflare** (`wrangler`) | Recebe o build do site e o publica no Worker `pack-loja` |

O login sem senha usa o **OIDC (OpenID Connect)**, um padrão aberto. O GitHub emite o token, e quem aceita é a nuvem. No Google Cloud o recurso que aceita se chama Workload Identity Federation; a AWS e a Azure têm o equivalente.

## O caminho de uma mudança

Cada job roda numa **máquina Linux temporária** do GitHub, criada para a execução e apagada no fim.

```
git push / pull request
        │
        ▼
GitHub lê .github/workflows/ci-cd.yml
        │
        ▼
┌─ job "backend" (CI) ── ci-backend ───────┐   falhou → ✗ para aqui, nada é publicado
│ 1. instala o Java 21 (com cache)         │            (relatórios dos testes ficam
│ 2. ./mvnw test   (249 testes)            │             para download)
│ 3. docker build  (confere a imagem)      │
│ 4. Trivy         (CVEs na imagem)        │
└────────────────┬─────────────────────────┘
                 │       ao mesmo tempo, em outra máquina:
                 │       ┌─ job "codeql" ── codeql ─────────────────┐
                 │       │ compila e analisa o código Java          │──► alertas na aba Security
                 │       └──────────────────────────────────────────┘
                 │ passou, e é push na main?
                 ▼
┌─ job "deploy" (CD) ── deploy ────────────┐
│ 1. entra no Google Cloud (sem senha)     │
│ 2. monta e envia a imagem                │──► Artifact Registry (São Paulo)
│ 3. publica no Cloud Run                  │──► nova revisão da API
└──────────────────────────────────────────┘

ao mesmo tempo, o site, em outras máquinas:

┌─ job "frontend" (CI) ── ci-frontend ─────┐   falhou → ✗ o site não é publicado
│ 1. instala o Node 24 (com cache do npm)  │
│ 2. npm ci                                │
│ 3. ESLint, TypeScript e Vitest           │
│ 4. npm run build (servidor + página)     │
└────────────────┬─────────────────────────┘
                 │ passou, e é push na main?
                 ▼
┌─ job "deploy-site" (CD) ─────────────────┐
│ 1. ci-frontend de novo (máquina limpa)   │
│ 2. wrangler deploy                       │──► nova versão do Worker pack-loja
└──────────────────────────────────────────┘
```

O resultado aparece:
- na aba [Actions](https://github.com/Leony99/Pack/actions), com o log de cada passo;
- como ✓ ou ✗ em cada commit;
- no selo do README principal.

## CI: integração contínua

**Quando:** a cada envio para a `main` e a cada pull request.

**Passos** ([`actions/ci-backend/action.yml`](../actions/ci-backend/action.yml)):

1. **Instala o Java 21.** As dependências do Maven ficam em cache entre execuções, o que deixa as seguintes mais rápidas.
2. **Roda os 249 testes** (`./mvnw test`): unidade, integração e concorrência.
   - O Testcontainers sobe um PostgreSQL 18 descartável no Docker, que já vem instalado na máquina do GitHub.
   - Não há segredo envolvido: os testes definem a própria configuração e não dependem de `.env`.
3. **Monta a imagem Docker**, só para conferir que o [`Dockerfile`](../../backend/Dockerfile) continua funcionando.
4. **Varre a imagem com o Trivy** e reprova se ela tiver uma vulnerabilidade conhecida CRÍTICA ou ALTA que já tenha correção (ver [Segurança no CI](#segurança-no-ci-codeql-e-trivy)).

**Se algo falha:**
- a execução para ali, e o commit fica marcado com ✗;
- nada é publicado, e a versão no ar continua a anterior;
- os relatórios dos testes são guardados e podem ser baixados na página da execução;
- o GitHub avisa por e-mail.

Pull requests passam pelo CI, mas nunca seguem para o CD.

### CI do site

**Passos** ([`actions/ci-frontend/action.yml`](../actions/ci-frontend/action.yml)), num job próprio (`frontend`), ao mesmo tempo que o da API:

1. **Instala o Node 24**, com os pacotes do npm em cache entre execuções.
2. **`npm ci`:** instala exatamente as versões do `package-lock.json`, e falha se ele estiver desatualizado.
3. **Confere o código:** ESLint (com o Prettier) e o TypeScript estrito.
4. **Roda os testes** do Vitest.
5. **Monta o build** da Cloudflare (`npm run build`), o mesmo que é publicado. Não precisa de segredo: o endereço da API é público.

## Segurança no CI: CodeQL e Trivy

As duas ferramentas rodam nas máquinas do GitHub, a cada pull request e a cada envio para a `main`. Nada é instalado no computador de quem desenvolve.

```
                        ┌─ CodeQL ── o código que escrevemos ──► falhas no nosso código
pull request / push ────┤
                        └─ Trivy ─── a imagem Docker pronta ───► falhas no que usamos de terceiros
```

### CodeQL: o nosso código

**O que é:** a análise estática do GitHub, gratuita em repositório público.

**Como funciona:**
1. O CodeQL acompanha a compilação da API (`./mvnw package`).
2. Ele transforma o código num banco de dados: classes, métodos, de onde vem cada valor e para onde ele vai.
3. Roda consultas que procuram caminhos perigosos. Exemplos: um texto que vem da requisição e chega a uma consulta SQL ou a um log sem tratamento; uma comparação de segredo vulnerável a medição de tempo; uma configuração de segurança desligada.

**Onde está:**
- os passos estão em [`actions/codeql/action.yml`](../actions/codeql/action.yml);
- ele roda num job próprio (`codeql`), em paralelo com o CI;
- usa o conjunto `security-extended`, o mais amplo só de segurança.

**Resultado:**
- os alertas aparecem na aba **Security → Code scanning** do repositório, com o trecho do código e o caminho do dado;
- num pull request, os alertas novos aparecem como comentários nas linhas alteradas;
- o job não reprova o PR, mas o alerta fica aberto até ser corrigido ou dispensado com uma justificativa.

O job precisa da permissão `security-events: write` para enviar os alertas, e só ela.

### Trivy: o que vem de terceiros

**O que é:** o scanner de vulnerabilidades da Aqua Security, de código aberto.

**Como funciona:** ele abre a imagem Docker gerada no CI, lista cada pacote que existe nela e compara as versões com as bases públicas de vulnerabilidades conhecidas (CVEs). Na imagem da API, isso cobre:
- o sistema da imagem base (Alpine);
- o Java (o JRE do `eclipse-temurin`);
- as bibliotecas dentro do `app.jar`, como o Spring, o Hibernate e o driver do PostgreSQL.

**Regra:** reprova o CI só quando há uma CVE **CRÍTICA ou ALTA com correção disponível** (`ignore-unfixed`). Uma vulnerabilidade sem correção não tem o que fazer além de esperar, e travaria todo PR. A lista aparece no log do passo, com o pacote, a versão atual e a versão corrigida.

**Cuidado:** uma CVE publicada hoje pode reprovar um PR que não mexeu em nada. A correção costuma ser atualizar a imagem base no [`Dockerfile`](../../backend/Dockerfile) ou a dependência no `pom.xml`.

### Ações fixadas pelo SHA

Todas as ações de fora do repositório são referenciadas pelo **SHA do commit**, e não pela tag (`@v4`):

```yaml
uses: aquasecurity/trivy-action@ed142fd0673e97e23eac54620cfb913e5ce36c25 # v0.36.0
```

**Por quê:** a tag é só um apelido, e quem controla o repositório da ação pode apontá-la para outro código. Isso já aconteceu: em março de 2026, o próprio `trivy-action` sofreu um ataque à cadeia de suprimentos, e quem usava as tags afetadas rodou no CI um código que não era o publicado. Depois disso, o projeto recriou as tags com o prefixo `v`; a v0.36.0 usada aqui é posterior.

O SHA identifica um código exato e não pode ser trocado. A versão do binário do Trivy também é fixa (`version: v0.76.1`).

**Para atualizar:** pegar o SHA da versão nova na página de releases da ação e trocar os dois (o SHA e o comentário). Prefira versões com algumas semanas de lançamento.

O risco vem do repositório **da ação**, e não do Pack: mesmo que só uma pessoa tenha acesso ao Pack, quem controla a ação pode mudar o que a tag aponta. O cuidado maior é com as ações do job de deploy, que tem permissão para publicar no Cloud Run.

## CD: publicação contínua

**Quando:** só num envio para a `main` e só depois que o CI passou (`needs: backend`).

**Passos** ([`actions/deploy/action.yml`](../actions/deploy/action.yml)):

1. **Entra no Google Cloud sem senha (Workload Identity Federation).**
   - O GitHub gera um **token temporário assinado** (OIDC), dizendo "esta execução é do repositório `Leony99/Pack`, na branch `main`". Para isso, o job tem a permissão `id-token: write`.
   - O Google confere a assinatura e **só aceita esse repositório, e só na `main`**. Um workflow rodando em outra branch ou num pull request não consegue entrar, mesmo sendo do mesmo repositório.
   - Em troca, devolve um acesso de poucos minutos para a conta de serviço `github-deploy`.
2. **Monta e envia a imagem.** `docker build` usa o mesmo `Dockerfile` do desenvolvimento, e `docker push` envia a imagem ao **Artifact Registry**, em São Paulo. A tag é o código do commit (`pack-api:<sha>`), então cada versão publicada aponta para o código exato que a gerou.
3. **Publica no Cloud Run.** A ação `deploy-cloudrun` cria uma **revisão** nova do serviço `pack-api`, e ela passa a receber todo o tráfego. A revisão anterior continua guardada, e dá para voltar a ela pelo console.

**Garantias:**
- **Nenhuma senha no GitHub:** o login é pelo token temporário. A conta `github-deploy` e a ligação com o repositório foram criadas pelo [`google-cloud/gcloud-cli-scripts/setup.sh`](../../google-cloud/gcloud-cli-scripts/setup.sh) (etapas `contas` e `github`).
- **A conta de deploy pode pouco:** ela envia imagens e publica revisões, mas **não mexe em permissões**.
- **O deploy só troca a imagem:** memória, limites, variáveis, segredos e acesso público continuam como estão. Por isso um deploy nunca religa a API se o [disjuntor de custos](../../google-cloud/README.md#disjuntor-de-custos) a tiver desligado.
- **Um deploy por vez** (`concurrency`): dois envios seguidos não publicam ao mesmo tempo.

### CD do site (Cloudflare)

**Quando:** só num envio para a `main` e só depois que o CI do site passou (`needs: frontend`). Não depende dos jobs da API: uma mudança só no site é publicada mesmo que a API não mude, e vice-versa.

**Passos** (job `deploy-site`):

1. **Monta o build de novo**, com a mesma ação do CI (`ci-frontend`), porque cada job começa numa máquina limpa.
2. **Publica** com `npx wrangler deploy` ([`actions/deploy-site/action.yml`](../actions/deploy-site/action.yml)), usando o `wrangler` com a versão fixa no `package.json`. A Cloudflare cria uma versão nova do Worker `pack-loja` e passa todo o tráfego para ela. Dá para voltar à anterior com `npx wrangler rollback`.

**Garantias:**
- **O token só publica Workers:** o segredo `CLOUDFLARE_API_TOKEN` é criado com o modelo *Edit Cloudflare Workers* e não mexe no resto da conta.
- **O segredo do site não passa pelo GitHub:** o `PACK_BFF_CHAVE` fica guardado na Cloudflare e continua lá a cada deploy (ver [Publicação](../../frontend/README.md#publicação-cloudflare)).
- **Um deploy do site por vez** (`concurrency: deploy-site`).

### Variáveis do GitHub

O workflow lê 5 **variáveis** do repositório (*Settings → Secrets and variables → Actions → Variables*) e as passa para as ações de deploy. Nenhuma é secreta: sozinhas, elas não dão acesso a nada.

| Variável | O que é |
|---|---|
| `GCP_PROJECT_ID` | O projeto do Google Cloud |
| `GCP_REGION` | `southamerica-east1` (São Paulo) |
| `GCP_WIF_PROVIDER` | O provedor que aceita os tokens do GitHub |
| `GCP_DEPLOY_SA` | A conta de serviço que o deploy assume |
| `CLOUDFLARE_ACCOUNT_ID` | O ID da conta na Cloudflare, para o deploy do site |

E um **segredo** (*Settings → Secrets and variables → Actions → Secrets*), que o GitHub esconde nos logs:

| Segredo | O que é |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Token da Cloudflare que só publica Workers, usado pelo deploy do site |

## Ações usadas

| Ação | Versão | Onde | Para quê |
|---|---|---|---|
| `actions/checkout` | v7.0.1 | workflow | Baixa o código, incluindo as ações locais de `.github/actions/` |
| `actions/setup-java` | v6.1.0 | CI e CodeQL | Instala o Java 21 e guarda o cache do Maven |
| `actions/setup-node` | v7.1.0 | CI e CD do site | Instala o Node 24 e guarda o cache do npm |
| `actions/upload-artifact` | v7.0.2 | CI | Guarda os relatórios dos testes quando algo falha |
| `aquasecurity/trivy-action` | v0.36.0 | CI | Instala o Trivy v0.76.1 na máquina do GitHub, só durante a execução, e varre a imagem |
| `github/codeql-action/init` e `/analyze` | v4.39.1 | CodeQL | Prepara o CodeQL, analisa o código e envia os alertas para a aba Security |
| `google-github-actions/auth` | v3.0.0 | CD | Login no Google Cloud com Workload Identity Federation |
| `google-github-actions/setup-gcloud` | v3.0.1 | CD | Instala o gcloud na máquina do GitHub, só durante a execução |
| `google-github-actions/deploy-cloudrun` | v3.0.1 | CD | Publica a imagem nova no serviço do Cloud Run |

Todas fixadas pelo SHA do commit (ver [Ações fixadas pelo SHA](#ações-fixadas-pelo-sha)); a versão fica no comentário ao lado.
