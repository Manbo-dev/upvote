#!/bin/bash
# One-time script to import existing GCP resources into Terraform state.
# Run this AFTER `terraform init` and BEFORE `terraform plan`.
#
# Usage: cd infra/terraform && ./import.sh

set -euo pipefail

PROJECT="project-38c32df4-c37c-41d9-b5d"

echo "=== Importing IAM: Service Accounts ==="
terraform import module.iam.google_service_account.github_actions \
  "projects/${PROJECT}/serviceAccounts/github-actions@${PROJECT}.iam.gserviceaccount.com"

terraform import module.iam.google_service_account.grafana_metrics_reader \
  "projects/${PROJECT}/serviceAccounts/grafana-metrics-reader@${PROJECT}.iam.gserviceaccount.com"

echo "=== Importing IAM: Role Bindings ==="
terraform import module.iam.google_project_iam_member.github_actions_ar_writer \
  "${PROJECT} roles/artifactregistry.writer serviceAccount:github-actions@${PROJECT}.iam.gserviceaccount.com"

terraform import module.iam.google_project_iam_member.github_actions_container_developer \
  "${PROJECT} roles/container.developer serviceAccount:github-actions@${PROJECT}.iam.gserviceaccount.com"

terraform import module.iam.google_project_iam_member.github_actions_secret_accessor \
  "${PROJECT} roles/secretmanager.secretAccessor serviceAccount:github-actions@${PROJECT}.iam.gserviceaccount.com"

terraform import module.iam.google_project_iam_member.grafana_monitoring_viewer \
  "${PROJECT} roles/monitoring.viewer serviceAccount:grafana-metrics-reader@${PROJECT}.iam.gserviceaccount.com"

echo "=== Importing Workload Identity Federation ==="
terraform import module.workload_identity.google_iam_workload_identity_pool.github_actions \
  "projects/${PROJECT}/locations/global/workloadIdentityPools/github-actions-pool"

terraform import module.workload_identity.google_iam_workload_identity_pool_provider.github_actions \
  "projects/${PROJECT}/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider"

echo "=== Importing GKE Cluster ==="
terraform import module.gke.google_container_cluster.main \
  "projects/${PROJECT}/locations/europe-west1/clusters/upvote-cluster"

echo "=== Importing Artifact Registry ==="
terraform import module.artifact_registry.google_artifact_registry_repository.main \
  "projects/${PROJECT}/locations/europe-west1/repositories/upvote"

echo "=== Importing Secret Manager Secrets ==="
SECRETS=(
  DB_HOST DB_PORT DB_NAME DB_USERNAME DB_PASSWORD
  JWT_SECRET JWT_EXPIRATION
  MAIL_HOST MAIL_PORT MAIL_USERNAME MAIL_PASSWORD
  CORS_ORIGINS
  RABBITMQ_USER RABBITMQ_PASSWORD
  STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET STRIPE_STARTER_PRICE_ID STRIPE_PRO_PRICE_ID
  GEMINI_API_KEY
  JIRA_CLIENT_ID JIRA_CLIENT_SECRET
  CLICKUP_CLIENT_ID CLICKUP_CLIENT_SECRET
  OAUTH_CALLBACK_BASE_URL
)

for secret in "${SECRETS[@]}"; do
  echo "  Importing secret: ${secret}"
  terraform import "module.secret_manager.google_secret_manager_secret.secrets[\"${secret}\"]" \
    "projects/${PROJECT}/secrets/${secret}"
done

echo ""
echo "=== Import complete! ==="
echo "Run 'terraform plan' to verify zero diff."
