# Upvote — Contexto Geral do Projeto

## O que é
SaaS de captura inteligente de feedback. Empresas embarcam um
widget no seu produto; o usuário final escreve livremente
(bug, sugestão, reclamação) e a plataforma usa IA para
sintetizar, deduplicar e agrupar feedbacks automaticamente.
O dono do produto recebe um dashboard com padrões acionáveis,
não comentários brutos.

## Motivação do projeto
Projeto pessoal com objetivo duplo: aprender todo o ciclo de
desenvolvimento moderno (do código ao deploy) e potencialmente
monetizar. Concorre com Canny.io focando no mercado brasileiro
com preço mais acessível.

## Visão de produto — MVP

### Fluxo core
1. Parceiro instala o widget via script tag no seu produto
2. Usuário final escreve um feedback livremente no widget (texto livre, sem categorias)
3. Backend recebe o comentário + contexto automático da página
4. IA sintetiza o comentário e busca feedbacks similares já existentes para aquele canal
5. Se encontra similar com alta confiança → adiciona um voto automaticamente
6. Se confiança baixa → widget faz no máximo UMA pergunta de follow-up (opcional, o usuário pode ignorar)
7. Se o usuário não responder, fechar o widget ou abandonar → a mensagem original é salva e processada normalmente
8. Dashboard do parceiro exibe padrões agrupados com contexto, não comentários individuais

### Widget
- Experiência minimalista: caixa de texto + botão de enviar
- Interação baixa do usuário — o trabalho pesado é no backend
- Parceiro configura quando/como o widget aparece:
  - Sempre visível na tela
  - Acionado manualmente (botão no produto)
  - Acionado por evento (ex: após erro, após ação específica)
- Texto fixo de consentimento: "Ao enviar, você concorda com nossa política de feedback"
- Sem fricção de configuração para o parceiro — cola o script e funciona

### Contexto automático capturado
Dados capturados junto com o comentário, em linguagem legível para PO/PM:
- URL e título da página atual
- Como o widget foi acionado (evento, botão, automático)
- Último elemento interagido antes de abrir o widget (ex: "botão Pagar", não `#btn-checkout-submit`)
- Horário e tipo de dispositivo (mobile/desktop)

### IA no backend
- Sintetiza o comentário do usuário
- Busca feedbacks similares já existentes para o mesmo canal
- Alta confiança → vota no feedback existente
- Baixa confiança → solicita follow-up OU cria novo feedback
- Recebe o contexto automático da página para melhorar a categorização
- **Arquitetura injetável**: a integração com IA deve usar uma interface/abstração que permita trocar o fornecedor (OpenAI, Anthropic, etc.) sem alterar os métodos que a consomem

### Dashboard
- Exibe padrões agrupados, não comentários brutos
- Cards com contexto: "5 relatos após 'botão Pagar' na tela de checkout esta semana"
- Visão para PO/PM que permite decisão sem investigação técnica

### LGPD / Consentimento
- MVP: texto fixo no widget com link para política de feedback
- Parceiro é o controlador dos dados, Upvote é o operador
- Arquitetura desenhada para permitir controle granular de captura no futuro (sem implementar agora)

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
- Multi-tenancy: cada Organization tem seus Canais isolados
- Nunca commitar secrets ou .env — usar .env.example como referência
- Branches: main (produção), develop (desenvolvimento), feature/* (features)

## Modelo de negócio
- Plano Free: 1 canal, 50 sugestões, sem widget
- Plano Starter R$49/mês: 3 canais, widget básico
- Plano Pro R$129/mês: 10 canais, changelog, roadmap público
- Plano Business R$299/mês: ilimitado, SSO, API, white-label

## Assinaturas e Pagamentos (Stripe)

### Visão geral
Sistema de assinaturas recorrentes mensais integrado com Stripe.
Checkout e gerenciamento de assinatura via Stripe Hosted (Checkout Session + Customer Portal).
Plano Business é tratado pelo time comercial — não passa pelo checkout.

### Planos implementados

| Plano      | Canais | Sugestões/mês     | Widget | Preço        |
|------------|--------|--------------------|--------|--------------|
| FREE       | 1      | 50                 | Não    | Grátis       |
| STARTER    | 3      | Ilimitado          | Sim    | R$49/mês     |
| PRO        | 10     | Ilimitado          | Sim    | R$129/mês    |
| BUSINESS   | Ilimitado | Ilimitado       | Sim    | Sob consulta |

### Arquitetura backend

- **Entidade `Subscription`** — relação 1:1 com `Organization`, armazena `stripeCustomerId`, `stripeSubscriptionId`, `stripeStatus`, `plano` e `currentPeriodEnd`
- **Enum `Plano`** — define limites de cada plano (canais, sugestões/mês, widget habilitado)
- **Enum `StripeStatus`** — ACTIVE, PAST_DUE, CANCELED, INCOMPLETE
- **`StripeConfig`** — inicializa a API key do Stripe via `@PostConstruct`
- **`StripeService`** — lógica core: criação de checkout session, portal session e processamento de webhooks
- **`SubscriptionController`** — endpoints autenticados para consulta de assinatura, checkout e portal
- **`StripeWebhookController`** — endpoint público (valida assinatura Stripe) para receber webhooks

### Endpoints da API

| Método | Rota                          | Auth     | Descrição                              |
|--------|-------------------------------|----------|----------------------------------------|
| GET    | `/api/subscriptions`          | JWT      | Retorna assinatura atual + uso         |
| POST   | `/api/subscriptions/checkout` | JWT      | Cria sessão de checkout Stripe         |
| POST   | `/api/subscriptions/portal`   | JWT      | Cria sessão do portal de gerenciamento |
| POST   | `/api/stripe/webhook`         | Público* | Recebe eventos do Stripe               |

*Validado via `Stripe-Signature` header

### Webhooks processados
- `checkout.session.completed` — ativa assinatura após pagamento
- `invoice.paid` — renova assinatura, atualiza período
- `invoice.payment_failed` — marca como PAST_DUE
- `customer.subscription.updated` — sincroniza plano e status
- `customer.subscription.deleted` — reverte para FREE

### Enforcement de limites
- **Canais**: `CanalService.createCanal()` verifica `countByOrganizationId()` vs limite do plano
- **Sugestões**: `SuggestionService.createSuggestion()` conta sugestões do mês atual vs limite (FREE = 50/mês)
- Toda Organization recebe automaticamente uma `Subscription` FREE no registro

### Frontend
- **`BillingPage.tsx`** — página de gerenciamento de assinatura com cards de planos, métricas de uso e botões de upgrade/gerenciar
- **`subscriptions.ts`** — service layer com `getSubscription()`, `createCheckoutSession()`, `createPortalSession()`

### Variáveis de ambiente necessárias (Stripe)
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
```

### Configuração no Stripe Dashboard (produção)
1. Criar produtos Starter e Pro com preços recorrentes mensais em BRL
2. Copiar os Price IDs para as variáveis de ambiente
3. Configurar webhook apontando para `https://api.upvote.com/api/stripe/webhook`
4. Eventos do webhook: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Copiar o webhook signing secret para `STRIPE_WEBHOOK_SECRET`

### Migration
- `V6__create_subscriptions.sql` — cria tabela `subscriptions` e popula todas Organizations existentes com plano FREE

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
`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `CORS_ORIGINS`, `RABBITMQ_USER`, `RABBITMQ_PASSWORD`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_STARTER_PRICE_ID`, `STRIPE_PRO_PRICE_ID`

### GitHub Actions secrets necessários
- `GCP_PROJECT_ID` = `project-38c32df4-c37c-41d9-b5d`
- `GCP_WORKLOAD_IDENTITY_PROVIDER` = `projects/223057559224/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider`
- `GCP_SERVICE_ACCOUNT` = `github-actions@project-38c32df4-c37c-41d9-b5d.iam.gserviceaccount.com`

### Domínios
- app.upvote.com (frontend)
- api.upvote.com (backend)
