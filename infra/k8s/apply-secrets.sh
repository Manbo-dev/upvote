#!/bin/bash
set -e

PROJECT_ID="project-38c32df4-c37c-41d9-b5d"
NAMESPACE="upvote"

SECRETS=(
  DB_HOST DB_PORT DB_NAME DB_USERNAME DB_PASSWORD
  JWT_SECRET JWT_EXPIRATION
  MAIL_HOST MAIL_PORT MAIL_USERNAME MAIL_PASSWORD MAIL_FROM
  CORS_ORIGINS
  RABBITMQ_USER RABBITMQ_PASSWORD
  STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET STRIPE_STARTER_PRICE_ID STRIPE_PRO_PRICE_ID STRIPE_BUSINESS_PRICE_ID
  GEMINI_API_KEY
  GOOGLE_CLIENT_ID
  JIRA_CLIENT_ID JIRA_CLIENT_SECRET
  CLICKUP_CLIENT_ID CLICKUP_CLIENT_SECRET
  OAUTH_CALLBACK_BASE_URL
)

echo "==> Buscando secrets do Google Secret Manager (projeto: ${PROJECT_ID})..."

# Monta os --from-literal dinamicamente
FROM_LITERALS=()
ERRORS=()

for secret in "${SECRETS[@]}"; do
  value=$(gcloud secrets versions access latest \
    --secret="${secret}" \
    --project="${PROJECT_ID}" 2>/dev/null) || true

  if [ -z "${value}" ]; then
    ERRORS+=("${secret}")
  else
    FROM_LITERALS+=("--from-literal=${secret}=${value}")
  fi
done

# Se algum secret não foi encontrado, exibe erro e aborta
if [ ${#ERRORS[@]} -gt 0 ]; then
  echo "❌ Os seguintes secrets não foram encontrados no Secret Manager:"
  for err in "${ERRORS[@]}"; do
    echo "   - ${err}"
  done
  echo ""
  echo "Crie os secrets faltantes com:"
  echo "  echo -n \"valor\" | gcloud secrets versions add NOME_DO_SECRET --data-file=- --project=${PROJECT_ID}"
  echo ""
  echo "Ou rode o setup inicial:"
  echo "  ./infra/scripts/setup-secret-manager.sh"
  exit 1
fi

echo "==> Criando/atualizando secret upvote-secrets no namespace ${NAMESPACE}..."

kubectl create secret generic upvote-secrets \
  --namespace="${NAMESPACE}" \
  "${FROM_LITERALS[@]}" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "==> Secret upvote-secrets aplicado com sucesso!"
