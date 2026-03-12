#!/bin/bash
set -e

PROJECT_ID="project-38c32df4-c37c-41d9-b5d"
PROJECT_NUMBER="223057559224"
GITHUB_REPO="Manbo-dev/upvote"
SA_NAME="github-actions"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
POOL_NAME="github-actions-pool"
PROVIDER_NAME="github-actions-provider"

echo "==> Criando Service Account '${SA_NAME}'..."
gcloud iam service-accounts create "${SA_NAME}" \
  --project="${PROJECT_ID}" \
  --display-name="GitHub Actions CI/CD" \
  2>/dev/null || echo "   Service Account já existe — pulando."

echo "==> Concedendo roles necessárias..."
for role in roles/artifactregistry.writer roles/container.developer roles/secretmanager.secretAccessor; do
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="${role}" \
    --condition="None" \
    --quiet
  echo "   [OK] ${role}"
done

echo "==> Criando Workload Identity Pool..."
gcloud iam workload-identity-pools create "${POOL_NAME}" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions Pool" \
  2>/dev/null || echo "   Pool já existe — pulando."

echo "==> Criando Workload Identity Provider (OIDC para GitHub)..."
gcloud iam workload-identity-pools providers create-oidc "${PROVIDER_NAME}" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="${POOL_NAME}" \
  --display-name="GitHub Actions Provider" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='${GITHUB_REPO}'" \
  2>/dev/null || echo "   Provider já existe — pulando."

echo "==> Vinculando Service Account ao Workload Identity Pool..."
gcloud iam service-accounts add-iam-policy-binding "${SA_EMAIL}" \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_NAME}/attribute.repository/${GITHUB_REPO}" \
  --quiet

PROVIDER_FULL="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_NAME}/providers/${PROVIDER_NAME}"

echo ""
echo "=========================================="
echo " Setup concluído!"
echo "=========================================="
echo ""
echo "Adicione estes secrets no GitHub (Settings → Secrets → Actions):"
echo ""
echo "  GCP_PROJECT_ID              = ${PROJECT_ID}"
echo "  GCP_WORKLOAD_IDENTITY_PROVIDER = ${PROVIDER_FULL}"
echo "  GCP_SERVICE_ACCOUNT         = ${SA_EMAIL}"
echo ""
echo "Repositório autorizado: ${GITHUB_REPO}"
echo ""
