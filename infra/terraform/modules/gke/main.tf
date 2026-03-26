resource "google_container_cluster" "main" {
  name     = var.cluster_name
  location = var.region
  project  = var.project_id

  enable_autopilot = true

  # Prevent accidental destruction of the cluster
  deletion_protection = true

  # Autopilot manages networking, node pools, and most settings automatically.
  # Use ignore_changes for attributes that GCP Autopilot overrides.
  lifecycle {
    ignore_changes = [
      node_config,
      node_pool,
    ]
  }
}
