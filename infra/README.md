# Infraestrutura da Pack

Por onde a Pack API passa até rodar: no **desenvolvimento**, no seu computador, e em **produção**, do `git push` até a API no ar no Google Cloud. No fim estão os limitadores de custo e o disjuntor, que mantêm a hospedagem gratuita.

## Sumário

- [Desenvolvimento: rodando no seu computador](#desenvolvimento-rodando-no-seu-computador)
- [Produção: do git push até a API no ar](#produção-do-git-push-até-a-api-no-ar)
- [Limitadores](#limitadores)
- [Disjuntor de custos](#disjuntor-de-custos)
- [Arquivos desta pasta](#arquivos-desta-pasta)

---

## Desenvolvimento: rodando no seu computador

```
 código (backend/)  +  .env (raiz)
        │
        ├──► A) docker compose up --build ──► Docker monta a imagem ──► containers db + api
        │
        ├──► B) docker compose up -d db  +  ./mvnw spring-boot:run ──► API direto no Java
        │
        └──► ./mvnw test ──► Testcontainers sobe um PostgreSQL descartável ──► 177 testes
                                                                                  │
                                                       passou? git push ──► Produção
```

### 1. Configuração

Copie o [`.env.example`](../.env.example) para `.env`, na raiz, e preencha:
- as senhas do banco local;
- a chave do JWT;
- o admin inicial.

O `.env` não vai para o git. As duas formas de rodar leem esse mesmo arquivo.

### 2A. Rodando com Docker (sem instalar Java)

```bash
docker compose up --build
```

O que acontece:

1. **O Compose lê o [`docker-compose.yml`](../docker-compose.yml)** e o `.env`.
2. **Monta a imagem da API** seguindo o [`backend/Dockerfile`](../backend/Dockerfile), em duas etapas:

   ```
   ┌─ etapa "build" ─────────────────┐      ┌─ imagem final ──────────────────────┐
   │ Maven + JDK 21                  │      │ só o Java (JRE 21, base Alpine)     │
   │ 1. copia o pom.xml e baixa as   │ ───► │ app.jar                             │
   │    dependências (fica em cache) │ .jar │ usuário "pack", sem root            │
   │ 2. copia o código e compila     │      │ java -XX:MaxRAMPercentage=75 -jar   │
   └─────────────────────────────────┘      └─────────────────────────────────────┘
          descartada no fim                        ~127 MB, é o que roda
   ```

   - O Maven e o código-fonte ficam na etapa descartada. A imagem final leva só o `.jar` e o Java.
   - O `pom.xml` é copiado antes do código: quando só o código muda, as dependências já baixadas são reaproveitadas.
   - A JVM usa no máximo 75% da memória do container, para não ser encerrada por passar do limite.
   - O [`.dockerignore`](../backend/.dockerignore) deixa de fora o `target/`, os docs e os `.env`. Senhas nunca entram na imagem.
3. **Sobe o container `db`:**
   - usa a imagem `postgres:18`, a mesma versão de produção;
   - os dados ficam no volume `pack-db-data`;
   - o Compose testa a cada 5 s se o banco já aceita conexões (`pg_isready`).
4. **Sobe o container `api`** só depois que o banco responde. Dentro da rede do Compose, a API encontra o banco pelo nome: `jdbc:postgresql://db:5432/pack-db`.
5. **A API fica em `http://localhost:8080`:**
   - o Hibernate cria as tabelas;
   - o seeder cria as permissões, os papéis e o admin.

| Comando | O que faz |
|---|---|
| `docker compose up --build` | Monta a imagem e sobe tudo |
| `docker compose down` | Desliga; os dados ficam no volume |
| `docker compose down -v` | Desliga e apaga os dados |
| `docker compose logs -f api` | Mostra o log da API ao vivo |

### 2B. Rodando pelo Maven (para programar)

```bash
docker compose up -d db
cd backend
./mvnw spring-boot:run
```

O banco roda no Docker, e a API roda direto no Java da sua máquina, o que deixa o reinício mais rápido enquanto você programa. A API lê o `../.env` e conecta em `localhost:5432`, a porta que o container do banco abre no seu PC.

### 3. Testes

```bash
cd backend
./mvnw test
```

1. O Maven compila o código e os testes.
2. O **Testcontainers** sobe um PostgreSQL 18 **novo e descartável** no Docker. Ele não usa o seu banco nem o `.env`.
3. O Spring conecta nesse banco e roda os 177 testes: unidade, integração e concorrência.
4. No fim, o container é apagado.

Testes passando, o próximo passo é `git push`, e daí em diante o caminho é o de produção.

---

## Produção: do git push até a API no ar

Você não monta nem envia nenhuma imagem: **só envia o código**. O resto acontece sozinho.

```
 git push (main)
   │
   ▼
 GitHub ── recebe o código e lê .github/workflows/ci.yml
   │
   ▼
 GitHub Actions ── liga uma máquina Linux temporária
   │
   ├─ 1. CI ─────── baixa o código → Java 21 → ./mvnw test → docker build
   │                    └─ falhou? ✗ para aqui, nada é publicado
   │
   ├─ 2. Login ──── entra no Google Cloud com um token temporário (sem senha)
   │
   ├─ 3. Imagem ─── docker build + docker push ──► Artifact Registry (São Paulo)
   │
   └─ 4. Deploy ─── manda o Cloud Run usar a imagem nova ──► Cloud Run: nova revisão
                                                                  │
 usuário ──https──► Cloud Run liga o container ──► API (perfil prod) ──SSL──► Neon
                                                       ▲
                                         Secret Manager (senhas e chave JWT)
```

### Passo 1: o código chega ao GitHub

`git push` para a branch `main`. O GitHub encontra o workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) e começa uma execução. Ela aparece na aba [Actions](https://github.com/Leony99/Pack/actions), e o commit ganha um ✓ ou ✗.

### Passo 2: CI, testar antes de publicar

O GitHub Actions liga uma **máquina Linux temporária**, que é criada para a execução e apagada no fim, e roda o job `backend`:

1. **Baixa o código** do repositório.
2. **Instala o Java 21**, com cache das dependências do Maven entre execuções.
3. **Roda os 177 testes** (`./mvnw test`). O PostgreSQL descartável sobe no Docker da própria máquina do GitHub, sem nenhum segredo envolvido.
4. **Monta a imagem Docker**, só para conferir que o `Dockerfile` funciona.

**Se algo falha, a execução para aqui**, e a versão no ar continua a anterior. Os relatórios dos testes ficam disponíveis para download na página da execução.

Pull requests também passam por esse passo, mas nunca seguem para os passos seguintes.

### Passo 3: login no Google Cloud, sem senha

Com o CI aprovado, começa o job `deploy`, que só roda em push na `main`. Para publicar, ele precisa entrar no Google Cloud, e faz isso com **Workload Identity Federation**:

1. O GitHub gera um **token temporário assinado** (OIDC), dizendo "esta execução é do repositório `Leony99/Pack`".
2. O Google confere a assinatura e **só aceita esse repositório**.
3. O Google devolve um acesso de poucos minutos para a conta de serviço `github-deploy`.

Nenhuma senha ou chave fica guardada no GitHub. Lá ficam só 4 **variáveis**, nenhuma secreta (*Settings → Secrets and variables → Actions → Variables*):

| Variável | O que é |
|---|---|
| `GCP_PROJECT_ID` | O projeto do Google Cloud |
| `GCP_REGION` | `southamerica-east1` (São Paulo) |
| `GCP_WIF_PROVIDER` | O provedor que aceita os tokens do GitHub |
| `GCP_DEPLOY_SA` | A conta de serviço que o deploy assume |

### Passo 4: a imagem vai para o Artifact Registry

Na mesma máquina do GitHub:
- `docker build` monta a imagem com o mesmo `Dockerfile` do desenvolvimento;
- `docker push` a envia ao **Artifact Registry**, o "depósito de imagens" do Google em São Paulo;
- a tag da imagem é o código do commit (`pack-api:<sha>`), então cada versão publicada aponta para o commit exato que a gerou.

### Passo 5: o Cloud Run publica a versão nova

A ação `deploy-cloudrun` manda o serviço `pack-api` usar a imagem nova:
1. O Cloud Run cria uma **revisão** nova do serviço.
2. Assim que ela fica pronta, recebe 100% do tráfego.
3. A revisão anterior continua guardada, e dá para voltar a ela pelo console.

O deploy **só troca a imagem**. Memória, limites, variáveis, segredos e acesso público continuam como estavam. A conta de deploy nem tem permissão para mexer em acessos.

### Passo 6: a API roda

Quando uma requisição chega em `https://pack-api-….run.app`:

1. **O Google recebe pelo HTTPS**, com o certificado e o endereço `.run.app` cuidados por ele.
2. **Se não há container ligado, o Cloud Run liga um** com a imagem da revisão atual (mínimo de 0 instâncias). Essa é a demora do primeiro acesso: o Spring Boot leva alguns segundos para subir.
3. **A API inicia com o perfil `prod`** (`SPRING_PROFILES_ACTIVE=prod`). O [`application-prod.properties`](../backend/src/main/resources/application-prod.properties) se soma à configuração normal:
   - pool de conexões pequeno, para o limite do Neon grátis;
   - logs enxutos;
   - leitura dos cabeçalhos do proxy do Google, para gerar links `https://`. O "Try it out" do Swagger depende disso.
4. **Os segredos chegam como variáveis de ambiente.** O Cloud Run busca no **Secret Manager** a senha do banco, a chave do JWT e a senha do admin. Eles não estão no código, na imagem nem no GitHub.
5. **A API conecta no Neon** por SSL. O banco também desliga quando fica parado e religa no primeiro acesso, em menos de um segundo.
6. **A resposta volta** ao usuário.
7. **Uns 15 minutos sem requisições, o container desliga** e para de cobrar. A próxima requisição volta ao item 2.

### Passo 7: vigilância de custo (o tempo todo)

Enquanto a API roda:
- **de hora em hora,** o disjuntor mede quanto da cota grátis do mês já foi usado e tira a API do ar sozinho se algum recurso passar de **85%**;
- o **orçamento** de R$ 1 é a segunda camada, para qualquer cobrança real.

Os detalhes estão em [Disjuntor de custos](#disjuntor-de-custos).

---

## Limitadores

A API está hospedada de graça, dentro da cota gratuita do Google Cloud e do Neon. Os limites abaixo mantêm o custo em zero e impedem que um pico de acessos, um robô ou um erro gere uma conta.

**Na API (Cloud Run):**

| Limite | Valor | Por quê |
|---|---|---|
| Instâncias mínimas | **0** | Sem acesso, a API desliga e não cobra nada. O custo é o primeiro acesso mais lento |
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
| Cota grátis do Cloud Run | **desliga em 85%** | Medida de hora em hora: a API sai do ar antes de qualquer cobrança (ver abaixo) |
| Orçamento | **R$ 1 por mês** | Segunda camada: avisos por e-mail em 50%, 90% e 100% do gasto real, e o disjuntor age em 100% |
| Função do disjuntor | **1 instância, 256 MB, só tráfego interno** | Só o Pub/Sub do próprio Google consegue acioná-la |
| Deploy | **um por vez, só da `main`** | Dois envios seguidos não publicam ao mesmo tempo |
| Permissões | **mínimas por conta** | `pack-api-run` só lê os próprios segredos; `github-deploy` não mexe em permissões; `budget-guard` só mexe no serviço da API |

## Disjuntor de custos

O objetivo é **nunca pagar nada**: a API sai do ar antes de a cota grátis do Cloud Run acabar. O orçamento do Google Cloud sozinho não serve para isso. Ele mede dinheiro cobrado, e o uso dentro da cota custa R$ 0, então ele só perceberia depois de a cota acabar. Por isso o disjuntor tem duas camadas, as duas no mesmo tópico do Pub/Sub e na mesma [função](budget-guard/main.py):

```
 1ª camada: cota grátis (principal)
 Cloud Scheduler ──de hora em hora──► Pub/Sub ──► função pack-budget-guard
                                       (budget-alerts)   │ soma o uso do mês no Cloud Monitoring
                                                         │ (tempo de instância e requisições)
                                                         ├─ tudo abaixo de 85% ──► não faz nada
                                                         └─ algum recurso ≥ 85% ─► remove o acesso público da API

 2ª camada: orçamento (qualquer cobrança real)
 Orçamento R$ 1 ──aviso──► Pub/Sub ──► mesma função ── gasto ≥ R$ 1 ──► remove o acesso público da API
```

### Como a cota é medida

A cota grátis mensal do Cloud Run (cobrança por requisição) é de **180 mil vCPU-segundos, 360 mil GiB-segundos e 2 milhões de requisições**. O Google a aplica como um desconto em dinheiro calculado pelo preço das regiões mais baratas (Tier 1). São Paulo é Tier 2, com CPU e memória cerca de 1,4 vez mais caras, então a mesma cota cobre menos segundos aqui:

| Recurso | Cota (preço Tier 1) | Equivale em São Paulo | O disjuntor corta em (85%) |
|---|---|---|---|
| CPU | 180.000 vCPU-s | ~128.600 vCPU-s | ~109.300 vCPU-s (~30 h de API ativa) |
| Memória | 360.000 GiB-s | ~257.100 GiB-s | ~218.600 GiB-s |
| Requisições | 2.000.000 | 2.000.000 | 1.700.000 |

- **O que a função soma:** a cada hora, o tempo de instância cobrável (`billable_instance_time`) e as requisições (`request_count`) de todos os serviços do Cloud Run no mês.
- **Conta conservadora:** o tempo de instância é contado como se tudo tivesse 1 vCPU e 1 GB, o tamanho da API. A própria função, bem menor, entra a mais, o que faz o corte acontecer um pouco antes, nunca depois.
- **Uso típico:** uma verificação normal registra algo como `CPU 0.1%, memória 0.1%, requisições 0.0% (limite 85%)` nos logs da função.
- **A cota vale por conta de faturamento:** se outros projetos do Google Cloud usarem a mesma conta, eles consomem a mesma cota.

### O que acontece no corte

- **A permissão pública sai:** a função remove a permissão que deixa qualquer pessoa (`allUsers`) chamar a API, e a API passa a responder **403**. Requisições barradas pela permissão não são cobradas.
- **Nada é apagado:** serviço, banco, imagens e configuração continuam lá.
- **Um deploy não religa:** o CD só troca a imagem e não mexe em acessos, então reabrir a API é sempre uma decisão sua.
- **Religar:** rode [`gcp/religar-api.sh`](gcp/religar-api.sh). Também dá para rodar no Cloud Shell, o terminal do console do Google Cloud, sem instalar nada. Se a cota do mês estiver no limite, a próxima verificação desliga de novo; o normal é religar no mês seguinte, quando a cota se renova.

### Testes feitos

| Camada | Teste | Resultado |
|---|---|---|
| Cota | Verificação normal (limite 85%) | Uso medido (CPU 0,1%), nada feito ✓ |
| Cota | Limite baixado por um instante para 0,01% (o uso de 0,1% passa dele) | API em **403** em ~100 s ✓ |
| Orçamento | Aviso simulado de gasto abaixo do limite | Nada feito ✓ |
| Orçamento | Aviso simulado de gasto acima do limite | API em **403** em ~100 s ✓ |
| — | `religar-api.sh` | API em 200 de novo ✓ |

O limite pode ser trocado pela variável de ambiente `LIMITE` da função, sem mudar o código; foi assim que o teste de corte foi feito.

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
| `disjuntor` | Tópico do Pub/Sub, conta e função do disjuntor (com permissão de ler as métricas de uso) |
| `agendador` | Tarefa do Cloud Scheduler que aciona a medição da cota de hora em hora |
| `orcamento` | Orçamento de R$ 1 ligado ao tópico (cria ou atualiza) |

```bash
bash infra/gcp/setup.sh <etapa>     # da raiz do repositório, com o gcloud logado
```
