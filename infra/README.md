# Infra

## Desenvolvimento local (novo dev)

### Pré-requisitos

- Java 21
- Maven
- Node.js 18+
- Docker e Docker Compose

### Subir o ambiente

```bash
# 1. Subir PostgreSQL, Redis e RabbitMQ
docker-compose up -d

# 2. Copiar variáveis de ambiente
cp .env.example .env

# 3. Rodar o backend
cd apps/api
mvn spring-boot:run

# 4. Rodar o frontend
cd apps/web
npm install && npm run dev
```

O Spring Boot usa os defaults do `application.yml` que apontam para `localhost`.
O `docker-compose.yml` sobe PostgreSQL (5432), Redis (6379) e RabbitMQ (5672/15672).

---

## Produção (GKE + Google Cloud)

### Arquitetura

- **API:** GKE Autopilot (europe-west1), imagem no Artifact Registry
- **PostgreSQL:** Neon.tech (externo ao cluster)
- **Redis e RabbitMQ:** Pods dentro do cluster
- **Secrets:** Google Secret Manager
- **CI/CD:** GitHub Actions com Workload Identity Federation

### Scripts disponíveis

| Script | Descrição |
|--------|-----------|
| `infra/k8s/apply-secrets.sh` | Busca secrets do Google Secret Manager e aplica no cluster K8s |
| `infra/k8s/build-and-push.sh` | Build da imagem Docker (linux/amd64) e push para Artifact Registry |
| `infra/k8s/deploy.sh` | Deploy manual completo no GKE (secrets + manifests + rollout) |
| `infra/scripts/setup-github-actions.sh` | Setup único: cria Service Account e Workload Identity para o GitHub Actions |
| `infra/scripts/update-secret.sh` | Atualiza um secret no Google Secret Manager |

### CI/CD (deploy automático)

A cada push na branch `main`, o GitHub Actions (`.github/workflows/deploy.yml`):

1. Builda a imagem com tag do SHA do commit
2. Faz push para o Artifact Registry
3. Aplica secrets do Google Secret Manager no cluster
4. Aplica os manifests K8s e aguarda o rollout

#### Setup do CI/CD (primeira vez)

```bash
# Cria Service Account + Workload Identity Federation
./infra/scripts/setup-github-actions.sh

# O script imprime 3 valores — adicione como secrets no GitHub:
# Settings → Secrets and variables → Actions
#   GCP_PROJECT_ID
#   GCP_WORKLOAD_IDENTITY_PROVIDER
#   GCP_SERVICE_ACCOUNT
```

### Atualizar um secret de produção

```bash
# Atualiza o valor no Google Secret Manager
./infra/scripts/update-secret.sh DB_PASSWORD nova-senha-segura

# Aplica no cluster (ou aguarde o próximo deploy via CI/CD)
./infra/k8s/apply-secrets.sh
```

### Deploy manual (sem CI/CD)

```bash
# Build e push da imagem
./infra/k8s/build-and-push.sh

# Deploy completo
./infra/k8s/deploy.sh
```

### Manifests K8s

```
infra/k8s/
├── namespace.yaml     # Namespace upvote
├── secrets.yaml       # Placeholders (valores reais vêm do Secret Manager)
├── redis.yaml         # Deployment + Service Redis 7-alpine
├── rabbitmq.yaml      # Deployment + Service RabbitMQ 3-management-alpine
├── deployment.yaml    # Deployment + Service (LoadBalancer) da API
├── hpa.yaml           # HPA: 2-10 réplicas (CPU 70%)
├── web-deployment.yaml
├── web-service.yaml
└── ingress.yaml
```
