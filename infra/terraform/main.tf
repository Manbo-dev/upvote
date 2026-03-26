# Root module — wires all infrastructure modules together

module "iam" {
  source = "./modules/iam"

  project_id = var.project_id
}

module "workload_identity" {
  source = "./modules/workload-identity"

  project_id     = var.project_id
  project_number = var.project_number
  github_repo    = var.github_repo
  sa_email       = module.iam.github_actions_sa_email
}

module "gke" {
  source = "./modules/gke"

  project_id   = var.project_id
  region       = var.region
  cluster_name = var.cluster_name
}

module "artifact_registry" {
  source = "./modules/artifact-registry"

  project_id = var.project_id
  region     = var.region
}

module "secret_manager" {
  source = "./modules/secret-manager"

  project_id   = var.project_id
  secret_names = var.secret_names
}
