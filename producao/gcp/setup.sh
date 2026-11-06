#!/usr/bin/env bash
# Configura o Google Cloud para a Pack: API no Cloud Run + disjuntor de custos.
# É o registro de tudo o que foi criado no projeto, e serve para refazer do zero num projeto novo.
#
# Uso (da raiz do repositório, com o gcloud logado):  bash producao/gcp/setup.sh <etapa>
# Etapas, nesta ordem: apis imagens segredos contas github api disjuntor agendador orcamento
#
# Precisa do .env.prod na raiz (fora do git) com NEON_URL, ADMIN_EMAIL e ADMIN_PASSWORD.

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

sa() { echo "$1@$PROJETO.iam.gserviceaccount.com"; }
IMAGEM_BASE="$REGIAO-docker.pkg.dev/$PROJETO/$REPO_IMAGENS/$SERVICO"
gc() { gcloud --project="$PROJETO" --quiet "$@"; }

# Lê uma variável do .env.prod
prod() { grep -E "^$1=" .env.prod | head -1 | cut -d= -f2-; }

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
        --policy=producao/gcp/limpeza-imagens.json --no-dry-run
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
    gc iam workload-identity-pools create github --location=global --display-name="GitHub Actions" || true
    gc iam workload-identity-pools providers create-oidc github --location=global \
        --workload-identity-pool=github --display-name="GitHub" \
        --issuer-uri=https://token.actions.githubusercontent.com \
        --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
        --attribute-condition="assertion.repository == '$REPO_GITHUB'" || true
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
        --set-env-vars="SPRING_PROFILES_ACTIVE=prod,DB_URL=jdbc:postgresql://$NEON_HOST/$NEON_BANCO?sslmode=require,DB_USERNAME=$NEON_USUARIO,ADMIN_EMAIL=$(prod ADMIN_EMAIL)" \
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
        --runtime=python312 --source=producao/budget-guard --entry-point=disjuntor \
        --trigger-topic="$TOPICO" \
        --service-account="$(sa $CONTA_DISJUNTOR)" \
        --trigger-service-account="$(sa $CONTA_DISJUNTOR)" \
        --memory=256Mi --max-instances=1 \
        --ingress-settings=internal-only \
        --set-env-vars="PROJETO=$PROJETO,SERVICO=projects/$PROJETO/locations/$REGIAO/services/$SERVICO"

    # o Google guarda a imagem de cada versão da função num repositório próprio: mesma limpeza das imagens da API
    gc artifacts repositories set-cleanup-policies gcf-artifacts --location="$REGIAO" \
        --policy=producao/gcp/limpeza-imagens.json --no-dry-run >/dev/null

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
    apis|imagens|segredos|contas|github|api|disjuntor|agendador|orcamento) "etapa_$etapa" ;;
    *) echo "Uso: bash producao/gcp/setup.sh <apis|imagens|segredos|contas|github|api|disjuntor|agendador|orcamento>"; exit 1 ;;
esac
