# Infra — GKE Autopilot + GitHub Actions

## Kubernetes
- Cluster: GKE Autopilot (upvote-cluster, europe-west1)
- Namespace: upvote
- Projeto GCP: project-38c32df4-c37c-41d9-b5d
- Todos os manifests em infra/k8s/

## Serviços no cluster
- api → Deployment Spring Boot 3.4.3 (2-10 réplicas via HPA), Service LoadBalancer porta 8080
- redis → Deployment Redis 7-alpine, Service ClusterIP porta 6379
- rabbitmq → Deployment RabbitMQ 3-management-alpine, Service ClusterIP portas 5672/15672

## Banco de dados
- PostgreSQL gerenciado no Neon.tech (externo ao cluster)
- Conexão via secrets injetados do Google Secret Manager

## Secrets
- Nunca commitar valores reais em secrets.yaml
- O arquivo secrets.yaml no repo tem apenas placeholders
- Valores reais ficam no Google Secret Manager
- Script apply-secrets.sh busca do Secret Manager e aplica no cluster

## CI/CD (GitHub Actions)
- Workflow em .github/workflows/deploy.yml
- Autenticação via Workload Identity Federation (sem chave JSON)
- Fluxo: Build (linux/amd64) → Push Artifact Registry → Apply secrets → Apply manifests → Rollout

## Fluxo de deploy
Push na branch main
  → GitHub Actions dispara automaticamente
  → Builda imagem Docker (--platform linux/amd64)
  → Push para Artifact Registry (tags: latest + SHA)
  → Aplica secrets do Secret Manager no cluster
  → kubectl apply nos manifests (namespace → secrets → rabbitmq → redis → api → hpa)
  → kubectl rollout status aguarda conclusão

## Regras
- Sempre buildar imagens com --platform linux/amd64 (Mac M1/M2/M3 gera arm64)
- Sempre usar resource limits nos containers (cpu e memory)
- Liveness probe da API em /actuator/health
- RabbitMQ usa tcpSocket probe (exec é lento demais)
- Para ligar/desligar pods: usar scripts start.sh e stop.sh
