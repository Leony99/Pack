# Infraestrutura da Pack

Como a Pack API é empacotada, testada, publicada e mantida no ar sem custo:

| Peça | Função |
|---|---|
| **Docker** | Empacota a API com tudo de que ela precisa para rodar |
| **GitHub Actions** | Testa cada mudança (CI) e publica as aprovadas (CD) |
| **Google Cloud Run** | Roda a API |
| **Neon** | Guarda os dados |
| **Limitadores e disjuntor** | Mantêm o custo em zero |

## Sumário

- [Visão geral](#visão-geral)
- [Docker](#docker)
- [CI/CD com GitHub Actions](#cicd-com-github-actions)
- [Produção: Cloud Run + Neon](#produção-cloud-run--neon)
- [Limitadores](#limitadores)
- [Disjuntor de custos](#disjuntor-de-custos)
- [Arquivos desta pasta](#arquivos-desta-pasta)

## Visão geral

```
                        ┌──────────────── GitHub ─────────────────┐
  git push ───────────► │ repositório Leony99/Pack                │
                        │   │                                     │
                        │   ▼  GitHub Actions (.github/workflows) │
                        │  CI: testes + imagem Docker             │
                        │   │ passou e é a main?                  │
                        │   ▼                                     │
                        │  CD: envia a imagem e publica           │
                        └───┬─────────────────────────────────────┘
                            │ token OIDC (sem senha guardada)
┌─────────────────── Google Cloud · São Paulo (southamerica-east1) ──────────────────┐
│                           ▼                                                        │
│  Artifact Registry ──► Cloud Run: pack-api ◄──── Secret Manager                    │
│  (imagens, guarda 2)   (container Spring Boot,    (senha do banco, chave JWT,      │
│                         0 a 1 instância, 1 GB)     senha do admin)                 │
│                           ▲          │                                             │
│                           │          │                                             │
│  Orçamento R$ 5 ─► Pub/Sub ─► função disjuntor ── (gasto ≥ limite) ─► tira a API   │
│                                (pack-budget-guard)                     do ar (403) │
└───────────────────────────┼──────────┼─────────────────────────────────────────────┘
                            │          │ SSL
  usuário / Swagger ─https──┘          ▼
                            Neon · PostgreSQL 18 (AWS São Paulo)
```

| Peça | Onde roda | Função |
|---|---|---|
| **API Spring Boot** | Google **Cloud Run** | A aplicação, em container. O Cloud Run liga o container quando chega uma requisição e o desliga quando fica parado |
| **Banco** | **Neon** | PostgreSQL 18 gerenciado (serverless): processamento e armazenamento separados, e o processamento também desliga quando ninguém usa. Fica na mesma região da API |
| **Imagens** | **Artifact Registry** | Guarda as imagens Docker publicadas pelo CD |
| **Segredos** | **Secret Manager** | A API recebe a senha do banco, a chave do JWT e a senha do admin como variáveis de ambiente, sem que elas apareçam no código, na imagem ou no GitHub |
| **Pipeline** | **GitHub Actions** | CI a cada envio; CD a cada envio para a `main` que passa no CI |
| **Disjuntor de custos** | **Orçamento + Pub/Sub + Cloud Run functions** | Tira a API do ar sozinho se o gasto do mês chegar ao limite |

## Docker

O Docker empacota a API, com o Java e tudo de que ela precisa, numa **imagem**. A mesma imagem roda igual no seu computador, na máquina do GitHub e no Google Cloud. Ele aparece em três momentos:

| Onde | Para quê |
|---|---|
| **Seu computador** | `docker compose up` sobe a API e o banco juntos, sem instalar Java nem PostgreSQL |
| **CI** | Os testes sobem um PostgreSQL descartável em Docker (Testcontainers), e o CI monta a imagem para garantir que o `Dockerfile` funciona |
| **CD / produção** | A imagem montada pelo CD é a que o Cloud Run executa |

### Dockerfile: a imagem da API

[`backend/Dockerfile`](../backend/Dockerfile) monta a imagem em **duas etapas**:

```
┌─ etapa "build" ─────────────────┐      ┌─ imagem final ──────────────────────┐
│ Maven + JDK 21                  │      │ só o Java (JRE 21, base Alpine)     │
│ 1. copia o pom.xml e baixa as   │ ───► │ app.jar                             │
│    dependências (fica em cache) │ .jar │ usuário "pack", sem root            │
│ 2. copia o código e compila     │      │ java -XX:MaxRAMPercentage=75 -jar   │
└─────────────────────────────────┘      └─────────────────────────────────────┘
       descartada no fim                       ~127 MB, é o que roda
```

- **Duas etapas:** o Maven, o código-fonte e as dependências de teste ficam na etapa descartada. A imagem final leva só o `.jar` e o Java.
- **Cache das dependências:** o `pom.xml` é copiado antes do código. Quando só o código muda, o Docker reaproveita as dependências já baixadas.
- **Base Alpine:** um Linux mínimo, que deixa a imagem pequena. Isso importa porque o registro de imagens do Google tem só 0,5 GB grátis.
- **Sem root:** a API roda com um usuário comum. Se alguém invadir a aplicação, não tem poder sobre o container.
- **`MaxRAMPercentage=75`:** a JVM usa no máximo 75% da memória do container. Sem isso, num container de 1 GB o Java pode passar do limite e ser encerrado.
- **[`.dockerignore`](../backend/.dockerignore):** deixa de fora da imagem o `target/`, os docs e os arquivos `.env`. Senhas nunca entram na imagem.

### Docker Compose: ambiente local

[`docker-compose.yml`](../docker-compose.yml), na raiz, sobe dois serviços numa rede privada:

```
docker compose up --build
   ├─ db:  postgres:18, volume "pack-db-data" (os dados sobrevivem ao "down"),
   │       teste de saúde (pg_isready) a cada 5 s
   └─ api: imagem do backend/Dockerfile; só inicia quando o db está saudável;
           acha o banco pelo nome "db" (jdbc:postgresql://db:5432/pack-db)
```

| Comando | O que faz |
|---|---|
| `docker compose up --build` | Monta a imagem e sobe tudo |
| `docker compose up -d db` | Sobe só o banco (para rodar a API pelo `./mvnw`) |
| `docker compose down` | Desliga; os dados ficam no volume |
| `docker compose down -v` | Desliga e apaga os dados |
| `docker compose logs -f api` | Mostra o log da API ao vivo |

As senhas vêm do `.env` da raiz (modelo em [`.env.example`](../.env.example)). O mesmo arquivo serve para o `./mvnw` e para o Compose.

O banco local usa a **mesma versão do de produção** (PostgreSQL 18), e os testes também. O que passa aqui se comporta igual no Neon.

## CI/CD com GitHub Actions

Um workflow, [`.github/workflows/ci.yml`](../.github/workflows/ci.yml), com dois jobs. Cada job roda numa máquina Linux temporária do GitHub, criada para a execução e apagada no fim.

```
push / pull request
        │
        ▼
┌─ job "backend" (CI) ───────────────┐   falhou → ✗ para aqui, nada é publicado
│ 1. baixa o código                  │            (relatórios dos testes ficam
│ 2. instala o Java 21 (com cache)   │             para download)
│ 3. ./mvnw test   (177 testes)      │
│ 4. docker build  (confere imagem)  │
└────────────────┬───────────────────┘
                 │ passou, e é push na main?
                 ▼
┌─ job "deploy" (CD) ────────────────┐
│ 1. entra no Google Cloud (OIDC)    │
│ 2. monta e envia a imagem          │──► Artifact Registry
│ 3. publica no Cloud Run            │──► nova revisão de pack-api
└────────────────────────────────────┘
```

### CI: integração contínua

Roda **a cada envio para a `main` e a cada pull request**:

1. **Testes:** `./mvnw test` roda os 177 testes (unidade, integração e concorrência).
   - O Testcontainers sobe um PostgreSQL 18 descartável no Docker da própria máquina do GitHub.
   - Não há nenhum segredo envolvido: os testes definem a própria configuração.
2. **Imagem:** `docker build` confere que o `Dockerfile` continua funcionando.
3. **Se algo falha,** o pipeline para, o commit fica marcado com ✗, e os relatórios dos testes ficam disponíveis para download na página da execução.

O selo no README principal mostra o resultado da última execução. O histórico fica na aba [Actions](https://github.com/Leony99/Pack/actions).

### CD: publicação contínua

O job `deploy` só roda **num envio para a `main` e depois que o CI passou** (`needs: backend`):

1. **Entra no Google Cloud sem senha (Workload Identity Federation).**
   - O GitHub gera um token temporário assinado (OIDC), que diz de qual repositório a execução veio.
   - O Google só aceita tokens do repositório `Leony99/Pack`.
   - Em troca, devolve um acesso de poucos minutos para a conta `github-deploy`. Nenhuma chave fica guardada no GitHub.
2. **Monta a imagem e a envia** ao Artifact Registry, com a tag do commit (`pack-api:<sha>`).
3. **Publica no Cloud Run:** cria uma revisão nova do serviço `pack-api` e passa todo o tráfego para ela.
   - A revisão anterior continua guardada, e dá para voltar a ela pelo console.

Garantias:
- **A conta de deploy pode pouco:** ela envia imagens e publica revisões, mas **não mexe em permissões**.
- **O deploy só troca a imagem:** memória, variáveis, segredos e acesso público continuam como estão. Por isso um deploy nunca religa a API se o disjuntor a tiver desligado.
- **Um deploy por vez** (`concurrency`): dois envios seguidos não publicam ao mesmo tempo.

No GitHub ficam só 4 **variáveis** (*Settings → Secrets and variables → Actions → Variables*), nenhuma secreta:

| Variável | Valor |
|---|---|
| `GCP_PROJECT_ID` | Projeto do Google Cloud |
| `GCP_REGION` | `southamerica-east1` (São Paulo) |
| `GCP_WIF_PROVIDER` | O provedor de identidade que aceita os tokens do GitHub |
| `GCP_DEPLOY_SA` | A conta de serviço que o deploy assume |

## Produção: Cloud Run + Neon

- **Cloud Run:** executa o container da API. Cuida do HTTPS, do endereço `.run.app`, dos logs, das revisões e de ligar e desligar a API conforme o uso.
- **Neon:** PostgreSQL 18 gerenciado, na região AWS de São Paulo, ao lado da API. Ele desliga sozinho quando ninguém usa e religa no próximo acesso, em menos de um segundo.
- **Secret Manager:** a senha do banco, a chave do JWT (gerada aleatoriamente) e a senha do admin ficam no Google. O Cloud Run as entrega à API como variáveis de ambiente.
- **Perfil `prod`:** no Cloud Run, a variável `SPRING_PROFILES_ACTIVE=prod` ativa o [`application-prod.properties`](../backend/src/main/resources/application-prod.properties), que se soma à configuração normal com:
  - pool de conexões pequeno, para o limite do Neon grátis;
  - logs enxutos;
  - `forward-headers-strategy`: o Spring lê os cabeçalhos do proxy do Google e gera links `https://`. O "Try it out" do Swagger depende disso.
- **Porta:** o Cloud Run informa a porta pela variável `PORT`, e a API a lê com `server.port=${PORT:8080}`.

## Limitadores

A API está hospedada de graça, dentro da cota gratuita do Google Cloud e do Neon. Os limites abaixo mantêm o custo em zero e impedem que um pico de acessos, um robô ou um erro gere uma conta.

**Na API (Cloud Run):**

| Limite | Valor | Por quê |
|---|---|---|
| Instâncias mínimas | **0** | Sem acesso, a API desliga e não cobra nada. O custo é o primeiro acesso mais lento: o Spring Boot leva alguns segundos para subir |
| Instâncias máximas | **1** | Teto de custo: mesmo sob muitos acessos, nunca roda mais de uma cópia da API |
| CPU e memória | **1 vCPU e 1 GB** | O suficiente para o Spring Boot. A JVM usa até 75% da memória, para não passar do limite do container |
| CPU só durante requisições | padrão do Cloud Run | A cobrança conta apenas o tempo em que a API está atendendo |
| Requisições simultâneas por instância | **80** | Acima disso, as requisições esperam, em vez de abrir outra instância |
| Tempo máximo por requisição | **60 s** | Uma requisição travada é encerrada, em vez de consumir CPU indefinidamente |

**No banco (Neon):**

| Limite | Valor | Por quê |
|---|---|---|
| Conexões no pool | **até 5**, mínimo 0 | O plano grátis limita as conexões. Com o mínimo 0, as conexões paradas fecham e o Neon pode desligar |

**No Google Cloud em geral:**

| Limite | Valor | Por quê |
|---|---|---|
| Imagens guardadas | **as 2 mais recentes** | Uma regra de limpeza ([`gcp/limpeza-imagens.json`](gcp/limpeza-imagens.json)) apaga as antigas, para caber nos 0,5 GB grátis. Vale também para as imagens da função |
| Orçamento | **R$ 5 por mês** | Avisos por e-mail em 50%, 90% e 100% |
| Disjuntor | **em 100% do orçamento** | Tira a API do ar automaticamente (ver abaixo) |
| Função do disjuntor | **1 instância, 256 MB, só tráfego interno** | Só o Pub/Sub do próprio Google consegue acioná-la |
| Deploy | **um por vez, só da `main`** | Dois envios seguidos não publicam ao mesmo tempo |
| Permissões | **mínimas por conta** | `pack-api-run` só lê os próprios segredos; `github-deploy` não mexe em permissões; `budget-guard` só mexe no serviço da API |

## Disjuntor de custos

O orçamento do Google Cloud **só avisa**: sozinho, ele não bloqueia nada. O disjuntor transforma o aviso em ação:

```
Orçamento (R$ 5) ──aviso──► Pub/Sub (budget-alerts) ──► função pack-budget-guard
                                                              │
                                     gasto < limite ──────────┼──► não faz nada
                                     gasto ≥ limite ──────────┘──► remove o acesso público da API
```

- **O que acontece:** a [função](budget-guard/main.py) (Python) remove a permissão que deixa qualquer pessoa (`allUsers`) chamar a API. A API passa a responder **403**, mas nada é apagado: serviço, banco, imagens e configuração continuam lá.
- **Religar:** depois de entender o que causou o gasto, rode [`gcp/religar-api.sh`](gcp/religar-api.sh). Também dá para rodar no Cloud Shell, o terminal do console do Google Cloud, sem instalar nada.
- **Teste:** o caminho foi testado com avisos simulados publicados no Pub/Sub. Com R$ 1,20 de R$ 5, a função não fez nada. Com R$ 6 de R$ 5, a API passou a responder 403 em cerca de 100 segundos. Depois, o script de religar a devolveu.
- **Limitação:** o Google contabiliza o gasto com algumas horas de atraso, então o disjuntor dispara depois. É por isso que o limite é baixo: mesmo com o atraso, um estouro fica em poucos reais.

## Arquivos desta pasta

```
infra/
├── README.md                 este arquivo
├── FERRAMENTAS.md            ferramentas usadas na configuração e como foram usadas
├── budget-guard/
│   ├── main.py               a função disjuntor
│   └── requirements.txt      dependências da função
└── gcp/
    ├── setup.sh              cria tudo no Google Cloud, em etapas
    ├── religar-api.sh        devolve o acesso público da API
    └── limpeza-imagens.json  regra que guarda só as 2 imagens mais recentes
```

O [`gcp/setup.sh`](gcp/setup.sh) é o registro de tudo o que existe no Google Cloud e permite refazer a configuração num projeto novo. Ele roda em etapas, nesta ordem:

| Etapa | O que cria |
|---|---|
| `apis` | Ativa os serviços do Google usados |
| `imagens` | Repositório de imagens com a regra de limpeza |
| `segredos` | Segredos no Secret Manager, lidos de um `.env.prod` local (fora do git) |
| `contas` | Contas de serviço da API e do deploy, com permissões mínimas |
| `github` | Workload Identity Federation para o repositório |
| `api` | Primeiro deploy do serviço no Cloud Run, com os limites |
| `disjuntor` | Tópico do Pub/Sub, conta e função do disjuntor |
| `orcamento` | Orçamento de R$ 5 ligado ao tópico |

```bash
bash infra/gcp/setup.sh <etapa>     # da raiz do repositório, com o gcloud logado
```
