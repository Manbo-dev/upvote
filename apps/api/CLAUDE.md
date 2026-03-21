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

## Banco de dados

- PostgreSQL 15
- Flyway para todas as alterações de schema
- Nunca usar hbm2ddl auto create/update (apenas validate em prod)
- Seed de dados em V2__seed_data.sql (1 user, 1 org, 1 canal)

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
