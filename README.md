# Upvote — Plataforma SaaS de Feedback de Produto

Upvote é uma plataforma que permite coletar, organizar e priorizar feedback dos usuários sobre seus produtos. Inclui um board público de sugestões, sistema de votação e um widget embarcável.

## Estrutura do Monorepo

```
upvote/
├── apps/
│   ├── web/          # Frontend React + TypeScript + Vite
│   └── api/          # Backend Spring Boot 3 + Java 21
├── packages/
│   └── widget/       # Widget JS embarcável (Vanilla TS)
├── infra/
│   ├── k8s/          # Manifests Kubernetes
│   └── jenkins/      # Jenkinsfile para CI/CD
├── docker-compose.yml
└── README.md
```

## Pré-requisitos

- Java 21 (JDK)
- Maven 3.9+
- Node.js 20+
- npm 10+
- Docker e Docker Compose
- kubectl (para deploy em Kubernetes)

## Como rodar localmente

### 1. Subir infraestrutura com Docker Compose

```bash
docker-compose up -d
```

Isso inicia:
- **PostgreSQL** na porta 5432 (database: upvote, user: upvote, senha: upvote123)
- **Redis** na porta 6379
- **RabbitMQ** na porta 5672 (management UI: http://localhost:15672)

### 2. Rodar a API

```bash
cd apps/api
mvn spring-boot:run
```

A API estará disponível em http://localhost:8080

### 3. Rodar o Frontend

```bash
cd apps/web
npm install
npm run dev
```

O frontend estará disponível em http://localhost:5173

### 4. Rodar o Widget (desenvolvimento)

```bash
cd packages/widget
npm install
npm run dev
```

## Credenciais padrão

- **Email:** admin@upvote.com
- **Senha:** admin123

## Endpoints da API

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | Registrar usuário | Não |
| POST | `/api/auth/login` | Login (retorna JWT) | Não |
| GET | `/api/products` | Listar produtos do owner | Sim |
| POST | `/api/products` | Criar produto | Sim |
| GET | `/api/products/{slug}` | Detalhes do produto | Não |
| GET | `/api/products/{slug}/suggestions` | Listar sugestões | Não |
| POST | `/api/products/{slug}/suggestions` | Criar sugestão | Sim |
| POST | `/api/suggestions/{id}/vote` | Votar/desvotar | Sim |
| PATCH | `/api/suggestions/{id}/status` | Alterar status | Sim (owner) |
| GET | `/api/suggestions/{id}/comments` | Listar comentários | Não |
| POST | `/api/suggestions/{id}/comments` | Adicionar comentário | Sim |

## Deploy no Kubernetes

### 1. Criar namespace e recursos

```bash
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/secrets.yaml
kubectl apply -f infra/k8s/configmap.yaml
kubectl apply -f infra/k8s/
```

### 2. Build e push das imagens Docker

```bash
# API
docker build -t seu-registry/upvote-api:latest apps/api/
docker push seu-registry/upvote-api:latest

# Web
docker build -t seu-registry/upvote-web:latest apps/web/
docker push seu-registry/upvote-web:latest
```

### 3. Verificar deploy

```bash
kubectl get pods -n upvote
kubectl get services -n upvote
kubectl get ingress -n upvote
```

## Widget embarcável

Adicione o seguinte script na página do seu produto:

```html
<script
  src="https://upvote.com/widget.js"
  data-product-slug="meu-produto"
  data-color="#6366f1">
</script>
```

## Licença

Proprietário — Todos os direitos reservados.
