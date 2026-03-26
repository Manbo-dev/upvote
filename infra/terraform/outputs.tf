output "cluster_endpoint" {
  description = "GKE cluster endpoint"
  value       = module.gke.cluster_endpoint
  sensitive   = true
}

output "cluster_ca_certificate" {
  description = "GKE cluster CA certificate"
  value       = module.gke.cluster_ca_certificate
  sensitive   = true
}

output "artifact_registry_url" {
  description = "Artifact Registry Docker repository URL"
  value       = module.artifact_registry.repository_url
}

output "wif_provider_name" {
  description = "Full Workload Identity Federation provider name (for GitHub Actions)"
  value       = module.workload_identity.provider_name
}

output "github_actions_sa_email" {
  description = "GitHub Actions service account email"
  value       = module.iam.github_actions_sa_email
}
