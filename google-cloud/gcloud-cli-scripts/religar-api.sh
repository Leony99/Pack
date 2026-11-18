#!/usr/bin/env bash
# Devolve o acesso público da API depois que o disjuntor de custos a tirou do ar.
# Antes de rodar, veja no painel de Faturamento o que causou o gasto.
#
# Uso (da raiz do repositório, com o gcloud logado): bash google-cloud/gcloud-cli-scripts/religar-api.sh
# Sem o gcloud instalado: rode o mesmo comando abaixo no Cloud Shell (botão >_ no console do Google Cloud).

set -euo pipefail

gcloud run services add-iam-policy-binding pack-api \
    --project=pack-api-513821 --region=southamerica-east1 \
    --member=allUsers --role=roles/run.invoker

# as fotos do painel, se o disjuntor também as tirou do ar
gcloud storage buckets add-iam-policy-binding gs://pack-api-513821-fotos \
    --project=pack-api-513821 --member=allUsers --role=roles/storage.objectViewer >/dev/null \
    && echo "Fotos públicas de novo." || echo "Sem o bucket das fotos (etapa fotos do setup.sh ainda não rodou)."

echo "API pública de novo."
