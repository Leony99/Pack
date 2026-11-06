#!/usr/bin/env bash
# Devolve o acesso público da API depois que o disjuntor de custos a tirou do ar.
# Antes de rodar, veja no painel de Faturamento o que causou o gasto.
#
# Uso: bash producao/gcp/religar-api.sh
# Sem o gcloud instalado: rode o mesmo comando abaixo no Cloud Shell (botão >_ no console do Google Cloud).

set -euo pipefail

gcloud run services add-iam-policy-binding pack-api \
    --project=pack-api-513821 --region=southamerica-east1 \
    --member=allUsers --role=roles/run.invoker

echo "API pública de novo."
