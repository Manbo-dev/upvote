terraform {
  backend "gcs" {
    bucket = "upvote-tofu-state-38c32df4"
    prefix = "infra/state"
  }
}
