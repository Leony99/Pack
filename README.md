# Pack

[![CI/CD](https://github.com/Leony99/Pack/actions/workflows/ci.yml/badge.svg)](https://github.com/Leony99/Pack/actions/workflows/ci.yml)

E-commerce de roupas. O repositório é um monorepo:

| Pasta | O que tem |
|---|---|
| [`backend/`](backend/) | API REST em Spring Boot (descrita abaixo) |
| `frontend/` | Loja em React / Next.js (em desenvolvimento) |
| [`infra/`](infra/) | Configuração do Google Cloud e a função do disjuntor de custos |
| [`.github/workflows/`](.github/workflows/) | Pipeline de CI/CD (GitHub Actions) |

## Backend: Pack API

API REST de um e-commerce de roupas, feita com **Spring Boot 4** e **Java 21**. Cobre o fluxo completo de uma loja: catálogo com variantes (tamanho e cor), estoque, carrinho, cupons, checkout, pagamento e envio. Tem login com JWT e controle de acesso por permissão.

Projeto de portfólio, desenvolvido para estudar como uma API de verdade é organizada, protegida e testada.

**API no ar:** [Swagger da Pack API](https://pack-api-872578691493.southamerica-east1.run.app/swagger-ui.html), no Google Cloud Run (São Paulo). O primeiro acesso pode levar até 1 minuto: a hospedagem é gratuita e a API desliga quando ninguém está usando.

## Stack

| | |
|---|---|
| Linguagem | Java 21 |
| Framework | Spring Boot 4.1 (Web, Data JPA, Validation, Security) |
| Autenticação | JWT (HS256) com o OAuth2 Resource Server do Spring; senhas em BCrypt |
| Banco | PostgreSQL 18 (Neon em produção) |
| Documentação | OpenAPI 3 com springdoc (Swagger UI) |
| Testes | JUnit 6, AssertJ, Mockito, MockMvc e Testcontainers |
| Infra | Docker (imagem em duas etapas), Docker Compose, GitHub Actions (CI/CD) |
| Nuvem | Google Cloud Run, Artifact Registry, Secret Manager, Pub/Sub e Cloud Run functions; banco no Neon |
| Outros | Lombok, Maven Wrapper |

## Arquitetura

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
| **API Spring Boot** | Google **Cloud Run** | A aplicação, empacotada pelo [`backend/Dockerfile`](backend/Dockerfile). O Cloud Run liga o container quando chega uma requisição e o desliga quando fica parado |
| **Banco** | **Neon** | PostgreSQL 18 gerenciado (serverless): processamento e armazenamento separados, e o processamento também desliga quando ninguém usa. Fica na mesma região da API |
| **Imagens** | **Artifact Registry** | Guarda as imagens Docker publicadas pelo CD |
| **Segredos** | **Secret Manager** | A API recebe a senha do banco, a chave do JWT e a senha do admin como variáveis de ambiente, sem que elas apareçam no código, na imagem ou no GitHub |
| **Pipeline** | **GitHub Actions** | CI a cada envio; CD a cada envio para a `main` que passa no CI |
| **Disjuntor de custos** | **Orçamento + Pub/Sub + Cloud Run functions** | Tira a API do ar sozinho se o gasto do mês chegar ao limite |

Em produção, a API roda com o perfil `prod` ([`application-prod.properties`](backend/src/main/resources/application-prod.properties)), que se soma à configuração normal:
- poucas conexões com o banco;
- logs enxutos;
- leitura dos cabeçalhos do proxy do Google, para gerar links `https://`. O "Try it out" do Swagger depende disso.

### CI: integração contínua

A cada envio para a `main` (e a cada pull request), o [GitHub Actions](.github/workflows/ci.yml) roda numa máquina Linux temporária:

1. instala o Java 21;
2. roda os 177 testes com `./mvnw test`. O PostgreSQL descartável sobe no Docker da própria máquina do GitHub, e não há nenhum segredo envolvido;
3. monta a imagem Docker da API, para garantir que o `Dockerfile` continua funcionando.

Se algum teste falha, o pipeline para ali, e nada é publicado. Os relatórios dos testes ficam disponíveis para download na página da execução. O selo no topo deste README mostra o resultado da última execução, e o histórico fica na aba [Actions](https://github.com/Leony99/Pack/actions).

### CD: publicação contínua

No mesmo workflow, o job `deploy` só roda **num envio para a `main` e depois que o CI passou**:

```
testes ✓ → entra no Google Cloud → monta a imagem → envia ao Artifact Registry → nova revisão no Cloud Run
```

- **Sem senha guardada no GitHub (Workload Identity Federation):** o GitHub gera um token temporário assinado, que diz de qual repositório a execução veio. O Google só aceita tokens do repositório `Leony99/Pack` e devolve um acesso de poucos minutos para uma conta de deploy.
- **A conta de deploy pode pouco:** ela pode enviar imagens e publicar revisões, mas **não pode mexer em permissões**.
- **O deploy só troca a imagem:** memória, variáveis, segredos e acesso público continuam como estão. Por isso um deploy nunca religa a API se o disjuntor a tiver desligado.
- **Revisões:** cada deploy vira uma revisão nova no Cloud Run. A anterior continua guardada e dá para voltar a ela pelo console.
- **No GitHub ficam só identificadores:** 4 variáveis (`GCP_PROJECT_ID`, `GCP_REGION`, `GCP_WIF_PROVIDER` e `GCP_DEPLOY_SA`), nenhuma secreta.

### Limitadores

A API está hospedada de graça, dentro da cota gratuita do Google Cloud e do Neon. Os limites abaixo mantêm o custo em zero e impedem que um pico de acessos, um robô ou um erro gere uma conta.

**Na API (Cloud Run):**

| Limite | Valor | Por quê |
|---|---|---|
| Instâncias mínimas | **0** | Sem acesso, a API desliga e não cobra nada. O custo é o primeiro acesso mais lento: o Spring Boot leva alguns segundos para subir |
| Instâncias máximas | **1** | Teto de custo: mesmo sob muitos acessos, nunca roda mais de uma cópia da API |
| CPU e memória | **1 vCPU e 1 GB** | O suficiente para o Spring Boot. A JVM usa até 75% da memória (`-XX:MaxRAMPercentage=75`), para não passar do limite do container |
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
| Imagens guardadas | **as 2 mais recentes** | Uma regra de limpeza apaga as antigas, para caber nos 0,5 GB grátis do Artifact Registry. A mesma regra vale para as imagens da função |
| Orçamento | **R$ 5 por mês** | Avisos por e-mail em 50%, 90% e 100% |
| Disjuntor | **em 100% do orçamento** | Tira a API do ar automaticamente (ver abaixo) |
| Função do disjuntor | **1 instância, 256 MB, só tráfego interno** | Só o Pub/Sub do próprio Google consegue acioná-la |
| Deploy | **um por vez, só da `main`** | Dois envios seguidos não publicam ao mesmo tempo |
| Permissões | **mínimas por conta** | A API só lê os próprios segredos; o deploy não mexe em permissões; o disjuntor só mexe no serviço da API |

### Disjuntor de custos

O orçamento do Google Cloud **só avisa**: sozinho, ele não bloqueia nada. O disjuntor transforma o aviso em ação:

```
Orçamento (R$ 5) ──aviso──► Pub/Sub (budget-alerts) ──► função pack-budget-guard
                                                              │
                                     gasto < limite ──────────┼──► não faz nada
                                     gasto ≥ limite ──────────┘──► remove o acesso público da API
```

- **O que acontece:** a [função](infra/budget-guard/main.py) remove a permissão que deixa qualquer pessoa chamar a API. A API passa a responder **403**, mas nada é apagado: serviço, banco, imagens e configuração continuam lá.
- **Religar:** depois de entender o que causou o gasto, rode [`infra/gcp/religar-api.sh`](infra/gcp/religar-api.sh). Também dá para rodar no Cloud Shell, o terminal do console do Google Cloud.
- **Teste:** o caminho foi testado com avisos simulados publicados no Pub/Sub. Com R$ 1,20 de R$ 5, a função não fez nada. Com R$ 6 de R$ 5, a API passou a responder 403 em cerca de 100 segundos. Depois, o script de religar a devolveu.
- **Limitação:** o Google contabiliza o gasto com algumas horas de atraso, então o disjuntor dispara depois. É por isso que o limite é baixo: mesmo com o atraso, um estouro fica em poucos reais.

### Configuração da infraestrutura

Tudo o que existe no Google Cloud foi criado pelo [`infra/gcp/setup.sh`](infra/gcp/setup.sh), em etapas comentadas:
1. serviços do Google;
2. registro de imagens;
3. segredos;
4. contas e permissões;
5. ligação com o GitHub;
6. primeiro deploy;
7. disjuntor;
8. orçamento.

O script serve de registro e permite refazer tudo num projeto novo. As ferramentas usadas na configuração, e como foram usadas, estão em [`infra/FERRAMENTAS.md`](infra/FERRAMENTAS.md).

## O que a API faz

- **Catálogo:** produtos com slug automático, variantes com SKU, preço próprio e estoque, imagens, tags, tamanhos e cores. A busca por nome ignora acentos e maiúsculas.
- **Estoque:** entradas, saídas e ajustes ficam registrados como movimentos, e há uma consulta de estoque baixo.
- **Carrinho e checkout:**
  - o pedido guarda o preço e o endereço do momento da compra, como um *snapshot*;
  - cupons podem ser fixos ou percentuais;
  - se o estoque acabar no meio do checkout, nada é gravado (rollback);
  - compras simultâneas não vendem a mesma unidade duas vezes: o estoque de cada variante é travado no banco (`SELECT ... FOR UPDATE`) enquanto o pedido é gravado.
- **Pedido:**
  - o status só avança na ordem: aguardando pagamento → pago → em separação → enviado → entregue;
  - o pedido pode ser cancelado antes do envio, e o cancelamento devolve o estoque;
  - o pagamento precisa ter o valor exato do pedido, e o envio só é aceito depois do pagamento aprovado.
- **Erros padronizados:** 400, 401, 403, 404, 409 e 422 vêm sempre no mesmo formato JSON.

## Segurança

Clientes e funcionários fazem login e recebem um token JWT, que vai no cabeçalho `Authorization: Bearer <token>` das requisições seguintes.

- **Sem login:** só é possível ver o catálogo.
- **Cliente:** acessa apenas o próprio cadastro, endereços, carrinho e pedidos.
- **Funcionário:** o que pode fazer depende das permissões do papel dele.

| Papel | Permissões |
|---|---|
| ADMIN | todas |
| ESTOQUISTA | catálogo e estoque |
| ATENDENTE | pedidos e consulta de clientes |
| SUPERVISOR | estoquista + atendente |

Todas as regras de acesso ficam em um só lugar: [`SecurityConfig`](backend/src/main/java/com/leonycosta/packapi/config/SecurityConfig.java).

## Organização do código

Os pacotes seguem o modelo *package-by-feature*, agrupados por categoria. Cada domínio tem a própria pasta, com entidade, repository, service, controller e DTOs:

```
backend/src/main/java/com/leonycosta/packapi/
├── staff/      staff, role, permission, role_permission
├── customer/   customer, address
├── cart/       cart, cart_item
├── order/      order, order_item, payment, shipment, coupon
├── product/    product, product_variant, product_image, product_tag, size, color, inventory
├── auth/       login, cadastro, geração do token e regras de "dono"
├── config/     SecurityConfig, JwtConfig, OpenApiConfig
├── enums/
└── exception/  GlobalExceptionHandler e erros padronizados
```

## Como rodar

Primeiro, crie o arquivo de configuração local a partir do modelo, na raiz do repositório, e preencha os valores (o `JWT_SECRET` precisa ter pelo menos 32 caracteres):

```bash
cp .env.example .env
```

### Com Docker Compose (recomendado)

**Requisito:** só o Docker. Não precisa instalar Java nem Maven.

```bash
docker compose up --build     # sobe o banco e a API
docker compose down           # desliga (os dados ficam guardados no volume)
```

O Compose sobe dois serviços: `db` (PostgreSQL 18, com os dados num volume) e `api` (a imagem montada pelo [`backend/Dockerfile`](backend/Dockerfile)). A API só inicia depois que o banco responde.

### Pelo Maven (para desenvolver)

**Requisitos:** Java 21 ou mais recente e Docker. O banco roda pelo Compose e a API roda na sua máquina, o que deixa o reinício mais rápido enquanto você mexe no código:

```bash
docker compose up -d db
cd backend
./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
```

Nas duas formas, a API sobe em `http://localhost:8080/api/v1`. As tabelas são criadas pelo Hibernate. As permissões, os papéis e o admin inicial (definido por `ADMIN_EMAIL` e `ADMIN_PASSWORD`) são criados na primeira execução.

### Testando pelo navegador (Swagger)

Com a aplicação rodando, abra `http://localhost:8080/swagger-ui.html`. A página lista todas as rotas, com os campos que cada uma recebe e devolve, e permite testá-las direto ali.

Para as rotas protegidas:
1. Faça login em `POST /api/v1/auth/staff/login` com o admin do `.env` (ou em `/auth/login`, como cliente).
2. Copie o `token` da resposta.
3. Clique em **Authorize** e cole o token.

A especificação OpenAPI, em JSON, fica em `/v3/api-docs` e pode ser importada no Postman.

### Exemplo rápido

```bash
# cadastro de cliente: já devolve o token
curl -X POST localhost:8080/api/v1/auth/register -H "Content-Type: application/json" \
  -d '{"nome":"Maria","email":"maria@email.com","telefone":"21999990000","senha":"minhasenha1"}'

# rota protegida, usando o token recebido
curl localhost:8080/api/v1/auth/me -H "Authorization: Bearer <token>"
```

## Testes

São 177 testes, que rodam com um comando. É preciso ter o Docker ligado, mas não precisa de `.env` nem do banco de desenvolvimento:

```bash
cd backend
./mvnw test        # Windows: mvnw.cmd test
```

| Tipo | O que faz | Exemplos |
|---|---|---|
| Unidade | Testa uma classe sozinha, sem Spring nem banco; roda em milissegundos | Regras de status do pedido; `CouponService` com o repositório substituído por um mock (Mockito) |
| Integração | Sobe a aplicação inteira com um PostgreSQL descartável (Testcontainers) e faz requisições pelo MockMvc, passando pela segurança, pelos controllers, pelos services e pelo banco | Cadastro e login, tokens adulterados ou vencidos, permissões de cada papel, checkout com cupom e rollback, pagamento e envio |
| Concorrência | Dispara compras e movimentos de estoque ao mesmo tempo, em threads separadas | Dois clientes comprando a última unidade; cinco clientes disputando três unidades |

Os testes ficam em [`backend/src/test/`](backend/src/test/java/com/leonycosta/packapi), nos mesmos pacotes do código que testam. A base comum, com a configuração do banco descartável e atalhos para montar os dados, fica em `support/`.

## Documentação

Os diagramas ficam em [`backend/docs/`](backend/docs/) e são gerados por scripts Python em [`backend/docs/geradores/`](backend/docs/geradores/), a partir do próprio código.

- [`erd.svg`](backend/docs/erd.svg): diagrama entidade-relacionamento.
- [`estrutura-pacotes.svg`](backend/docs/estrutura-pacotes.svg) e [`estrutura-pastas.svg`](backend/docs/estrutura-pastas.svg): organização do código.
- `fluxo.html`: página interativa com o caminho de cada requisição, passando pela segurança, pelo controller, pelo service e pelo repository, com o código real. Baixe o arquivo e abra no navegador.

## Próximos passos

- [x] Documentação OpenAPI / Swagger
- [x] Testes automatizados (unidade, integração e concorrência)
- [x] Docker Compose (API + banco)
- [x] CI com GitHub Actions (testes + imagem Docker)
- [x] Deploy no Google Cloud Run + banco no Neon
- [x] CD: publicar automaticamente quando o CI passar
- [x] Limitadores de custo e disjuntor (orçamento + Pub/Sub + função)
- [ ] Frontend (React / Next.js)

## Autor

**Leony Costa**
