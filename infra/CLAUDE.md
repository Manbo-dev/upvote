# Infra — Kubernetes + Jenkins

## Kubernetes
- Namespace: upvote
- Cluster gerenciado (ex: GKE, EKS ou DigitalOcean)
- Todos os manifests em infra/k8s/
- Aplicar tudo: kubectl apply -f infra/k8s/

## Serviços no cluster
- api → Deployment Spring Boot (2-10 réplicas via HPA)
- web → Deployment React servido via nginx
- postgres → StatefulSet com PersistentVolumeClaim
- redis → Deployment Redis
- rabbitmq → Deployment RabbitMQ

## Secrets
- Nunca commitar valores reais em secrets.yaml
- O arquivo secrets.yaml no repo tem apenas placeholders
- Valores reais são injetados pelo Jenkins via credenciais

## Jenkins
- Pipeline declarativo em infra/jenkins/Jenkinsfile
- Stages: Checkout → Test → Build → Docker Push → Deploy
- Credenciais necessárias no Jenkins:
  - DOCKER_REGISTRY
  - KUBECONFIG_CREDENTIALS
  - DB_PASSWORD, JWT_SECRET (injetados como secrets no deploy)

## Fluxo de deploy
Push na branch main
  → Jenkins detecta via webhook
  → Roda testes
  → Builda imagens Docker
  → Push para registry
  → kubectl apply nos manifests
  → Kubernetes faz rolling update sem downtime

## Regras
- Nunca fazer kubectl apply manual em produção — sempre via Jenkins
- Sempre usar resource limits nos containers (cpu e memory)
- Liveness probe em /actuator/health (api) e / (web)
- Readiness probe antes de receber tráfego
