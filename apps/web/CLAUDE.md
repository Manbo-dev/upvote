# Web — Upvote Frontend

## Padrões de código
- Componentes em PascalCase dentro de src/components/
- Páginas em PascalCase dentro de src/pages/
- Hooks customizados em camelCase com prefixo "use" em src/hooks/
- Chamadas à API APENAS via src/services/, nunca direto em componentes
- Tipos e interfaces TypeScript em src/types/
- Sem any — TypeScript estrito habilitado

## Gerenciamento de estado
- Estado global (auth, user logado, token) → Zustand em src/store/
- Server state (dados da API, listas) → React Query (TanStack Query)
- Estado local de UI (modal aberto, loading) → useState no componente

## Rotas
- /login → público
- /register → público
- /dashboard → privado, lista produtos do owner autenticado
- /dashboard/:productId → privado, gerencia sugestões do produto
- /b/:slug → público, board de sugestões (acesso sem login)
Rotas privadas redirecionam para /login se não autenticado.

## Chamadas à API
- Base URL via variável VITE_API_URL
- Axios com interceptor que injeta Bearer token automaticamente
- Erros 401 redirecionam para /login e limpam o store
- Erros tratados e exibidos ao usuário (nunca silenciados)

## Estilização
- Apenas TailwindCSS — sem CSS modules, sem styled-components
- Exceção: animações complexas podem usar classes CSS customizadas
- Paleta principal: indigo-600 como cor primária

## Variáveis de ambiente
VITE_API_URL=http://localhost:8080

## Testes
- Vitest + React Testing Library
- MSW para mockar chamadas à API (src/test/handlers.ts)
- Factories de dados em src/test/factories/
- Rodar: npm run test
- Rodar com UI: npm run test:ui
