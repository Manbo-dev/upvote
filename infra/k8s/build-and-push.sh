

#!/bin/bash
# Carrega variáveis do .env na raiz do projeto
set -e

# Carrega variáveis do .env na raiz do projeto
ENV_FILE="$(dirname "$0")/../../.env"
if [ -f "$ENV_FILE" ]; then
  source "$ENV_FILE"
else
  echo "❌ Arquivo .env não encontrado em $ENV_FILE"
  exit 1
fi

# Configurações — ajuste conforme seu projeto GCP
PROJECT_ID="${GCP_PROJECT_ID:?Defina a variável GCP_PROJECT_ID}"
REGION="europe-west1"
REPO_NAME="upvote"
IMAGE_NAME="api"
TAG="${1:-latest}"

FULL_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:${TAG}"

echo "==> Autenticando no Google Cloud..."
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

echo "==> Criando repositório no Artifact Registry (se não existir)..."
gcloud artifacts repositories describe "${REPO_NAME}" \
  --project="${PROJECT_ID}" \
  --location="${REGION}" 2>/dev/null || \
gcloud artifacts repositories create "${REPO_NAME}" \
  --project="${PROJECT_ID}" \
  --location="${REGION}" \
  --repository-format=docker \
  --description="Imagens Docker do Upvote"

echo "==> Buildando imagem Docker (linux/amd64 para GKE)..."
docker build --platform linux/amd64 -t "${FULL_IMAGE}" -f apps/api/Dockerfile apps/api

echo "==> Fazendo push para ${FULL_IMAGE}..."
docker push "${FULL_IMAGE}"

echo "==> Imagem enviada com sucesso: ${FULL_IMAGE}"