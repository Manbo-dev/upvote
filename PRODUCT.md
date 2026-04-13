# Upvote — Product Overview

> **"Feedback sem ruído."**

---

## O que é o Upvote

O **Upvote** é um SaaS de captura e síntese inteligente de feedback de usuários. Empresas embarcam um widget leve no seu produto digital; o usuário escreve livremente — bug, sugestão, reclamação, elogio — e a plataforma usa IA para sintetizar, deduplicar e agrupar feedbacks automaticamente.

O resultado: donos de produto recebem um dashboard com **padrões acionáveis**, não uma pilha de comentários brutos.

---

## Posicionamento

| | Upvote | Canny.io |
|---|---|---|
| Mercado-alvo | Brasil | Global |
| Preço entrada | R$49/mês | ~US$79/mês |
| Agrupamento por IA | Sim (automático) | Não |
| Setup | 1 script tag | SDK + configuração |
| Idioma da UI | PT-BR + EN | EN |
| Roadmap público | Sim (STARTER+) | Sim |

---

## Modelo de Negócio

### Planos e Preços

| Plano | Preço | Canais | Feedbacks/mês | Widget customizável | Integrações | Membros |
|-------|-------|--------|---------------|---------------------|-------------|---------|
| **Free** | Grátis | 1 | 20 | Não | Não | Solo |
| **Starter** | R$49/mês | 3 | 500 | Não | Jira + ClickUp | 3 |
| **Pro** | R$129/mês | 20 | Ilimitado | Sim | Jira + ClickUp | 10 |
| **Business** | R$299/mês | Ilimitado | Ilimitado | Sim + White-label | Todos | Ilimitado |

- **Plano Business** é tratado comercialmente (sem self-service checkout)
- Pagamentos via **Stripe** (checkout e portal de gerenciamento hospedados)
- Cobrança recorrente mensal em BRL

---

## Funcionalidades — Por Importância

### Tier 1 — Core do Produto (diferenciais competitivos)

#### Widget embarcável
- Instalação via uma única `<script>` tag — sem SDK, sem configuração obrigatória
- 3 modos de exibição: **Floating** (botão flutuante), **Sidebar** (aba lateral) e **Inline** (embarcado no elemento)
- 8 estilos de botão: Circle, Square, Pill, Pill Label, Handle, Bubble, Gradient, Pill Counter
- Dark mode nativo com suporte a `auto` (segue preferência do sistema)
- Internacionalizado: PT-BR e EN
- White-label no plano Business (sem rodapé "Powered by Upvote")
- Captura automática de contexto: URL, título da página, elemento interagido, horário, dispositivo

#### Síntese por IA
- Feedback processado de forma assíncrona (resposta ao widget é instantânea)
- IA sintetiza texto → retorna categoria (`BUG`, `SUGGESTION`, `COMPLAINT`, `PRAISE`) + tags
- Agrupamento automático por similaridade textual (PostgreSQL `pg_trgm`)
- Se feedback similar existe → voto adicionado ao grupo; se não → novo grupo criado
- Provedor atual: Google Gemini (`gemini-2.0-flash-lite`)
- Arquitetura injetável: trocar de provedor de IA sem afetar o restante do sistema

#### Dashboard Kanban
- Colunas: **Open → Planned → In Progress → Done**
- Drag-and-drop entre colunas e categorias
- Tab separada para **Elogios** (PRAISE) — grid visual sem progressão de status
- Filtros por categoria, status, período

#### Arquivo (Archive)
- Feedbacks concluídos podem ser arquivados individualmente ou em lote
- Página dedicada de arquivo com filtros e restauração
- Grupos arquivados excluídos da busca por similaridade (sem poluição de novos agrupamentos)

---

### Tier 2 — Funcionalidades de Produto Completo

#### Roadmap Público (`/b/:slug`) — STARTER+
- Board público compartilhável com usuários finais
- Mostra status dos grupos sem expor dados privados (PII removido)
- Toggle de ativação/desativação na aba de Configurações do canal

#### Export de Relatórios
- **CSV**: tabular para análise em planilhas; filtros por status, categoria, período
- **PDF**: relatório executivo com situação atual, grupos concluídos, mapa de palavras das tags — STARTER+
- Frontend desabilita exportação PDF para Free com lock icon e tooltip de upgrade

#### Widget Customizável — PRO+
- Configuração visual: cor primária, posição, modo, tema (light/dark/auto), idioma
- Título e placeholder personalizáveis
- Estilo do botão trigger (8 opções visuais)
- Live preview em tempo real no dashboard antes de salvar

#### Integrações Externas — STARTER+
- **Jira**: criar issues a partir de feedback groups, sincronização de status via webhook
- **ClickUp**: criar tasks, sincronização de status via webhook
- OAuth 2.0 (3LO) para ambas as plataformas
- Badge clicável nos cards do Kanban quando issue externa vinculada

#### Membros de Equipe
- Proprietários podem convidar colegas por email
- Membros têm acesso total de leitura/escrita, exceto billing e gestão de equipe
- Fluxo de convite: email com link → aceite automático (novo usuário) ou manual (existente)
- Limites por plano: Free=0, Starter=3, Pro=10, Business=ilimitado

---

### Tier 3 — Funcionalidades de Suporte e Operação

#### Autenticação
- Email + senha com JWT stateless
- Google OAuth (GIS popup) — sem redirect server-side
- Recuperação de senha via código 6 dígitos por email (válido 10 min)
- Troca de senha autenticada com confirmação por código

#### Perfil de Usuário
- Upload de foto (redimensionado para 256×256px no frontend via canvas)
- Avatar do Google sincronizado no registro social
- Nome editável

#### Emails Transacionais
- Boas-vindas, ativação de assinatura, atualização de plano, cancelamento, falha de pagamento
- Digest mensal automático (primeira segunda-feira do mês, 8h)
- Convite e aceite de membro de equipe
- Fila RabbitMQ dedicada com retry 3× e DLQ (mesma resiliência do pipeline de feedback)

#### Internacionalização (Frontend)
- PT-BR (padrão) e EN
- Detecção automática pelo browser
- Toggle PT/EN no header do dashboard
- Toda string visual traduzida via `i18next`

---

## Requisitos Funcionais

### RF-01 — Coleta de Feedback
- O sistema DEVE aceitar texto livre de usuários finais via widget
- O widget DEVE responder instantaneamente (feedback enfileirado, processamento assíncrono)
- O sistema DEVE capturar automaticamente contexto da página sem intervenção do usuário
- O sistema DEVE exibir texto de consentimento LGPD antes do envio

### RF-02 — Processamento por IA
- O sistema DEVE sintetizar o feedback e classificá-lo em categoria + tags
- O sistema DEVE buscar grupos similares e adicionar voto quando encontrar correspondência
- O sistema DEVE criar novo grupo com título/resumo sugerido pela IA quando não houver similar
- O sistema DEVE retentar processamento até 3 vezes com backoff exponencial em caso de falha
- Feedbacks com falha permanente DEVEM ir para Dead Letter Queue e status `PROCESSING`

### RF-03 — Gestão de Grupos de Feedback
- O dashboard DEVE exibir grupos de feedback agrupados, não feedbacks individuais
- O usuário DEVE poder mover grupos entre status via drag-and-drop
- O usuário DEVE poder arquivar grupos individualmente ou em lote (coluna Done)
- Grupos arquivados DEVEM ser excluídos da busca por similaridade
- O usuário DEVE poder restaurar grupos arquivados para Done

### RF-04 — Widget
- O widget DEVE funcionar apenas com a inserção de uma `<script>` tag
- O widget DEVE suportar 3 modos de exibição (floating, sidebar, inline)
- O widget DEVE respeitar configurações do backend (cor, posição, modo, tema, idioma)
- O widget DEVE reconstruir o DOM automaticamente ao receber mudanças de configuração

### RF-05 — Assinaturas e Limites
- O sistema DEVE bloquear criação de canais além do limite do plano (422)
- O sistema DEVE bloquear recebimento de feedbacks além do limite mensal (422)
- O sistema DEVE bloquear customização de widget para planos sem esse recurso (422)
- O sistema DEVE bloquear acesso a integrações para planos sem esse recurso (403/422)
- O sistema DEVE processar webhooks do Stripe para sincronizar plano e status

### RF-06 — Integrações
- O usuário DEVE poder conectar Jira e ClickUp via OAuth 2.0
- O usuário DEVE poder criar issues/tasks externas a partir de feedback groups
- O sistema DEVE sincronizar mudanças de status da ferramenta externa via webhook
- Grupos ARCHIVED/CLOSED NUNCA DEVEM ter status atualizado por webhooks externos

### RF-07 — Roadmap Público
- Canais STARTER+ DEVEM poder ativar um board público sem autenticação
- O board público NUNCA DEVE expor dados pessoais (PII)
- O sistema DEVE retornar 404 para boards desativados ou com plano FREE

### RF-08 — Autenticação e Perfil
- O sistema DEVE suportar login/registro com email+senha e com Google
- O sistema DEVE emitir JWT stateless (sem sessão no servidor)
- O usuário DEVE poder trocar senha com confirmação por código de email
- O sistema DEVE suportar recuperação de senha sem expor se o email existe (evitar enumeração)

### RF-09 — Multi-tenancy e Membros
- Cada Organization DEVE ter seus canais e dados isolados
- Membros DEVEM operar transparentemente no workspace do dono (proxy via `UserContextResolver`)
- Membros NUNCA DEVEM acessar billing ou gestão de equipe (403)

### RF-10 — Relatórios
- O sistema DEVE exportar relatório CSV com filtros e detalhes opcionais
- O sistema DEVE exportar relatório PDF executivo com mapa de palavras — STARTER+

---

## Requisitos Não Funcionais

### RNF-01 — Performance
- Resposta do widget ao usuário final: < 200ms (enfileiramento síncrono, processamento async)
- APIs REST do dashboard: < 500ms p95
- Processamento de feedback (IA + agrupamento): eventual (segundos a minutos, sem SLA hard)

### RNF-02 — Disponibilidade e Resiliência
- Backend: 2 réplicas com HPA (2–10 pods), GKE Autopilot
- Filas RabbitMQ com retry automático (3×, backoff exponencial 1s→2s→4s) e DLQ
- Redis para cache
- Banco PostgreSQL gerenciado (Neon.tech) com alta disponibilidade

### RNF-03 — Escalabilidade
- Horizontal: HPA escala API automaticamente por CPU/memória
- Processamento de feedbacks desacoplado via fila (escala consumer independentemente)
- Banco de dados externo ao cluster (escalável independentemente)

### RNF-04 — Segurança
- JWT stateless (sem estado no servidor)
- Secrets gerenciados via Google Secret Manager (nunca em código ou variáveis de CI)
- Webhooks Stripe validados via `Stripe-Signature` header
- Multi-tenancy: isolamento completo por Organization
- Tokens OAuth de integrações armazenados criptografados
- Nenhum dado sensível em logs (MDC apenas com transactionId)

### RNF-05 — Observabilidade
- Métricas Prometheus via Spring Boot Actuator + Micrometer → Grafana Cloud
- Logs estruturados com `transactionId` por request → Loki
- Dashboards de JVM, HTTP, latência e error rate no Grafana Cloud
- Dead Letter Queues para inspeção de falhas de processamento

### RNF-06 — Manutenibilidade
- Monorepo estruturado: `apps/web`, `apps/api`, `packages/widget`, `infra/`
- IaC completo com OpenTofu (GKE, Artifact Registry, Secret Manager, IAM, WIF)
- CI/CD automatizado via GitHub Actions (build, push, deploy a cada push em `main`)
- Testes: JUnit 5 + Mockito + Testcontainers (backend), Vitest + RTL + MSW (frontend)

### RNF-07 — Conformidade (LGPD)
- Texto de consentimento fixo exibido no widget antes do envio
- Parceiro é controlador dos dados; Upvote é operador
- Arquitetura preparada para controle granular de captura (sem implementar no MVP)
- Política de Privacidade e Termos de Uso publicados em `/privacy` e `/terms`

### RNF-08 — Usabilidade
- Widget: instalação em < 5 minutos (1 script tag)
- Dashboard: design system consistente (shadcn/ui + Tailwind + DM Sans + Fraunces)
- Dark mode nativo em toda a aplicação (warm dark tones)
- Responsivo: mobile e desktop

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui |
| Backend | Spring Boot 3.4.3 + Java 21 |
| Banco de dados | PostgreSQL (Neon.tech) com `pg_trgm` |
| Cache | Redis 7 |
| Filas | RabbitMQ 3 |
| IA | Google Gemini (`gemini-2.0-flash-lite`) |
| Widget | TypeScript puro (sem dependências externas) |
| Pagamentos | Stripe (Checkout + Customer Portal) |
| Infra | GKE Autopilot (europe-west1) |
| IaC | OpenTofu (fork open-source do Terraform) |
| CI/CD | GitHub Actions + Workload Identity Federation |
| Observabilidade | Grafana Cloud (Prometheus + Loki) |
| Email | Resend SMTP via RabbitMQ |
| Autenticação social | Google Identity Services |
| Integrações | Jira (Atlassian OAuth 3LO) + ClickUp OAuth |

---

## Métricas de Produto (MVP)

| Métrica | Onde medir |
|---------|-----------|
| Feedbacks recebidos/mês por canal | Dashboard + `/api/subscriptions` (`sugestoesUsadasMes`) |
| Grupos criados vs feedbacks agrupados | `FeedbackGroup.voteCount` agregado |
| Taxa de processamento com sucesso | Ratio `PROCESSED` / (`PROCESSED` + `PROCESSING`) |
| Feedbacks na DLQ | RabbitMQ Management UI (`feedback.dlq`) |
| Conversão Free → Pago | Stripe Dashboard |
| Churn | `customer.subscription.deleted` webhooks |

---

## Roadmap de Produto (pós-MVP)

- [ ] Notificações em tempo real no dashboard (WebSocket)
- [ ] Respostas públicas a feedback groups (engajamento com usuário final)
- [ ] Análise de sentimento e trending topics por período
- [ ] SDK nativo para React, Vue, Angular (além do script tag genérico)
- [ ] Webhooks de saída configuráveis (Slack, Discord, custom URL)
- [ ] API pública documentada (Swagger/OpenAPI) para integrações self-service
- [ ] Single Sign-On (SSO) para plano Business
- [ ] Controle granular de consentimento LGPD por canal

---

## Contato

- **Produto**: upvote.pro
- **Blog**: medium.com/@guilhermedicasil/upvote-blog-19e6f32e64cd
- **Contato**: guilhermedicasil@gmail.com
