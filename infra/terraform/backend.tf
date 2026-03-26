terraform {
  backend "gcs" {
    bucket = "upvote-terraform-state"
    prefix = "infra/state"
  }
}
