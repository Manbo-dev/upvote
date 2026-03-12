#!/bin/bash
set -e

PROJECT_ID="project-38c32df4-c37c-41d9-b5d"
SERVICE_ACCOUNT="223057559224-compute@developer.gserviceaccount.com"

SECRETS=(
  DB_HOST DB_PORT DB_NAME DB_USERNAME DB_PASSWORD
  JWT_SECRET JWT_EXPIRATION
  MAIL_HOST MAIL_PORT MAIL_USERNAME MAIL_PASSWORD
  CORS_ORIGINS
  RABBITMQ_USER RABBITMQ_PASSWORD
  GCP_PROJECT_ID
)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../../.env.production"

echo "==> Ativando API do Secret Manager..."
gcloud services enable secretmanager.googleapis.com --project="${PROJECT_ID}"

echo "==> Criando secrets no Google Secret Manager..."
echo ""

for secret in "${SECRETS[@]}"; do
  # Verifica se o secret já existe
  if gcloud secrets describe "${secret}" --project="${PROJECT_ID}" &>/dev/null; then
    echo "   [OK] ${secret} já existe — pulando."
    continue
  fi

  # Tenta ler do .env.production
  value=""
  if [ -f "${ENV_FILE}" ]; then
    value=$(grep -E "^${secret}=" "${ENV_FILE}" 2>/dev/null | head -1 | cut -d'=' -f2-)
  fi

  # Se não encontrou no arquivo, pede interativamente
  if [ -z "${value}" ]; then
    echo -n "   Digite o valor para ${secret}: "
    read -r value
    if [ -z "${value}" ]; then
      echo "   ⚠️  Valor vazio para ${secret} — pulando."
      continue
    fi
  fi

  # Cria o secret
  echo -n "${value}" | gcloud secrets create "${secret}" \
    --project="${PROJECT_ID}" \
    --replication-policy="automatic" \
    --data-file=-

  echo "   [CRIADO] ${secret}"
done

echo ""
echo "==> Concedendo permissão de leitura para a service account..."
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor" \
  --condition="None" \
  --quiet

echo ""
echo "==> Setup concluído!"
echo ""
echo "Para atualizar um secret existente:"
echo "  echo -n \"novo-valor\" | gcloud secrets versions add NOME_DO_SECRET --data-file=- --project=${PROJECT_ID}"
