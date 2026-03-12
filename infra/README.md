# Infraestrutura — Upvote

## Visão Geral

```
GitHub (main) → GitHub Actions → Artifact Registry → GKE Autopilot
                                                          ├── api (Spring Boot) ←→ Neon.tech (PostgreSQL)
                                                          ├── redis
                                                          └── rabbitmq
                                       Google Secret Manager ↑
```

| Componente | Tecnologia | Localização |
|------------|-----------|-------------|
| Kubernetes | GKE Autopilot | europe-west1 (Bélgica) |
| Banco de dados | PostgreSQL (Neon.tech) | Externo ao cluster |
| Cache | Redis 7-alpine | Pod no cluster |
| Filas | RabbitMQ 3-management-alpine | Pod no cluster |
| Registry | Google Artifact Registry | europe-west1 |
| Secrets | Google Secret Manager | GCP |
| CI/CD | GitHub Actions | GitHub |
| Projeto GCP | project-38c32df4-c37c-41d9-b5d | — |
| Cluster | upvote-cluster | europe-west1 |
| Namespace | upvote | — |

---

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

## Pré-requisitos para produção

- `gcloud` CLI instalado e autenticado (`gcloud auth login`)
- `kubectl` instalado
- `docker` instalado
- `gke-gcloud-auth-plugin` instalado (`gcloud components install gke-gcloud-auth-plugin`)
- Acesso ao projeto GCP `project-38c32df4-c37c-41d9-b5d`

---

## Setup inicial (primeira vez)

### 1. Criar conta GCP e projeto

Crie um projeto no Google Cloud Console. O projeto atual é `project-38c32df4-c37c-41d9-b5d`.

### 2. Criar cluster GKE Autopilot

```bash
gcloud container clusters create-auto upvote-cluster \
  --region=europe-west1 \
  --project=project-38c32df4-c37c-41d9-b5d
```

### 3. Configurar Artifact Registry

```bash
gcloud artifacts repositories create upvote \
  --repository-format=docker \
  --location=europe-west1 \
  --project=project-38c32df4-c37c-41d9-b5d
```

### 4. Configurar Secret Manager

```bash
./infra/scripts/setup-secret-manager.sh
```

Esse script cria todos os secrets necessários no Google Secret Manager.

### 5. Configurar GitHub Actions (Workload Identity Federation)

```bash
./infra/scripts/setup-github-actions.sh
```

O script imprime 3 valores que devem ser adicionados como secrets no GitHub.

### 6. Adicionar secrets no GitHub

Vá em **Settings → Secrets and variables → Actions** e adicione:

| Secret | Valor |
|--------|-------|
| `GCP_PROJECT_ID` | `project-38c32df4-c37c-41d9-b5d` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/223057559224/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider` |
| `GCP_SERVICE_ACCOUNT` | `github-actions@project-38c32df4-c37c-41d9-b5d.iam.gserviceaccount.com` |

### 7. Primeiro deploy

```bash
./infra/k8s/deploy.sh
```

---

## Estrutura de arquivos

```
infra/
├── k8s/
│   ├── namespace.yaml          # Namespace upvote
│   ├── secrets.yaml            # Placeholders (valores reais no Secret Manager)
│   ├── redis.yaml              # Deployment + Service Redis
│   ├── rabbitmq.yaml           # Deployment + Service RabbitMQ
│   ├── deployment.yaml         # Deployment + Service (LoadBalancer) da API
│   ├── hpa.yaml                # HPA 2-10 réplicas
│   ├── apply-secrets.sh        # Busca secrets do Secret Manager e aplica no K8s
│   ├── build-and-push.sh       # Build e push da imagem para Artifact Registry
│   └── deploy.sh               # Deploy completo no GKE
└── scripts/
    ├── setup-secret-manager.sh # Setup inicial do Secret Manager
    ├── setup-github-actions.sh # Setup do Workload Identity Federation
    ├── start.sh                # Liga todos os deployments (replicas=1)
    └── stop.sh                 # Desliga todos os deployments (replicas=0)
```

---

## Gerenciamento de secrets

Os secrets ficam no **Google Secret Manager** e são injetados no cluster K8s pelo script `apply-secrets.sh`.

### Secrets existentes

`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `CORS_ORIGINS`, `RABBITMQ_USER`, `RABBITMQ_PASSWORD`

### Adicionar novo secret

```bash
# 1. Criar no Secret Manager
echo -n "valor-do-secret" | gcloud secrets create NOME_DO_SECRET \
  --data-file=- \
  --project=project-38c32df4-c37c-41d9-b5d

# 2. Adicionar no apply-secrets.sh para que seja incluído no K8s

# 3. Aplicar no cluster
./infra/k8s/apply-secrets.sh
```

### Atualizar secret existente

```bash
# Atualizar no Secret Manager
echo -n "novo-valor" | gcloud secrets versions add NOME_DO_SECRET \
  --data-file=- \
  --project=project-38c32df4-c37c-41d9-b5d

# Aplicar no cluster (ou aguarde o próximo deploy via CI/CD)
./infra/k8s/apply-secrets.sh
```

### Listar secrets existentes

```bash
gcloud secrets list --project=project-38c32df4-c37c-41d9-b5d
```

---

## CI/CD

### Fluxo completo

1. Push na branch `main` dispara o GitHub Actions (`.github/workflows/deploy.yml`)
2. Build da imagem Docker com `--platform linux/amd64` (necessário para Mac M1/M2/M3)
3. Push no Artifact Registry com tags `latest` e SHA do commit
4. Autenticação no GCP via Workload Identity Federation
5. Deploy no GKE na ordem: namespace → secrets → rabbitmq → redis → api → hpa
6. Rollout aguardado com `kubectl rollout status`

### Workload Identity Federation

A autenticação do GitHub Actions no GCP usa **Workload Identity Federation** em vez de chaves JSON. Isso funciona assim:

1. O GitHub Actions solicita um token OIDC ao GitHub
2. O token é trocado por credenciais temporárias do GCP via Workload Identity Pool
3. As credenciais assumem a Service Account `github-actions@project-38c32df4-c37c-41d9-b5d.iam.gserviceaccount.com`
4. Nenhuma chave JSON é armazenada — as credenciais são efêmeras

### Re-run manual no GitHub Actions

1. Vá em **Actions** no repositório GitHub
2. Selecione o workflow **Deploy**
3. Clique em **Re-run all jobs** ou **Re-run failed jobs**

---

## Operações do dia a dia

### Ver status dos pods

```bash
kubectl get pods -n upvote
```

### Ver logs

```bash
# Logs da API (follow)
kubectl logs -f deployment/api -n upvote

# Logs do RabbitMQ
kubectl logs -f deployment/rabbitmq -n upvote

# Logs do Redis
kubectl logs -f deployment/redis -n upvote
```

### Ligar/desligar para economizar

```bash
# Desligar tudo
kubectl scale deployment api rabbitmq redis --replicas=0 -n upvote
# ou
./infra/scripts/stop.sh

# Ligar tudo
kubectl scale deployment api rabbitmq redis --replicas=1 -n upvote
# ou
./infra/scripts/start.sh
```

### Deploy manual

```bash
# Build e push da imagem
./infra/k8s/build-and-push.sh

# Deploy completo (secrets + manifests + rollout)
./infra/k8s/deploy.sh
```

### Build manual da imagem

```bash
./infra/k8s/build-and-push.sh
```

Esse script builda com `--platform linux/amd64` e faz push para o Artifact Registry.

---

## Troubleshooting

Problemas encontrados durante o setup e suas soluções:

### `InvalidImageName` — placeholder PROJECT_ID não substituído

**Causa:** O `deployment.yaml` continha `PROJECT_ID` como placeholder literal em vez do ID real do projeto.

**Solução:** Substituir `PROJECT_ID` pelo valor real (`project-38c32df4-c37c-41d9-b5d`) no `deployment.yaml`, ou usar o script `deploy.sh` que faz a substituição automaticamente.

### `ImagePullBackOff` — sem permissão no Artifact Registry

**Causa:** A Service Account do GKE não tinha permissão para fazer pull das imagens no Artifact Registry.

**Solução:** Conceder a role `roles/artifactregistry.reader` à Service Account:

```bash
gcloud artifacts repositories add-iam-policy-binding upvote \
  --location=europe-west1 \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/artifactregistry.reader" \
  --project=project-38c32df4-c37c-41d9-b5d
```

### `ErrImagePull` — imagem buildada para arm64 (Mac M1/M2/M3)

**Causa:** O `docker build` no Mac com Apple Silicon gera imagens `arm64` por padrão, mas o GKE roda em `amd64`.

**Solução:** Sempre buildar com `--platform linux/amd64`:

```bash
docker build --platform linux/amd64 -t IMAGE_TAG .
```

O script `build-and-push.sh` já faz isso automaticamente.

### RabbitMQ probe timeout — exec probe muito lento

**Causa:** O `livenessProbe` do RabbitMQ usava `exec` com `rabbitmq-diagnostics`, que é lento para iniciar e causava timeouts.

**Solução:** Trocar o probe de `exec` para `tcpSocket` na porta 5672:

```yaml
livenessProbe:
  tcpSocket:
    port: 5672
  initialDelaySeconds: 30
  periodSeconds: 10
```

### `GCP_PROJECT_ID` não encontrado — quebra de linha no .env

**Causa:** Ao colar o valor da variável no `.env`, uma quebra de linha invisível foi incluída no valor.

**Solução:** Recriar a variável garantindo que não há espaços ou quebras de linha extras. Usar `echo -n` para validar:

```bash
echo -n "$GCP_PROJECT_ID" | xxd | head
```

### Secrets não encontrados no Secret Manager

**Causa:** O script `setup-secret-manager.sh` não havia sido executado antes do primeiro deploy.

**Solução:** Executar o setup antes do deploy:

```bash
./infra/scripts/setup-secret-manager.sh
# Depois:
./infra/k8s/deploy.sh
```
