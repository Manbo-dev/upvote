# Manages the existence of secrets in Secret Manager.
# Secret VALUES are managed manually via gcloud / apply-secrets.sh — never in Terraform.

resource "google_secret_manager_secret" "secrets" {
  for_each  = toset(var.secret_names)
  secret_id = each.value
  project   = var.project_id

  replication {
    auto {}
  }

  lifecycle {
    # Prevent Terraform from destroying secrets that contain production data
    prevent_destroy = true
  }
}
