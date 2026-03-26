output "github_actions_sa_email" {
  description = "GitHub Actions service account email"
  value       = google_service_account.github_actions.email
}

output "grafana_metrics_reader_sa_email" {
  description = "Grafana metrics reader service account email"
  value       = google_service_account.grafana_metrics_reader.email
}
