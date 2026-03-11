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
- Backend: Spring Boot 3.2 + Java 21 + PostgreSQL 15
- Widget: TypeScript puro embarcável via script tag
- Cache: Redis
- Filas: RabbitMQ
- Infra: Kubernetes + Jenkins CI/CD
- Testes backend: JUnit 5 + Mockito + Testcontainers
- Testes frontend: Vitest + React Testing Library + MSW

## Estrutura do monorepo
- apps/web → frontend React (porta 5173 em dev)
- apps/api → backend Spring Boot (porta 8080 em dev)
- packages/widget → widget JS embarcável
- infra/k8s → manifests Kubernetes
- infra/jenkins → Jenkinsfile

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

## Contexto de infraestrutura
- Kubernetes com namespace "upvote"
- HPA na API: min 2, max 10 réplicas (gatilho CPU 70%)
- Jenkins pipeline: test → build → docker push → kubectl apply
- Domínios: app.upvote.com (frontend), api.upvote.com (backend)
