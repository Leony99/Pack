# Produção

Como a Pack API roda em produção:
- **onde ela fica:** Google Cloud Run, com o banco no Neon;
- **como os segredos chegam até ela;**
- **como o custo fica em zero:** limitadores e disjuntor.

Os outros assuntos ficam em outros lugares:
- o desenvolvimento local e os testes estão no [README principal](../README.md);
- como uma versão nova chega aqui está no [CI/CD](../ci-cd/README.md).

**API no ar:** https://pack-api-872578691493.southamerica-east1.run.app/swagger-ui.html

## Sumário

- [Visão geral](#visão-geral)
- [Do git push até a API no ar](#do-git-push-até-a-api-no-ar)
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
│  Agendador (1 h) + Orçamento ─► Pub/Sub ─► disjuntor ── (85% da cota) ─► tira a    │
│                                          (pack-budget-guard)      API do ar (403)  │
└───────────────────────────┼──────────┼─────────────────────────────────────────────┘
                            │          │ SSL
  usuário / Swagger ─https──┘          ▼
                            Neon · PostgreSQL 18 (AWS São Paulo)
```

| Peça | Onde roda | Função |
|---|---|---|
| **API Spring Boot** | Google **Cloud Run** | A aplicação, em container. O Cloud Run liga o container quando chega uma requisição e o desliga quando fica parado |
| **Banco** | **Neon** | PostgreSQL 18 gerenciado (serverless): o processamento também desliga quando ninguém usa. Fica na mesma região da API |
| **Imagens** | **Artifact Registry** | Guarda as imagens Docker publicadas pelo CD |
| **Segredos** | **Secret Manager** | A senha do banco, a chave do JWT e a senha do admin, entregues à API como variáveis de ambiente |
| **Disjuntor** | **Cloud Scheduler + orçamento + Pub/Sub + Cloud Run functions** | Tira a API do ar antes de a cota grátis acabar |

## Do git push até a API no ar

Você só envia o código. O **CI/CD** (GitHub Actions) testa, monta a imagem Docker, envia ao Artifact Registry e cria uma revisão nova no Cloud Run, tudo sozinho e sem nenhuma senha guardada no GitHub. Esse caminho está explicado em **[`ci-cd/README.md`](../ci-cd/README.md)**.

A partir daí, começa a parte de produção:

```
 usuário ──https──► Cloud Run liga o container ──► API (perfil prod) ──SSL──► Neon
                                                       ▲
                                         Secret Manager (senhas e chave JWT)
```

### A API roda

Quando uma requisição chega em `https://pack-api-….run.app`:

1. **O Google recebe pelo HTTPS**, com o certificado e o endereço `.run.app` cuidados por ele.
2. **Se não há container ligado, o Cloud Run liga um** com a imagem da revisão atual (mínimo de 0 instâncias). Essa é a demora do primeiro acesso: o Spring Boot leva alguns segundos para subir.
3. **A API inicia com o perfil `prod`** (`SPRING_PROFILES_ACTIVE=prod`). O [`application-prod.properties`](../backend/src/main/resources/application-prod.properties) se soma à configuração normal:
   - pool de conexões pequeno, para o limite do Neon grátis;
   - logs enxutos;
   - leitura dos cabeçalhos do proxy do Google, para gerar links `https://`. O "Try it out" do Swagger depende disso.

   A porta vem da variável `PORT`, que o Cloud Run informa (`server.port=${PORT:8080}`).
4. **Os segredos chegam como variáveis de ambiente.** O Cloud Run busca no **Secret Manager** a senha do banco, a chave do JWT e a senha do admin. Eles não estão no código, na imagem nem no GitHub.
5. **A API conecta no Neon** por SSL. O banco também desliga quando fica parado e religa no primeiro acesso, em menos de um segundo.
6. **A resposta volta** ao usuário.
7. **Uns 15 minutos sem requisições, o container desliga** e para de cobrar. A próxima requisição volta ao item 2.

### Vigilância de custo (o tempo todo)

- **De hora em hora,** o disjuntor mede quanto da cota grátis do mês já foi usado e tira a API do ar sozinho se algum recurso passar de **85%**.
- O **orçamento** de R$ 1 é a segunda camada, para qualquer cobrança real.

Os detalhes estão em [Disjuntor de custos](#disjuntor-de-custos).

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
producao/
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
bash producao/gcp/setup.sh <etapa>     # da raiz do repositório, com o gcloud logado
```
