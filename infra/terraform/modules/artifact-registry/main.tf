resource "google_artifact_registry_repository" "main" {
  repository_id = "upvote"
  location      = var.region
  project       = var.project_id
  format        = "DOCKER"
  description   = "Docker images for Upvote API"
}
