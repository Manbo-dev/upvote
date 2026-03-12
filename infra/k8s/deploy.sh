#!/bin/bash
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
CLUSTER_NAME="${GKE_CLUSTER_NAME:-upvote-cluster}"
NAMESPACE="upvote"
MANIFEST_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Conectando ao cluster GKE..."
gcloud container clusters get-credentials "${CLUSTER_NAME}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}"

echo "==> Criando namespace (se não existir)..."
kubectl apply -f "${MANIFEST_DIR}/namespace.yaml"

# Aplica secrets a partir do .env (se existir) ou do secrets.yaml como fallback
ENV_FILE="$(cd "${MANIFEST_DIR}/../.." && pwd)/.env"
if [ -f "${ENV_FILE}" ]; then
  echo "==> Aplicando secrets via apply-secrets.sh (.env encontrado)..."
  bash "${MANIFEST_DIR}/apply-secrets.sh"
else
  echo "==> .env não encontrado. Aplicando secrets.yaml (placeholders)..."
  echo "    AVISO: Preencha o .env com credenciais reais antes do deploy em produção."
  kubectl apply -f "${MANIFEST_DIR}/secrets.yaml"
fi

echo "==> Aplicando RabbitMQ..."
kubectl apply -f "${MANIFEST_DIR}/rabbitmq.yaml"

echo "==> Aplicando Redis..."
kubectl apply -f "${MANIFEST_DIR}/redis.yaml"

echo "==> Aguardando RabbitMQ ficar pronto..."
kubectl rollout status deployment/rabbitmq -n "${NAMESPACE}" --timeout=120s

echo "==> Aguardando Redis ficar pronto..."
kubectl rollout status deployment/redis -n "${NAMESPACE}" --timeout=60s

echo "==> Aplicando deployment da API..."
kubectl apply -f "${MANIFEST_DIR}/deployment.yaml"

echo "==> Aplicando HPA..."
kubectl apply -f "${MANIFEST_DIR}/hpa.yaml"

echo "==> Aguardando API ficar pronta..."
kubectl rollout status deployment/api -n "${NAMESPACE}" --timeout=180s

echo ""
echo "==> Deploy concluído! Buscando IP externo..."
echo ""
kubectl get svc api-service -n "${NAMESPACE}" -o wide