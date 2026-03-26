output "provider_name" {
  description = "Full Workload Identity Federation provider name"
  value       = google_iam_workload_identity_pool_provider.github_actions.name
}

output "pool_name" {
  description = "Workload Identity Pool name"
  value       = google_iam_workload_identity_pool.github_actions.name
}
