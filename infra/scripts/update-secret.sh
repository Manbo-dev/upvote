#!/bin/bash
# TODO: Restringir execução deste script apenas para usuários autorizados.
# Implementar verificação de role/permissão via IAM ou lista de emails permitidos
# antes de permitir a atualização de secrets em produção.
set -e

PROJECT_ID="project-38c32df4-c37c-41d9-b5d"

VALID_SECRETS=(
  DB_HOST DB_PORT DB_NAME DB_USERNAME DB_PASSWORD
  JWT_SECRET JWT_EXPIRATION
  MAIL_HOST MAIL_PORT MAIL_USERNAME MAIL_PASSWORD
  CORS_ORIGINS
  RABBITMQ_USER RABBITMQ_PASSWORD
  GCP_PROJECT_ID
)

usage() {
  echo "Uso: $0 <NOME_DO_SECRET> <NOVO_VALOR>"
  echo ""
  echo "Atualiza um secret no Google Secret Manager."
  echo ""
  echo "Secrets disponíveis:"
  for s in "${VALID_SECRETS[@]}"; do
    echo "  - ${s}"
  done
  echo ""
  echo "Exemplos:"
  echo "  $0 DB_PASSWORD nova-senha-segura"
  echo "  $0 JWT_SECRET minha-nova-chave-jwt"
  exit 1
}

if [ $# -lt 2 ]; then
  usage
fi

SECRET_NAME="$1"
SECRET_VALUE="$2"

# Valida se o secret é permitido
FOUND=false
for s in "${VALID_SECRETS[@]}"; do
  if [ "${s}" = "${SECRET_NAME}" ]; then
    FOUND=true
    break
  fi
done

if [ "${FOUND}" = false ]; then
  echo "❌ Secret '${SECRET_NAME}' não é válido."
  echo ""
  usage
fi

# Verifica se o secret existe no Secret Manager
if ! gcloud secrets describe "${SECRET_NAME}" --project="${PROJECT_ID}" &>/dev/null; then
  echo "❌ Secret '${SECRET_NAME}' não existe no Google Secret Manager."
  echo "   Crie primeiro com: echo -n \"valor\" | gcloud secrets create ${SECRET_NAME} --project=${PROJECT_ID} --replication-policy=automatic --data-file=-"
  exit 1
fi

echo "==> Atualizando secret '${SECRET_NAME}'..."
echo -n "${SECRET_VALUE}" | gcloud secrets versions add "${SECRET_NAME}" \
  --data-file=- \
  --project="${PROJECT_ID}"

echo "==> Secret '${SECRET_NAME}' atualizado com sucesso!"
echo ""
echo "Para aplicar no cluster Kubernetes, rode:"
echo "  ./infra/k8s/apply-secrets.sh"
