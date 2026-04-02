# API — Upvote Backend

## Pacote base

com.upvote.api

## Entidades e relacionamentos

- User → dono da conta (1 user tem 1 organization)
- Organization → agrupa canais de um cliente (1:N com Canal)
- Canal → canal de feedback (ex: checkout, landing page), tem slug único
- Suggestion → sugestão enviada por usuário final (N:1 com Canal)
- Vote → unique(suggestionId + userId), toggle ao votar novamente
- Comment → comentários em sugestões, ordenados por createdAt asc

## Status de uma Suggestion

OPEN → PLANNED → IN_PROGRESS → DONE → CLOSED
                                    → ARCHIVED
Apenas o owner do canal pode alterar o status.
- `ARCHIVED` e `CLOSED` são excluídos da busca por similaridade (não agrupam novos feedbacks)
- Restore de `ARCHIVED` volta para `DONE`

## Padrões obrigatórios

- Controllers recebem/devolvem apenas DTOs, nunca entidades JPA
- Toda lógica de negócio fica nos Services, controllers são finos
- MapStruct para conversão Entity ↔ DTO (nunca conversão manual)
- Migrations Flyway em resources/db/migration/
  Formato obrigatório (V11+): V{YYYYMMDDHHMMSS}__{description_with_underscores}.sql
  Exemplo: V20260320143000__add_webhook_event_log.sql
  Migrations V1-V10 usam formato legado sequencial — NÃO renomear.
  outOfOrder habilitado para suportar branches paralelas.
  ⚠️  NUNCA deletar nem renomear uma migration que já foi commitada no repositório.
  O Flyway registra o checksum e a descrição de cada migration aplicada no banco.
  Deletar ou renomear o arquivo local causa "applied migration not resolved locally"
  e derruba o boot em produção. Se uma feature for revertida, mantenha o arquivo
  SQL e crie uma nova migration de rollback (ex: V{timestamp}__rollback_xyz.sql).
- Exceptions customizadas em com.upvote.api.exception:
    - ResourceNotFoundException → 404
    - BusinessException → 422
    - UnauthorizedException → 403
- Toda resposta usa o wrapper: ApiResponse<T> com campos:
  success (boolean), data (T), message (String)

## Segurança

- JWT com expiração de 7 dias, assinado com chave no application.yml
- Senha com BCrypt strength 12
- Endpoints públicos (sem token):
    - POST /api/auth/**
    - GET /api/canais/{slug}/suggestions
    - GET /api/suggestions/{id}/comments
- Todo o resto exige Bearer token no header Authorization

## Logging

- Use `@Slf4j` (Lombok) in all new classes — never `LoggerFactory.getLogger()` manually
- Every controller endpoint must log at `INFO` on entry with key request params
- Every service method that calls an external API must log on success **and** on error
- Use structured parameters, not string concatenation: `log.info("...: id={}, status={}", id, status)`
- Use context prefix in integration/external-call logs: `[JIRA]`, `[INTEGRATION]`, `[STRIPE]`
- HTTP errors from `RestClient` must be caught explicitly (`HttpStatusCodeException`) and logged with status + response body before re-throwing as `BusinessException`
- All requests are automatically logged by `RequestLoggingFilter` (`@Order(3)`) — method, URI, query string, response status and elapsed time. `transactionId` (set by `TransactionFilter`) is included automatically via MDC

### Exception logging (GlobalExceptionHandler)

Every exception handled by `GlobalExceptionHandler` is logged with the `[EXCEPTION]` prefix, request context (`METHOD /uri`), HTTP status and full stack trace. Format:
```
[EXCEPTION] POST /api/subscriptions/checkout → 422: Você já possui uma assinatura ativa.
```

Log levels by exception type:

| Exception | HTTP | Log Level |
|-----------|------|-----------|
| `BusinessException` | 422 | `error` + stack trace |
| `ResourceNotFoundException` | 404 | `warn` + stack trace |
| `MethodArgumentNotValidException` | 400 | `warn` (field errors only, no stack trace) |
| `IllegalArgumentException` | 400 | `warn` + stack trace |
| `IllegalStateException` | 500 | `error` + stack trace |
| `SecurityException` | 403 | `warn` + stack trace |
| `AuthenticationException` | 401 | `warn` (no stack trace — avoid leaking) |
| `AccessDeniedException` | 403 | `warn` (no stack trace — avoid leaking) |
| `Exception` (catch-all) | 500 | `error` + stack trace |

### Exception cause chaining

`BusinessException` and `ResourceNotFoundException` support a `(String message, Throwable cause)` constructor. When catching an external exception (Stripe, Jira, ClickUp) and re-throwing as `BusinessException`, **always chain the original cause**:
```java
catch (StripeException e) {
    throw new BusinessException("Checkout failed", e); // ← chain cause
}
```

### Grafana/Loki queries for exceptions
```logql
# All exceptions
{namespace="upvote", app="api"} |= "[EXCEPTION]"

# Business rule violations only (422)
{namespace="upvote", app="api"} |= "[EXCEPTION]" |= "→ 422"

# Server errors only (500)
{namespace="upvote", app="api"} |= "[EXCEPTION]" |= "→ 500"

# Trace a specific request's exception
{namespace="upvote", transactionId="abc123"} |= "[EXCEPTION]"
```

## Banco de dados

- PostgreSQL 15
- Flyway para todas as alterações de schema
- Nunca usar hbm2ddl auto create/update (apenas validate em prod)
- Seed de dados em V2__seed_data.sql (1 user, 1 org, 1 canal)

## Pipeline assíncrono de feedback

O recebimento e o processamento do feedback são intencionalmente desacoplados via RabbitMQ.

### Fluxo

```
Widget → POST /api/widget/feedback
            ↓
        FeedbackService.receiveFeedback()
          • salva Feedback como PENDING
          • publica FeedbackProcessingMessage na fila (após commit)
          • retorna 200 OK imediatamente
            ↓
        feedback.exchange → feedback.processing (queue)
            ↓
        FeedbackProcessingConsumer
            ↓
        FeedbackService.processFeedback(feedbackId)
          • PENDING → PROCESSING → PROCESSED
          • chama IA → busca similaridade → agrupa ou cria grupo
```

### Retry e DLQ

- **3 tentativas** com backoff exponencial: 1 s → 2 s → 4 s (container-level, `SimpleRabbitListenerContainerFactory`)
- Após esgotar as tentativas: mensagem vai para `feedback.dlq`
- Feedback fica com status `PROCESSING` para inspeção/reprocessamento manual
- O publish ocorre **após o commit** via `TransactionSynchronizationManager.registerSynchronization` — garante que o consumer encontre o registro no banco

### Topologia RabbitMQ

#### Feedback pipeline
| Nome | Tipo | Descrição |
|------|------|-----------|
| `feedback.exchange` | Direct exchange | Entrada para processamento |
| `feedback.processing` | Queue (durable) | Fila principal; DLX aponta para `feedback.dlq.exchange` |
| `feedback.dlq.exchange` | Direct exchange | Exchange do dead letter |
| `feedback.dlq` | Queue (durable) | Dead Letter Queue — mensagens que esgotaram as tentativas |

#### Email pipeline
| Nome | Tipo | Descrição |
|------|------|-----------|
| `email.exchange` | Direct exchange | Entrada para envio de emails |
| `email.send` | Queue (durable) | Fila principal; DLX aponta para `email.dlq.exchange` |
| `email.dlq.exchange` | Direct exchange | Exchange do dead letter de emails |
| `email.dlq` | Queue (durable) | Dead Letter Queue — emails que esgotaram as tentativas |

### Pacote

`com.upvote.api.messaging`
- `RabbitMQConfig` — declaração de ambas as topologias (feedback + email) e configuração do container com retry
- `FeedbackProcessingMessage` — DTO da mensagem de feedback (apenas `feedbackId`)
- `FeedbackProducer` — publica na fila de feedback via `RabbitTemplate`
- `FeedbackProcessingConsumer` — consome da fila de feedback, delega ao `FeedbackService`
- `EmailType` — enum discriminador: `WELCOME` (extensível)
- `EmailMessage` — DTO da mensagem de email (`EmailType type`, `UUID userId`)
- `EmailProducer` — publica em `email.exchange` via `RabbitTemplate`
- `EmailConsumer` — consome de `email.send`, carrega `User` do DB, delega ao `EmailService`

### Status do Feedback

```
PENDING → PROCESSING → PROCESSED
                     ↘ (falha após retries) → permanece PROCESSING, mensagem vai para DLQ
```

## Variáveis de ambiente relevantes

- DB_URL, DB_USERNAME, DB_PASSWORD
- JWT_SECRET, JWT_EXPIRATION
- MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD
- RABBITMQ_HOST, RABBITMQ_PORT
- REDIS_HOST, REDIS_PORT

## Testes

- Unitários: JUnit 5 + Mockito em src/test/
- Integração: Testcontainers (PostgreSQL real) + MockMvc
- Rodar: mvn test
- Cobertura mínima esperada: 80% nas classes Service
