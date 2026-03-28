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
4. Feedback é persistido imediatamente como `PENDING` e enfileirado no RabbitMQ — **resposta ao widget é instantânea**
5. Consumer assíncrono processa a mensagem da fila:
   - IA sintetiza o comentário → retorna `SynthesisResult` (texto limpo, categoria, tags)
   - Banco busca grupos similares via pg_trgm (similaridade de texto)
   - Se encontra similar → adiciona um voto automaticamente ao grupo existente
   - Se não encontra → IA sugere título/resumo → cria novo grupo de feedback
6. Feedback atualizado para `PROCESSED` com grupo vinculado
7. Dashboard do parceiro exibe padrões agrupados com contexto, não comentários individuais

**Resiliência:** falhas no processamento são retentadas automaticamente (3x, backoff exponencial).
Após esgotar as tentativas a mensagem vai para a Dead Letter Queue (`feedback.dlq`) e o
feedback permanece como `PROCESSING` para inspeção manual.

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
- Responsabilidade única: sintetizar o comentário → retorna `SynthesisResult { synthesizedText, category, tags }`
- As instruções de comportamento e o formato de resposta JSON ficam em `src/main/resources/ai/prompts/feedback_synthesis.txt`
- A busca por similaridade é feita pelo banco (pg_trgm), **não** pela IA
- **Arquitetura injetável**: `AiService` é uma interface — trocar de provedor não afeta os consumidores
- Métodos da interface: `synthesizeFeedback(String, PageContext)` e `suggestGroup(String, PageContext)`

#### Implementações disponíveis

| Classe | Quando ativa | Descrição |
|--------|-------------|-----------|
| `GeminiAiService` | `GEMINI_API_KEY` setado | Provedor real — Google Gemini via REST |
| `StubAiService` | fallback (sem API key) | Heurísticas simples, sem chamada de rede |

- Provedor atual: **Google Gemini** (`gemini-2.0-flash-lite` — tier mais barato)
- Sem SDK externo — chamadas via `RestClient` do Spring Boot
- `GeminiAiService` é `@Primary` e condicional; `StubAiService` assume automaticamente quando a key não está presente

#### Prompts
- `src/main/resources/ai/prompts/feedback_synthesis.txt` — síntese do feedback (texto, categoria, tags)
- `src/main/resources/ai/prompts/group_suggestion.txt` — título e resumo para novo grupo de feedback

#### Variável de ambiente necessária
```
GEMINI_API_KEY=AIzaSy...
```
Sem essa variável, o `StubAiService` é usado (comportamento seguro para dev/testes).

#### Configurar no IntelliJ
`Run → Edit Configurations → UpvoteApiApplication → Load variables from .env file` → apontar para `.env` na raiz do projeto.

### Dashboard
- Exibe padrões agrupados, não comentários brutos
- Cards com contexto: "5 relatos após 'botão Pagar' na tela de checkout esta semana"
- Visão para PO/PM que permite decisão sem investigação técnica
- Kanban board com colunas: Open, Planned, In Progress, Done
- Drag-and-drop para mover cards entre status e categorias

### Arquivo (Archive)

Funcionalidade inspirada no "Complete Sprint" do Jira. Feedbacks concluídos podem ser arquivados para limpar o board e manter histórico.

#### Status do feedback group

```
OPEN → PLANNED → IN_PROGRESS → DONE → ARCHIVED
                                    → CLOSED
```

- `DONE` = concluído mas ainda visível no board
- `ARCHIVED` = movido para histórico, fora do board e da busca por similaridade
- `CLOSED` = rejeitado/cancelado, também fora da busca por similaridade

#### Fluxo de arquivamento
1. Feedbacks na coluna **Done** podem ser arquivados individualmente (botão no hover do card) ou em lote (botão "Archive all" no header da coluna Done)
2. Feedbacks arquivados saem do board principal e vão para a página dedicada de arquivo (`/dashboard/:canalId/arquivo`)
3. Feedbacks arquivados podem ser restaurados (voltam para **Done**) via botão no hover do card na página de arquivo

#### Impacto na busca por similaridade
- A query `findSimilarGroups` exclui grupos com status `ARCHIVED` e `CLOSED` (`AND fg.status NOT IN ('ARCHIVED', 'CLOSED')`)
- Novos feedbacks **nunca** são agrupados com itens arquivados ou fechados
- A query de debug `findTopSimilarityScores` também exclui esses status

#### Endpoints da API

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/canais/{slug}/feedback-groups/archive-done` | JWT | Arquiva todos os grupos DONE do canal |
| POST | `/api/feedback-groups/{id}/archive` | JWT | Arquiva um grupo individual |
| POST | `/api/feedback-groups/{id}/restore` | JWT | Restaura grupo arquivado para DONE |

#### Frontend
- **`CanalDetailPage.tsx`** — botão "Archive all" na coluna Done, botão individual de archive no hover do card, link "Archive" no header da página
- **`ArchivePage.tsx`** — página dedicada em `/dashboard/:canalId/arquivo` com filtros por categoria, restore individual
- **`FeedbackGroupCard.tsx`** — props `onArchive` e `onRestore` que renderizam botões no hover
- **`KanbanColumn.tsx`** — prop `headerAction` para ações customizadas no header da coluna

#### Migration
- `V20260321230000__add_archived_status.sql` — cria index em `feedback_groups.status` para otimizar filtros

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
- IaC: OpenTofu (fork open-source do Terraform)
- Infra: GKE Autopilot + GitHub Actions CI/CD
- Testes backend: JUnit 5 + Mockito + Testcontainers
- Testes frontend: Vitest + React Testing Library + MSW

## Estrutura do monorepo
- apps/web → frontend React (porta 5173 em dev)
- apps/api → backend Spring Boot (porta 8080 em dev)
- packages/widget → widget JS embarcável
- infra/k8s → manifests Kubernetes + scripts de deploy
- infra/terraform → OpenTofu modules (IaC para GCP)
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
- All new code must be written in English: comments, variable names, method names, class names, commit messages, branch names, and PR descriptions
- Existing code written in Portuguese will be migrated to English gradually — do not mix languages within the same new file or function
- Commits in English following the format: type(scope): description
- Respostas da API sempre no padrão ApiResponse<T>
- Autenticação via JWT stateless (sem sessão no servidor)
- Multi-tenancy: cada Organization tem seus Canais isolados
- Nunca commitar secrets ou .env — usar .env.example como referência
- Branches: main (produção), develop (desenvolvimento), feature/* (features)
- **Documentação obrigatória**: toda alteração que mude a estrutura do projeto (novas seções de infra, novos módulos, mudança de stack, novo serviço, nova integração, mudança de formato de dados/logs) **deve** ser documentada no `CLAUDE.md` correspondente (raiz ou por app) no mesmo commit ou PR. Código sem documentação de mudança estrutural não deve ser mergeado

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
3. Configurar webhook apontando para `https://api.upvote.pro/api/stripe/webhook`
4. Eventos do webhook: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Copiar o webhook signing secret para `STRIPE_WEBHOOK_SECRET`

### Migration
- `V6__create_subscriptions.sql` — cria tabela `subscriptions` e popula todas Organizations existentes com plano FREE

## Autenticação Social (Google)

### Visão geral
Usuários podem se registrar e fazer login com o Google via Google Identity Services (GIS).
O frontend obtém um ID token do Google e o envia ao backend, que valida e retorna um JWT padrão — sem mudança no fluxo após o login.

### Fluxo
1. Usuário clica em "Sign in with Google" na tela de login ou registro
2. GIS abre o popup de seleção de conta Google
3. Frontend recebe o ID token (`credential`) no callback
4. Frontend POST `/api/auth/google` com `{ idToken }`
5. Backend valida o token via `https://oauth2.googleapis.com/tokeninfo`
6. Backend retorna `AuthResponse` com JWT igual ao login normal
7. Frontend armazena o JWT e redireciona para `/dashboard`

### Três casos tratados pelo backend
| Caso | Ação |
|---|---|
| Usuário novo | Cria conta sem senha + Subscription FREE |
| Usuário existente pelo `google_id` | Login direto (fast path) |
| Merge: mesmo email, cadastro via senha | Login + backfill do `google_id` |

### Arquitetura backend
- **`GoogleAuthService`** — valida o ID token via `RestClient` (sem SDK externo); verifica `aud` e `email_verified`
- **`AuthService.googleLogin()`** — orquestra os 3 casos, retorna `AuthResponse`
- **Endpoint**: `POST /api/auth/google` — público (já coberto por `/api/auth/**`)
- **`User.passwordHash`** — agora nullable (usuários Google não têm senha)
- **`User.googleId`** — novo campo para lookup direto em logins subsequentes

### Frontend
- **`GoogleSignInButton.tsx`** — carrega o script GIS (`accounts.google.com/gsi/client`) e renderiza o botão oficial via `renderButton()`
- **`src/types/google.d.ts`** — ambient types para `window.google` (sem dependência npm)
- **`LoginPage.tsx`** e **`RegisterPage.tsx`** — divider + botão abaixo do formulário

### Variável de ambiente necessária
```
# Backend (valida o aud claim do token)
GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com

# Frontend (inicializa o GIS)
VITE_GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com
```
Mesmo Client ID para os dois. Sem `GOOGLE_CLIENT_ID`, a validação do `aud` falha explicitamente.

### Configurar no Google Cloud Console
1. APIs & Services → Credentials → Create OAuth 2.0 Client ID (tipo: Web application)
2. Authorized JavaScript origins: `http://localhost:5173` e `https://app.upvote.pro`
3. Sem redirect URI (GIS usa popup, não server-side redirect)

### Migration
- `V20260329000000__add_google_auth_to_users.sql` — `password_hash` nullable, coluna `google_id`, index

## Integrações Externas (Jira / ClickUp)

### Visão geral
Permite que feedback groups do Upvote sejam enviados (push) como issues no Jira ou tasks no ClickUp.
Integração bidirecional: push do Upvote → ferramenta externa, e webhooks para sincronizar mudanças de status de volta.

### Fluxo
1. Usuário conecta Jira ou ClickUp via OAuth2 em **Integrações** (item dedicado no sidebar)
2. No modal de detalhe de um feedback group, clica em "Push" para criar uma issue/task
3. Seleciona o projeto (Jira) ou lista (ClickUp) de destino
4. Issue/task é criada na ferramenta externa com título, descrição, votos e contexto
5. Badge linkado aparece no card e no modal
6. Webhooks recebem mudanças de status e sincronizam de volta para o Upvote

### Arquitetura backend

- **Entidade `Integration`** — credenciais OAuth por usuário/provedor. Um registro por provedor por usuário.
- **Entidade `ExternalIssue`** — vínculo entre FeedbackGroup e issue/task externa. Um por provedor por grupo.
- **Enum `IntegrationProvider`** — JIRA, CLICKUP
- **`JiraIntegrationService`** — OAuth token exchange, refresh, create issue, list projects via REST API v3
- **`ClickUpIntegrationService`** — OAuth token exchange, create task, list spaces/folders/lists via API v2
- **`IntegrationService`** — orquestrador central: CRUD de integrações, push-to-external, processamento de webhooks, mapeamento de status
- **`IntegrationController`** — endpoints autenticados para gestão de integrações e push
- **`IntegrationWebhookController`** — endpoints públicos para receber webhooks do Jira e ClickUp

### Endpoints da API

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/integrations` | JWT | Lista integrações conectadas |
| GET | `/api/integrations/jira/authorize` | JWT | Retorna URL de autorização OAuth Jira |
| GET | `/api/integrations/clickup/authorize` | JWT | Retorna URL de autorização OAuth ClickUp |
| GET | `/api/integrations/jira/callback` | Público | Callback OAuth Jira (troca code por tokens) |
| GET | `/api/integrations/clickup/callback` | Público | Callback OAuth ClickUp |
| DELETE | `/api/integrations/{id}` | JWT | Desconecta uma integração |
| GET | `/api/integrations/{id}/projects` | JWT | Lista projetos (Jira) ou lists (ClickUp) |
| POST | `/api/integrations/push/{feedbackGroupId}` | JWT | Cria issue/task na ferramenta externa |
| GET | `/api/integrations/external-issues/{feedbackGroupId}` | JWT | Lista issues externas de um grupo |
| DELETE | `/api/integrations/external-issues/{externalIssueId}` | JWT | Remove vínculo com issue externa |
| POST | `/api/webhooks/jira` | Público | Webhook Jira (status updates) |
| POST | `/api/webhooks/clickup` | Público | Webhook ClickUp (status updates) |

### Mapeamento de status (webhook → Upvote)

#### Jira → Upvote
| Jira Status | Upvote Status |
|-------------|---------------|
| To Do, Backlog, Open | OPEN |
| Selected for Development, Planned | PLANNED |
| In Progress, In Review | IN_PROGRESS |
| Done, Closed, Resolved | DONE |

#### ClickUp → Upvote
| ClickUp Status | Upvote Status |
|----------------|---------------|
| Open, To Do | OPEN |
| Planned | PLANNED |
| In Progress | IN_PROGRESS |
| Complete, Done, Closed | DONE |

**Nota:** Feedbacks com status ARCHIVED ou CLOSED no Upvote **não** são atualizados por webhooks.

### Frontend
- **`IntegrationsPage.tsx`** — página dedicada no sidebar (`/dashboard/integrations`)
- **`IntegrationsSettings.tsx`** — componente com cards para conectar/desconectar Jira e ClickUp
- **`PushToExternalModal.tsx`** — modal para selecionar integração, projeto/lista e criar issue/task
- **`IntegrationCallbackPage.tsx`** — página de callback OAuth (troca code por tokens e redireciona)
- **`FeedbackGroupCard.tsx`** — badges clicáveis para issues externas vinculadas (azul=Jira, roxo=ClickUp)
- **`FeedbackGroupDetailModal.tsx`** — botão "Push" e badges de issues externas no modal de detalhe

### Variáveis de ambiente necessárias
```
JIRA_CLIENT_ID=...           # Jira OAuth App Client ID
JIRA_CLIENT_SECRET=...       # Jira OAuth App Client Secret
CLICKUP_CLIENT_ID=...        # ClickUp OAuth App Client ID
CLICKUP_CLIENT_SECRET=...    # ClickUp OAuth App Client Secret
OAUTH_CALLBACK_BASE_URL=http://localhost:5173  # dev | https://upvote.pro em produção
```

Sem essas variáveis, os botões de conectar continuam visíveis mas o OAuth falha graciosamente.

### Configurar OAuth Apps

#### Jira
1. Acessar https://developer.atlassian.com/console/myapps/
2. Criar um OAuth 2.0 (3LO) app chamado "upvote"
3. Em **Authorization**, adicionar as duas Callback URLs (uma por linha):
   - `https://upvote.pro/integrations/jira/callback` (produção)
   - `http://localhost:5173/integrations/jira/callback` (dev)
4. Em **Permissions → Jira API**, adicionar scopes: `read:jira-work`, `write:jira-work`
5. Em **Settings**, copiar Client ID e Secret para as variáveis de ambiente

#### ClickUp
1. Acessar https://app.clickup.com/settings/integrations → Create an App
2. Adicionar as duas Redirect URLs:
   - `https://upvote.pro/integrations/clickup/callback` (produção)
   - `http://localhost:5173/integrations/clickup/callback` (dev)
3. Copiar Client ID e Secret para as variáveis de ambiente

### Migration
- `V20260322000000__create_integrations_tables.sql` — cria tabelas `integrations` e `external_issues` com constraints e índices

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
- IaC: OpenTofu (infra/terraform/)
- CI/CD: GitHub Actions (.github/workflows/deploy.yml)

### OpenTofu (Infrastructure as Code)

Toda a infraestrutura GCP é declarada em OpenTofu (fork open-source do Terraform, 100% compatível) para reprodutibilidade e preparação para futura migração AWS.
CLI: `tofu` (instalado via `brew install opentofu`). Arquivos `.tf` são idênticos aos do Terraform.

#### Estrutura
```
infra/terraform/
  main.tf              # Root module — conecta todos os módulos
  backend.tf           # GCS backend para state
  providers.tf         # Google provider config
  variables.tf         # Variáveis de entrada
  terraform.tfvars     # Valores concretos (sem secrets)
  outputs.tf           # Outputs (cluster endpoint, AR URL, WIF provider)
  import.sh            # Script one-time para importar recursos existentes
  modules/
    gke/               # GKE Autopilot cluster
    artifact-registry/ # Artifact Registry (Docker images)
    secret-manager/    # Secret Manager (estrutura only, sem valores)
    iam/               # Service accounts + IAM bindings
    workload-identity/ # WIF pool + provider para GitHub Actions
```

#### O que o OpenTofu gerencia
- GKE Autopilot cluster
- Artifact Registry repository
- Secret Manager secrets (estrutura — valores são gerenciados manualmente via gcloud)
- Service accounts (github-actions, grafana-metrics-reader)
- IAM role bindings
- Workload Identity Federation (pool + provider)

#### O que NÃO é gerenciado pelo OpenTofu
- Kubernetes manifests (deployments, services, HPA) → `infra/k8s/`
- Helm releases (Grafana Alloy) → `helm upgrade`
- Banco Neon.tech (PostgreSQL externo)
- Stripe, Jira, ClickUp configs (SaaS)
- DNS / domínios

#### Comandos
```bash
cd infra/terraform

# Primeira vez: criar bucket de state e inicializar
gsutil mb -l europe-west1 gs://upvote-tofu-state-38c32df4
gsutil versioning set on gs://upvote-tofu-state-38c32df4
tofu init

# Importar recursos existentes (one-time)
./import.sh

# Ver o que vai mudar
tofu plan

# Aplicar mudanças
tofu apply

# Destruir (cuidado!)
tofu destroy
```

#### State
- Backend: GCS bucket `upvote-tofu-state-38c32df4`
- O state contém info sensível — nunca commitar `*.tfstate`
- Lock automático via GCS

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
Lista completa em `infra/terraform/variables.tf` (variável `secret_names`). Valores gerenciados manualmente via `gcloud secrets versions add` — o OpenTofu gerencia apenas a existência dos secrets, nunca os valores.

### GitHub Actions secrets necessários
- `GCP_PROJECT_ID` = `project-38c32df4-c37c-41d9-b5d`
- `GCP_WORKLOAD_IDENTITY_PROVIDER` = `projects/223057559224/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider`
- `GCP_SERVICE_ACCOUNT` = `github-actions@project-38c32df4-c37c-41d9-b5d.iam.gserviceaccount.com`

### Domínios
- app.upvote.pro (frontend)
- api.upvote.pro (backend)

## Observabilidade (Grafana Cloud)

### Visão geral
Métricas (Prometheus) e logs (Loki) são coletados pelo Grafana Alloy rodando no cluster GKE e enviados para o Grafana Cloud.
Dashboard: `https://upvote.grafana.net`

### Stack de observabilidade

| Componente | Função |
|---|---|
| Spring Boot Actuator + Micrometer | Expõe métricas em `/actuator/prometheus` |
| Grafana Alloy (Helm, DaemonSet) | Scrapa métricas dos pods e coleta logs de containers |
| GKE Managed Prometheus + PodMonitoring | Scrape nativo do GKE (backup) |
| Grafana Cloud Prometheus | Armazena métricas (remote write) |
| Grafana Cloud Loki | Armazena logs |
| Grafana Cloud Dashboards | Visualização |

### Dependências backend (pom.xml)
```xml
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

### Configuração do Actuator (application.yml)
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus
  metrics:
    tags:
      application: upvote-api
```

### Arquivos de infra
- `infra/k8s/alloy-values.yaml` — Helm values do Grafana Alloy (métricas + logs)
- `infra/k8s/pod-monitor.yaml` — PodMonitoring CRD para GKE Managed Prometheus

### Formato de logs em produção

O backend usa `PatternLayoutEncoder` (não JSON) em produção. Formato:
```
2026-03-26 11:30:22.681  INFO [tx:2326eb83d6a24b3c] [RESPONSE] GET /api/canais → 200 (700ms)
2026-03-26 11:30:15.040  INFO [tx:-] Started UpvoteApiApplication in 80.154 seconds
```

- **Padrão logback**: `%d{yyyy-MM-dd HH:mm:ss.SSS} %5p [tx:%X{transactionId:--}] %m%n%ex`
- **Arquivo**: `apps/api/src/main/resources/logback-spring.xml`
- **Profiles**: `!prod` → console com cores (dev), `prod` → one-liner com stack traces completos (produção)
- `transactionId` é injetado via MDC pelo `TransactionFilter` em cada request HTTP
- **Exception logging**: `GlobalExceptionHandler` loga todas as exceções com prefixo `[EXCEPTION]`, contexto da request (`METHOD /uri → STATUS`) e stack trace. Filtrável no Loki: `|= "[EXCEPTION]"`

### Alloy — como funciona
- Roda como **DaemonSet** (1 pod por node) para coletar logs de todos os containers
- **Métricas**: descobre pods com annotation `prometheus.io/scrape=true`, scrapa a cada 30s, remote-write para Grafana Cloud
- **Logs**: coleta logs de todos os containers no namespace `upvote` via Kubernetes API, envia para Loki
- **Extração de labels**: regex extrai `level` e `transactionId` da linha de log formatada
- Labels adicionados automaticamente: `namespace`, `pod`, `app`, `container`, `node`, `cluster`, `level`, `transactionId`

### Secrets no cluster
Secret `grafana-cloud-credentials` com keys:
- `username` — Prometheus remote write user ID (`3064086`)
- `password` — Grafana Cloud API token (escrita de métricas e logs)
- `loki-username` — Loki user ID (`1527718`)

### Endpoints Grafana Cloud
- Prometheus: `https://prometheus-prod-68-prod-eu-west-6.grafana.net/api/prom/push`
- Loki: `https://logs-prod-043.grafana.net/loki/api/v1/push`

### Dashboards importados

| ID | Nome | Descrição |
|---|---|---|
| 19004 | Spring Boot 3.x Statistics | JVM, CPU, memória, HikariCP, uptime |
| 17175 | Spring Boot Observability | HTTP requests, latência, error rate |

### Queries úteis no Grafana

```promql
# Métricas — verificar se pods estão sendo scrapados
up{namespace="upvote"}

# Métricas — request rate por endpoint
rate(http_server_requests_seconds_count{namespace="upvote"}[5m])

# Métricas — latência p95
histogram_quantile(0.95, rate(http_server_requests_seconds_bucket{namespace="upvote"}[5m]))
```

```logql
# Logs — todos os logs da API
{namespace="upvote", app="api"}

# Logs — apenas erros
{namespace="upvote", app="api", level="ERROR"}

# Logs — filtrar por transactionId (rastrear uma request completa)
{namespace="upvote", transactionId="2326eb83d6a24b3c"}

# Logs — filtrar por endpoint
{namespace="upvote", app="api"} |= "feedback"

# Logs — apenas warnings e erros
{namespace="upvote", app="api"} | level=~"WARN|ERROR"

# Logs — todos os serviços (api, redis, rabbitmq)
{namespace="upvote"}
```

### Comandos úteis

```bash
# Verificar pods do Alloy
kubectl get pods -n upvote -l app.kubernetes.io/name=alloy

# Ver logs do Alloy (debug)
kubectl logs daemonset/alloy -n upvote --tail=50

# Upgrade do Alloy após mudar alloy-values.yaml
helm upgrade alloy grafana/alloy -n upvote -f infra/k8s/alloy-values.yaml

# Atualizar secret do Grafana Cloud
kubectl get secret grafana-cloud-credentials -n upvote -o json | \
  python3 -c "import sys,json,base64; s=json.loads(sys.stdin.read()); s['data']['key']=base64.b64encode(b'value').decode(); print(json.dumps(s))" | \
  kubectl apply -f -
```

### Helm chart
```bash
# Repo
helm repo add grafana https://grafana.github.io/helm-charts

# Instalar
helm install alloy grafana/alloy -n upvote -f infra/k8s/alloy-values.yaml

# Upgrade
helm upgrade alloy grafana/alloy -n upvote -f infra/k8s/alloy-values.yaml
```

## Export de Relatórios (CSV e PDF)

### Visão geral
Parceiros podem exportar relatórios dos feedback groups de um canal diretamente pelo dashboard.
Dois formatos disponíveis: CSV (tabular, para análise em planilhas) e PDF (relatório executivo profissional).

### Endpoint CSV
`GET /api/canais/{slug}/report.csv`
- Query params: `status`, `category`, `from` (yyyy-MM-dd), `to` (yyyy-MM-dd), `includeDetails` (boolean)
- `includeDetails=true` adiciona uma segunda seção com feedbacks individuais

### Endpoint PDF
`GET /api/canais/{slug}/report.pdf`
- Query params: `status`, `category`, `from` (yyyy-MM-dd), `to` (yyyy-MM-dd)
- Retorna `application/pdf` com `Content-Disposition: attachment`
- Não tem `includeDetails` — estrutura do PDF é fixa por design

### Estrutura do PDF
1. **Header** — logo Upvote, nome do canal, período coberto, data/hora de geração
2. **Situação Atual** — cards de contagem por status (OPEN, PLANNED, IN_PROGRESS, DONE, CLOSED, ARCHIVED) + top 5 grupos mais votados em andamento
3. **Concluídos** — grupos com status DONE ou ARCHIVED, com badge de categoria, contagem de votos e resumo
4. **Mapa de Palavras** — tags extraídas pela IA com tamanho de fonte proporcional à frequência (1rem–3rem, limitado a 50 tags)
5. **Footer** — referência à plataforma

### Arquitetura backend
- **`ReportService`** — geração de CSV
- **`PdfReportService`** — geração de PDF; usa Thymeleaf para renderizar HTML e OpenHTMLToPDF para converter em bytes
- **`ReportController`** — dois endpoints, ambos requerem JWT
- **Template**: `apps/api/src/main/resources/templates/report.html` — HTML + CSS com paleta dark (#0f172a) idêntica ao app

### Biblioteca PDF
- **OpenHTMLToPDF** (`com.openhtmltopdf:openhtmltopdf-pdfbox:1.0.10`) — Apache 2.0 + LGPL 2.1 (seguro para SaaS comercial)
- Thymeleaf renderiza o template em HTML; OpenHTMLToPDF converte o HTML para PDF bytes
- CSS: usar `display:table` e `display:flex` — `display:grid` **não é suportado** pelo openhtmltopdf

### Frontend
- **`apps/web/src/services/feedbackGroups.ts`** — `exportFeedbackGroups()` (CSV) e `exportFeedbackGroupsPdf()` (PDF)
- **`apps/web/src/pages/CanalDetailPage.tsx`** — modal de export com seletor CSV/PDF; branch em `handleExport()` por formato

## Internacionalização (i18n) — Frontend

### Stack
- **i18next** + **react-i18next** — biblioteca principal
- **i18next-browser-languagedetector** — detecta idioma do browser automaticamente
- **Zustand** — `languageStore.ts` sincroniza estado React com i18next

### Idiomas suportados
| Código | Idioma |
|--------|--------|
| `pt-BR` | Português (Brasil) — fallback padrão |
| `en` | Inglês |

### Arquivos relevantes
- `apps/web/src/i18n/index.ts` — configuração do i18next (inicialização, detection, recursos)
- `apps/web/src/i18n/locales/pt-BR.json` — traduções em português
- `apps/web/src/i18n/locales/en.json` — traduções em inglês
- `apps/web/src/store/languageStore.ts` — Zustand store com `language` e `setLanguage()`

### Como funciona
1. Na inicialização, o i18next detecta o idioma na ordem: `localStorage` → `navigator.language`
2. Persistência via `localStorage` key `'language'`
3. O toggle PT/EN fica no header (`Layout.tsx`) ao lado do botão de tema
4. Ao trocar idioma: `setLanguage()` atualiza localStorage + chama `i18n.changeLanguage()` + atualiza Zustand store

### Como usar em novos componentes
```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <p>{t('namespace.key')}</p>;
}
```

### Regras para adicionar traduções
- **Toda string visual** deve usar `t()` — sem hardcode de texto em português ou inglês
- **Arrays estáticos com labels** (ex: opções de filtro, colunas de kanban): remover o campo `label`, derivar o label via `t('namespace.key')` no render
- **Arrays fora de componentes React** não podem chamar `t()` — usar só values e traduzir no JSX
- **Strings que vão para o backend** (valores de enum, slugs, chaves de API) ficam em inglês e **não** são traduzidas
- A palavra de confirmação de delete permanece `'delete'` (inglês) independente do idioma ativo — evita ambiguidade
- Para arrays de strings nas traduções, usar `t('key', { returnObjects: true }) as string[]`

### Estrutura dos namespaces (translation keys)
```
common.*       — ações genéricas (save, cancel, delete, loading…)
nav.*          — itens de navegação
auth.*         — login, registro, erros de autenticação
dashboard.*    — página de canais/dashboard principal
canal.*        — página de detalhe do canal (kanban, filtros, export…)
archive.*      — página de arquivo
billing.*      — planos, assinatura, uso
settings.*     — configurações de perfil
apiKeys.*      — gerenciamento de API keys
status.*       — labels dos status (OPEN, PLANNED, IN_PROGRESS, DONE, ARCHIVED, CLOSED)
category.*     — labels das categorias (BUG, FEATURE_REQUEST, UX…)
modal.*        — modal de detalhe do feedback group
card.*         — FeedbackGroupCard (relative time, botões de ação)
kanbanColumn.* — KanbanColumn (estado vazio)
landing.*      — LandingPage (nav, hero, stats, how it works, features, pricing, footer)
integrations.* — Integrations settings + push modal (connect, disconnect, push, errors)
```

### Adicionar um novo idioma
1. Criar `apps/web/src/i18n/locales/<codigo>.json` com todas as keys
2. Importar e registrar em `apps/web/src/i18n/index.ts` no objeto `resources`
3. Adicionar o código em `supportedLngs`
4. Atualizar `languageStore.ts` com o novo tipo `Language` e a lógica de detecção
5. Adicionar o botão de toggle correspondente em `Layout.tsx`
