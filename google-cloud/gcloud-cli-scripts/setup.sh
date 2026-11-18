#!/usr/bin/env bash
# Configura o Google Cloud para a Pack: API no Cloud Run + disjuntor de custos.
# É o registro de tudo o que foi criado no projeto, e serve para refazer do zero num projeto novo.
#
# Uso (da raiz do repositório, com o gcloud logado):  bash google-cloud/gcloud-cli-scripts/setup.sh <etapa>
# Etapas, nesta ordem: apis imagens segredos contas github api disjuntor agendador despertador orcamento fotos
# (a etapa "fotos" cria o bucket das fotos do painel; depois dela, rode "disjuntor" de novo)
#
# Precisa do backend/.env.prod (fora do git) com NEON_URL, ADMIN_EMAIL e ADMIN_PASSWORD.

set -euo pipefail

PROJETO=pack-api-513821
REGIAO=southamerica-east1          # São Paulo, a mesma região do banco no Neon
REPO_GITHUB=Leony99/Pack
SERVICO=pack-api                   # serviço do Cloud Run
REPO_IMAGENS=pack                  # repositório do Artifact Registry
TOPICO=budget-alerts               # tópico do Pub/Sub que aciona o disjuntor (agendador e orçamento)
ORCAMENTO=1                        # segunda camada, na moeda da conta de faturamento (BRL): qualquer cobrança real

CONTA_API=pack-api-run             # identidade da API rodando
CONTA_DEPLOY=github-deploy         # identidade do GitHub Actions
CONTA_DISJUNTOR=budget-guard       # identidade da função disjuntor
BUCKET_FOTOS="$PROJETO-fotos"      # fotos dos produtos enviadas pelo painel (nome único no mundo todo)
REGIAO_FOTOS=us-central1           # a cota grátis do Cloud Storage só vale nos EUA

sa() { echo "$1@$PROJETO.iam.gserviceaccount.com"; }
IMAGEM_BASE="$REGIAO-docker.pkg.dev/$PROJETO/$REPO_IMAGENS/$SERVICO"
gc() { gcloud --project="$PROJETO" --quiet "$@"; }

# Lê uma variável do backend/.env.prod
prod() { grep -E "^$1=" backend/.env.prod | head -1 | cut -d= -f2-; }

# Separa a NEON_URL (postgresql://usuario:senha@host/banco?params) em NEON_USUARIO, NEON_SENHA, NEON_HOST e NEON_BANCO.
# Se a string for a "pooled" (host com -pooler), usa o endereço direto: o Spring já tem o próprio pool de conexões.
neon() {
    local resto
    resto=$(prod NEON_URL)
    resto=${resto#postgresql://}
    NEON_USUARIO=${resto%%:*}
    NEON_SENHA=${resto#*:}; NEON_SENHA=${NEON_SENHA%%@*}
    NEON_HOST=${resto#*@}; NEON_HOST=${NEON_HOST%%/*}; NEON_HOST=${NEON_HOST/-pooler./.}
    NEON_BANCO=${resto#*/}; NEON_BANCO=${NEON_BANCO%%\?*}
}

# Cria um segredo, ou adiciona uma versão nova se ele já existir
guardar_segredo() {
    local nome=$1 valor=$2
    if gc secrets describe "$nome" >/dev/null 2>&1; then
        printf %s "$valor" | gc secrets versions add "$nome" --data-file=-
    else
        printf %s "$valor" | gc secrets create "$nome" --replication-policy=automatic --data-file=-
    fi
}

etapa_apis() {
    # Liga os serviços do Google que a Pack usa (cada um precisa ser ativado uma vez por projeto)
    gc services enable \
        run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com \
        pubsub.googleapis.com cloudfunctions.googleapis.com cloudbuild.googleapis.com \
        eventarc.googleapis.com billingbudgets.googleapis.com cloudbilling.googleapis.com \
        iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com \
        cloudscheduler.googleapis.com monitoring.googleapis.com
}

etapa_imagens() {
    # Repositório das imagens Docker, guardando só as 2 mais recentes (cota grátis: 0,5 GB)
    gc artifacts repositories create "$REPO_IMAGENS" --repository-format=docker \
        --location="$REGIAO" --description="Imagens da Pack API" || true
    gc artifacts repositories set-cleanup-policies "$REPO_IMAGENS" --location="$REGIAO" \
        --policy=google-cloud/gcloud-scripts/config/limpeza-imagens.json --no-dry-run
}

etapa_segredos() {
    neon
    guardar_segredo pack-db-password "$NEON_SENHA"
    guardar_segredo pack-admin-password "$(prod ADMIN_PASSWORD)"
    # chave do JWT gerada aqui, aleatória; ninguém precisa conhecê-la
    guardar_segredo pack-jwt-secret "$(openssl rand -base64 48 | tr -d '\n')"
}

etapa_contas() {
    gc iam service-accounts create "$CONTA_API" --display-name="Pack API (Cloud Run)" || true
    gc iam service-accounts create "$CONTA_DEPLOY" --display-name="GitHub Actions (deploy)" || true

    # a API só lê os próprios segredos
    for s in pack-db-password pack-admin-password pack-jwt-secret; do
        gc secrets add-iam-policy-binding "$s" --member="serviceAccount:$(sa $CONTA_API)" \
            --role=roles/secretmanager.secretAccessor >/dev/null
    done

    # o GitHub Actions envia imagens e publica revisões, mas não mexe em permissões
    gc artifacts repositories add-iam-policy-binding "$REPO_IMAGENS" --location="$REGIAO" \
        --member="serviceAccount:$(sa $CONTA_DEPLOY)" --role=roles/artifactregistry.writer >/dev/null
    gc projects add-iam-policy-binding "$PROJETO" --condition=None \
        --member="serviceAccount:$(sa $CONTA_DEPLOY)" --role=roles/run.developer >/dev/null
    gc iam service-accounts add-iam-policy-binding "$(sa $CONTA_API)" \
        --member="serviceAccount:$(sa $CONTA_DEPLOY)" --role=roles/iam.serviceAccountUser >/dev/null
}

etapa_github() {
    # Workload Identity Federation: o GitHub prova quem é com um token temporário (OIDC),
    # e o Google troca por um acesso de poucos minutos. Nenhuma chave fica guardada no GitHub.
    local numero
    numero=$(gc projects describe "$PROJETO" --format='value(projectNumber)')
    # só aceita tokens deste repositório E de execuções na branch main: um workflow rodando em outra branch
    # (ou num pull request) não consegue entrar no Google Cloud, mesmo sendo do mesmo repositório
    local condicao="assertion.repository == '$REPO_GITHUB' && assertion.ref == 'refs/heads/main'"
    gc iam workload-identity-pools create github --location=global --display-name="GitHub Actions" || true
    gc iam workload-identity-pools providers create-oidc github --location=global \
        --workload-identity-pool=github --display-name="GitHub" \
        --issuer-uri=https://token.actions.githubusercontent.com \
        --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
        --attribute-condition="$condicao" || true
    # se o provedor já existia, garante a condição atual
    gc iam workload-identity-pools providers update-oidc github --location=global \
        --workload-identity-pool=github --attribute-condition="$condicao" >/dev/null
    # só este repositório pode agir como a conta de deploy
    gc iam service-accounts add-iam-policy-binding "$(sa $CONTA_DEPLOY)" \
        --role=roles/iam.workloadIdentityUser \
        --member="principalSet://iam.googleapis.com/projects/$numero/locations/global/workloadIdentityPools/github/attribute.repository/$REPO_GITHUB" >/dev/null

    echo
    echo "Variáveis para o GitHub (Settings → Secrets and variables → Actions → Variables):"
    echo "  GCP_PROJECT_ID   = $PROJETO"
    echo "  GCP_REGION       = $REGIAO"
    echo "  GCP_WIF_PROVIDER = projects/$numero/locations/global/workloadIdentityPools/github/providers/github"
    echo "  GCP_DEPLOY_SA    = $(sa $CONTA_DEPLOY)"
}

etapa_api() {
    # Primeiro deploy, feito daqui; os próximos são feitos pelo GitHub Actions (só trocam a imagem)
    local imagem="$IMAGEM_BASE:inicial"
    neon

    docker build -t "$imagem" backend
    gcloud auth print-access-token | docker login -u oauth2accesstoken --password-stdin "https://$REGIAO-docker.pkg.dev"
    docker push "$imagem"
    docker logout "https://$REGIAO-docker.pkg.dev"

    gc run deploy "$SERVICO" --image="$imagem" --region="$REGIAO" \
        --service-account="$(sa $CONTA_API)" \
        --min-instances=0 --max-instances=1 --memory=1Gi --cpu=1 --cpu-boost \
        --timeout=60 --concurrency=80 \
        --set-env-vars="SPRING_PROFILES_ACTIVE=prod,DB_URL=jdbc:postgresql://$NEON_HOST/$NEON_BANCO?sslmode=require,DB_USERNAME=$NEON_USUARIO,ADMIN_EMAIL=$(prod ADMIN_EMAIL),IMAGENS_BUCKET=$BUCKET_FOTOS" \
        --set-secrets="DB_PASSWORD=pack-db-password:latest,JWT_SECRET=pack-jwt-secret:latest,ADMIN_PASSWORD=pack-admin-password:latest" \
        --allow-unauthenticated
}

etapa_disjuntor() {
    gc pubsub topics create "$TOPICO" || true
    gc iam service-accounts create "$CONTA_DISJUNTOR" --display-name="Disjuntor de custos" || true

    # o disjuntor só pode mexer no serviço da API (para tirar o acesso público)
    gc run services add-iam-policy-binding "$SERVICO" --region="$REGIAO" \
        --member="serviceAccount:$(sa $CONTA_DISJUNTOR)" --role=roles/run.admin >/dev/null
    # e ler as métricas de uso (para medir quanto da cota grátis já foi usada)
    gc projects add-iam-policy-binding "$PROJETO" --condition=None \
        --member="serviceAccount:$(sa $CONTA_DISJUNTOR)" --role=roles/monitoring.viewer >/dev/null

    gc functions deploy pack-budget-guard --gen2 --region="$REGIAO" \
        --runtime=python312 --source=google-cloud/gcloud-scripts/budget-guard --entry-point=disjuntor \
        --trigger-topic="$TOPICO" \
        --service-account="$(sa $CONTA_DISJUNTOR)" \
        --trigger-service-account="$(sa $CONTA_DISJUNTOR)" \
        --memory=256Mi --max-instances=1 \
        --ingress-settings=internal-only \
        --set-env-vars="PROJETO=$PROJETO,SERVICO=projects/$PROJETO/locations/$REGIAO/services/$SERVICO,BUCKET_FOTOS=$BUCKET_FOTOS"

    # o Google guarda a imagem de cada versão da função num repositório próprio: mesma limpeza das imagens da API
    gc artifacts repositories set-cleanup-policies gcf-artifacts --location="$REGIAO" \
        --policy=google-cloud/gcloud-scripts/config/limpeza-imagens.json --no-dry-run >/dev/null

    # o gatilho do Pub/Sub chama a função com a identidade do disjuntor
    gc functions add-invoker-policy-binding pack-budget-guard --region="$REGIAO" \
        --member="serviceAccount:$(sa $CONTA_DISJUNTOR)" >/dev/null
}

etapa_agendador() {
    # De hora em hora pede ao disjuntor para medir a cota grátis usada no mês (3 tarefas grátis por conta)
    gc scheduler jobs create pubsub pack-verificar-cota --location="$REGIAO" \
        --schedule="0 * * * *" --time-zone="America/Sao_Paulo" \
        --topic="$TOPICO" --message-body='{"verificar": "cota"}' \
        --description="Mede a cota grátis do Cloud Run e desliga a API em 85%"
}

etapa_fotos() {
    # O bucket das fotos dos produtos enviadas pelo painel. Fica nos EUA (us-central1), onde vale a cota grátis
    # do Cloud Storage: 5 GB guardados e 5.000 envios e 50.000 leituras por mês. Fora dos EUA, cobra desde o 1º GB.
    #   - leitura pública: o site mostra cada foto direto de https://storage.googleapis.com/<bucket>/<nome>;
    #   - gravação só da API (pack-api-run), que envia as fotos pela API REST do Cloud Storage;
    #   - o disjuntor pode tirar a leitura pública quando o orçamento estoura (e o religar-api.sh devolve).
    # Depois desta etapa, rode "disjuntor" de novo: a função passa a cuidar também do bucket.
    gc storage buckets create "gs://$BUCKET_FOTOS" --location="$REGIAO_FOTOS" \
        --uniform-bucket-level-access --default-storage-class=STANDARD || true
    gc storage buckets add-iam-policy-binding "gs://$BUCKET_FOTOS" \
        --member=allUsers --role=roles/storage.objectViewer >/dev/null
    gc storage buckets add-iam-policy-binding "gs://$BUCKET_FOTOS" \
        --member="serviceAccount:$(sa $CONTA_API)" --role=roles/storage.objectAdmin >/dev/null
    # o disjuntor muda quem pode ler o bucket (só neste bucket)
    gc storage buckets add-iam-policy-binding "gs://$BUCKET_FOTOS" \
        --member="serviceAccount:$(sa $CONTA_DISJUNTOR)" --role=roles/storage.admin >/dev/null
    # a API passa a guardar as fotos no bucket (o deploy do GitHub só troca a imagem: a variável fica)
    gc run services update "$SERVICO" --region="$REGIAO" --update-env-vars="IMAGENS_BUCKET=$BUCKET_FOTOS"
}

etapa_despertador() {
    # A cada 12 minutos chama a API, para o Cloud Run não desligá-la por falta de visitas (ele desliga
    # uma instância parada depois de uns 15 minutos, e religar o Spring Boot leva de 10 a 30 s).
    # 5 chamadas por hora: ~3.600 por mês, perto de 0,2% dos 2 milhões de requisições grátis. Na
    # cobrança por requisição, a instância parada entre uma chamada e outra não é cobrada.
    # A rota /actuator/health/liveness não consulta o banco: o Neon continua dormindo quando ninguém usa
    # (a /actuator/health completa o acordaria a cada chamada e gastaria a cota de horas dele).
    # É a segunda tarefa do Cloud Scheduler (com a pack-verificar-cota); a conta tem 3 grátis.
    local url
    url=$(gc run services describe "$SERVICO" --region="$REGIAO" --format='value(status.url)')
    gc scheduler jobs create http pack-despertador --location="$REGIAO" \
        --schedule="*/12 * * * *" --time-zone="America/Sao_Paulo" \
        --uri="$url/actuator/health/liveness" --http-method=GET \
        --attempt-deadline=60s --max-retry-attempts=0 \
        --description="Chama a API a cada 12 min para ela não desligar (sem tocar no banco)"
}

etapa_orcamento() {
    local conta
    conta=$(gc billing projects describe "$PROJETO" --format='value(billingAccountName)')
    conta=${conta#billingAccounts/}
    local moeda
    moeda=$(gc billing accounts describe "$conta" --format='value(currencyCode)')

    # Segunda camada: o orçamento mede dinheiro cobrado (o uso dentro da cota grátis custa zero).
    # Avisos por e-mail em 50%, 90% e 100%; o Pub/Sub recebe todos, e o disjuntor age em 100%.
    local existente
    existente=$(gc billing budgets list --billing-account="$conta" --billing-project="$PROJETO" \
        --filter='displayName="pack"' --format='value(name)')
    if [ -n "$existente" ]; then
        gc billing budgets update "$existente" --billing-project="$PROJETO" --budget-amount="$ORCAMENTO$moeda"
    else
        gc billing budgets create --billing-account="$conta" --billing-project="$PROJETO" \
            --display-name="pack" --budget-amount="$ORCAMENTO$moeda" \
            --filter-projects="projects/$PROJETO" \
            --threshold-rule=percent=0.5 --threshold-rule=percent=0.9 --threshold-rule=percent=1.0 \
            --notifications-rule-pubsub-topic="projects/$PROJETO/topics/$TOPICO"
    fi
}

etapa=${1:-}
case "$etapa" in
    apis|imagens|segredos|contas|github|api|disjuntor|agendador|despertador|orcamento|fotos) "etapa_$etapa" ;;
    *) echo "Uso: bash google-cloud/gcloud-cli-scripts/setup.sh <apis|imagens|segredos|contas|github|api|disjuntor|agendador|despertador|orcamento|fotos>"; exit 1 ;;
esac
