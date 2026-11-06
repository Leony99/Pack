# Ferramentas externas usadas na configuração de produção

Registro das ferramentas usadas para colocar a Pack API no ar, e de como cada uma foi usada. Nenhuma ficou instalada na máquina de desenvolvimento.

## gcloud (Google Cloud CLI)

**O que é:** a ferramenta de linha de comando do Google Cloud. Cria e configura recursos (serviços, permissões, segredos, orçamento) sem precisar clicar no console.

**Versão usada:** Google Cloud SDK 592.0.0 (novembro de 2026), pacote para Windows com Python embutido.

**Como foi usada (temporária):**

1. **Download:** o `.zip` oficial (`google-cloud-cli-windows-x86_64-bundled-python.zip`, 105 MB) foi baixado e descompactado numa pasta temporária da sessão de desenvolvimento, fora do projeto. Não houve instalação: nenhuma entrada no PATH do Windows, no registro ou em "Programas instalados".
2. **Configuração isolada:** a variável `CLOUDSDK_CONFIG` apontou para uma pasta dentro da mesma pasta temporária. O login e as configurações ficaram nela, e não em `%APPDATA%\gcloud`.
3. **Login:** `gcloud auth login`, com a conta do Google pelo navegador.
4. **Uso:** as etapas de [`gcp/setup.sh`](gcp/setup.sh), nesta ordem:

   | Etapa | O que criou |
   |---|---|
   | `apis` | Ativou Cloud Run, Artifact Registry, Secret Manager, Pub/Sub, Cloud Functions, Cloud Build, Eventarc, Billing Budgets, IAM, Cloud Scheduler e Cloud Monitoring |
   | `imagens` | Repositório `pack` no Artifact Registry (São Paulo), com limpeza automática que guarda só as 2 imagens mais recentes |
   | `segredos` | `pack-db-password`, `pack-admin-password` e `pack-jwt-secret` no Secret Manager (a chave do JWT foi gerada aleatoriamente) |
   | `contas` | Contas de serviço `pack-api-run` (a API) e `github-deploy` (o GitHub Actions), cada uma só com as permissões necessárias |
   | `github` | Workload Identity Federation: pool e provedor `github`, aceitando só tokens do repositório `Leony99/Pack` |
   | `api` | Primeiro deploy do serviço `pack-api` no Cloud Run (0 a 1 instância, 1 GB, perfil `prod`, segredos do Secret Manager) |
   | `disjuntor` | Tópico `budget-alerts`, conta `budget-guard` (com leitura de métricas) e a função `pack-budget-guard` (só tráfego interno) |
   | `agendador` | Tarefa `pack-verificar-cota` no Cloud Scheduler, de hora em hora, que pede à função a medição da cota grátis |
   | `orcamento` | Orçamento `pack` de R$ 1 (criado com R$ 5 e depois reduzido), com avisos em 50%, 90% e 100% enviados ao tópico |

5. **Testes feitos com o gcloud:**
   - um aviso falso de gasto baixo, publicado no tópico: a função não fez nada;
   - um aviso falso de gasto acima do limite: a função tirou o acesso público e a API passou a responder 403;
   - o [`gcp/religar-api.sh`](gcp/religar-api.sh) devolveu o acesso público (200 de novo).
6. **Remoção:** no fim, o login foi revogado (`gcloud auth revoke`) e a pasta temporária foi apagada inteira: programa, configurações e credenciais.
7. **Segundo uso (medidor de cota):** o gcloud foi baixado e usado de novo, do mesmo jeito temporário, para:
   - ativar o Cloud Scheduler e o Cloud Monitoring;
   - republicar a função com a medição da cota grátis;
   - criar o agendador e reduzir o orçamento para R$ 1.

   Testes:
   - uma verificação disparada à mão (`gcloud scheduler jobs run`) mediu o uso do mês;
   - com a variável `LIMITE` baixada por um instante (`gcloud run services update`), a função tirou a API do ar (403);
   - depois, a variável foi removida e a API, religada.

   No fim, a mesma remoção do passo 6.

**Para usar de novo** (por exemplo, para rodar o `religar-api.sh`), não é preciso instalar nada: o **Cloud Shell** (botão `>_` no topo do console do Google Cloud) já tem o gcloud instalado e logado. Também dá para baixar o `.zip` de novo e repetir os passos 1 a 3.

## Docker (para o primeiro envio da imagem)

O Docker Desktop já fazia parte do projeto (ver o README). Na etapa `api`, ele montou a imagem e a enviou ao Artifact Registry:

- o login no registro foi feito com um token temporário do gcloud (`gcloud auth print-access-token | docker login ...`);
- logo depois do envio, `docker logout` apagou essa credencial.

Os deploys seguintes são feitos pelo GitHub Actions, que monta e envia a imagem na máquina dele.

## Serviços usados a partir do GitHub Actions

A ação de deploy [`ci-cd/deploy/action.yml`](../ci-cd/deploy/action.yml), chamada pelo workflow, usa ações oficiais do Google, que rodam só na máquina temporária do GitHub:

- `google-github-actions/auth@v3`: entra no Google Cloud com Workload Identity Federation, sem chave guardada;
- `google-github-actions/setup-gcloud@v3`: instala o gcloud na máquina do GitHub, só durante a execução;
- `google-github-actions/deploy-cloudrun@v3`: publica a nova imagem no serviço `pack-api`.
