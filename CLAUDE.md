# Upvote — Contexto Geral do Projeto

## O que é
SaaS de feedback de produto. Empresas embarcam um widget no seu
produto, usuários finais enviam sugestões e votam nas que mais
querem ver implementadas. O dono do produto gerencia um board
com status de roadmap público.

## Motivação do projeto
Projeto pessoal com objetivo duplo: aprender todo o ciclo de
desenvolvimento moderno (do código ao deploy) e potencialmente
monetizar. Concorre com Canny.io focando no mercado brasileiro
com preço mais acessível.

## Stack completa
- Frontend: React 18 + TypeScript + Vite + TailwindCSS
- Backend: Spring Boot 3.4.3 + Java 21 + PostgreSQL (Neon.tech)
- Widget: TypeScript puro embarcável via script tag
- Cache: Redis
- Filas: RabbitMQ
- Infra: GKE Autopilot + GitHub Actions CI/CD
- Testes backend: JUnit 5 + Mockito + Testcontainers
- Testes frontend: Vitest + React Testing Library + MSW

## Estrutura do monorepo
- apps/web → frontend React (porta 5173 em dev)
- apps/api → backend Spring Boot (porta 8080 em dev)
- packages/widget → widget JS embarcável
- infra/k8s → manifests Kubernetes + scripts de deploy
- infra/scripts → scripts de setup (Secret Manager, GitHub Actions, start/stop)
- .github/workflows → GitHub Actions CI/CD

## Como rodar localmente
# 1. Subir infraestrutura
docker-compose up -d

# 2. Backend
cd apps/api
mvn spring-boot:run

# 3. Frontend
cd apps/web
npm install && npm run dev

# 4. Widget
cd packages/widget
npm install && npm run dev

## Regras globais obrigatórias
- Comentários de código sempre em português
- Commits em português no formato: tipo(escopo): descrição
- Respostas da API sempre no padrão ApiResponse<T>
- Autenticação via JWT stateless (sem sessão no servidor)
- Multi-tenancy: cada Organization tem seus Products isolados
- Nunca commitar secrets ou .env — usar .env.example como referência
- Branches: main (produção), develop (desenvolvimento), feature/* (features)

## Modelo de negócio
- Plano Free: 1 produto, 50 sugestões, sem widget
- Plano Starter R$49/mês: 3 produtos, widget básico
- Plano Pro R$129/mês: 10 produtos, changelog, roadmap público
- Plano Business R$299/mês: ilimitado, SSO, API, white-label

## Infraestrutura

### Stack de infraestrutura
- Kubernetes gerenciado: Google Kubernetes Engine (GKE) Autopilot
- Região: europe-west1 (Bélgica)
- Cluster: upvote-cluster
- Namespace: upvote
- Projeto GCP: project-38c32df4-c37c-41d9-b5d
- Banco de dados: PostgreSQL gerenciado no Neon.tech (externo ao cluster)
- Registry de imagens: Google Artifact Registry (europe-west1-docker.pkg.dev/project-38c32df4-c37c-41d9-b5d/upvote/api)
- Secrets: Google Secret Manager
- CI/CD: GitHub Actions (.github/workflows/deploy.yml)

### Serviços rodando no cluster
- **api** — Spring Boot 3.4.3, Java 21, 2 réplicas, HPA 2-10, porta 8080, Service tipo LoadBalancer
- **redis** — Redis 7-alpine, porta 6379, Service ClusterIP
- **rabbitmq** — RabbitMQ 3-management-alpine, portas 5672 e 15672, Service ClusterIP

### Comandos úteis do dia a dia

```bash
# Ver status dos pods
kubectl get pods -n upvote

# Ver logs da API
kubectl logs -f deployment/api -n upvote

# Desligar tudo (economizar)
kubectl scale deployment api rabbitmq redis --replicas=0 -n upvote

# Ligar tudo
kubectl scale deployment api rabbitmq redis --replicas=1 -n upvote

# Atualizar um secret
echo -n "novo-valor" | gcloud secrets versions add NOME_DO_SECRET --data-file=- --project=project-38c32df4-c37c-41d9-b5d

# Buildar e fazer push da imagem manualmente
./infra/k8s/build-and-push.sh

# Deploy manual
./infra/k8s/deploy.sh
```

### Fluxo de CI/CD
- Push na branch `main` → GitHub Actions dispara automaticamente
- Build da imagem Docker com `--platform linux/amd64` (necessário para Mac M1/M2/M3)
- Push no Artifact Registry com tag `latest` e SHA do commit
- Autenticação via Workload Identity Federation (sem chave JSON)
- Deploy no GKE na ordem: namespace → secrets → rabbitmq → redis → api → hpa
- Rollout aguardado com `kubectl rollout status`

### Secrets gerenciados pelo Google Secret Manager
`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `CORS_ORIGINS`, `RABBITMQ_USER`, `RABBITMQ_PASSWORD`

### GitHub Actions secrets necessários
- `GCP_PROJECT_ID` = `project-38c32df4-c37c-41d9-b5d`
- `GCP_WORKLOAD_IDENTITY_PROVIDER` = `projects/223057559224/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider`
- `GCP_SERVICE_ACCOUNT` = `github-actions@project-38c32df4-c37c-41d9-b5d.iam.gserviceaccount.com`

### Domínios
- app.upvote.com (frontend)
- api.upvote.com (backend)
