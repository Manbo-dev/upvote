resource "google_container_cluster" "main" {
  name     = var.cluster_name
  location = var.region
  project  = var.project_id

  enable_autopilot = true

  # Prevent accidental destruction of the cluster
  deletion_protection = true

  # Maintenance window (daily 03:00-07:00 UTC)
  maintenance_policy {
    recurring_window {
      start_time = "2026-03-20T03:00:00Z"
      end_time   = "2026-03-20T07:00:00Z"
      recurrence = "FREQ=DAILY"
    }
  }

  # Autopilot manages networking, node pools, and most settings automatically.
  # Use ignore_changes for attributes that GCP Autopilot overrides.
  lifecycle {
    ignore_changes = [
      node_config,
      node_pool,
    ]
  }
}
