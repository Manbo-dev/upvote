# Service account for GitHub Actions CI/CD
resource "google_service_account" "github_actions" {
  account_id   = "github-actions"
  display_name = "GitHub Actions CI/CD"
  project      = var.project_id
}

# Service account for Grafana Cloud metrics reader
resource "google_service_account" "grafana_metrics_reader" {
  account_id   = "grafana-metrics-reader"
  display_name = "Grafana Cloud Metrics Reader"
  project      = var.project_id
}

# IAM bindings for GitHub Actions SA
# Using google_project_iam_member (additive) to avoid revoking other bindings

resource "google_project_iam_member" "github_actions_ar_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

resource "google_project_iam_member" "github_actions_container_developer" {
  project = var.project_id
  role    = "roles/container.developer"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

resource "google_project_iam_member" "github_actions_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# IAM binding for Grafana metrics reader SA
resource "google_project_iam_member" "grafana_monitoring_viewer" {
  project = var.project_id
  role    = "roles/monitoring.viewer"
  member  = "serviceAccount:${google_service_account.grafana_metrics_reader.email}"
}
