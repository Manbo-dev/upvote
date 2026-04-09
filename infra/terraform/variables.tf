variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "project_number" {
  description = "GCP project number (numeric)"
  type        = string
}

variable "region" {
  description = "GCP region for all resources"
  type        = string
  default     = "europe-west1"
}

variable "cluster_name" {
  description = "GKE Autopilot cluster name"
  type        = string
  default     = "upvote-cluster"
}

variable "github_repo" {
  description = "GitHub repository in format owner/repo"
  type        = string
  default     = "Manbo-dev/upvote"
}

variable "secret_names" {
  description = "List of Secret Manager secret names to manage"
  type        = list(string)
  default = [
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "DB_USERNAME",
    "DB_PASSWORD",
    "JWT_SECRET",
    "JWT_EXPIRATION",
    "MAIL_HOST",
    "MAIL_PORT",
    "MAIL_USERNAME",
    "MAIL_PASSWORD",
    "MAIL_FROM",
    "CORS_ORIGINS",
    "RABBITMQ_USER",
    "RABBITMQ_PASSWORD",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_STARTER_PRICE_ID",
    "STRIPE_PRO_PRICE_ID",
    "STRIPE_BUSINESS_PRICE_ID",
    "GEMINI_API_KEY",
    "GOOGLE_CLIENT_ID",
    "JIRA_CLIENT_ID",
    "JIRA_CLIENT_SECRET",
    "CLICKUP_CLIENT_ID",
    "CLICKUP_CLIENT_SECRET",
    "OAUTH_CALLBACK_BASE_URL",
  ]
}
