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
- /dashboard → privado, lista canais do owner autenticado
- /dashboard/:canalId → privado, gerencia feedbacks do canal (kanban board)
- /dashboard/:canalId/arquivo → privado, feedbacks arquivados do canal
- /b/:slug → público, board de sugestões (acesso sem login)
Rotas privadas redirecionam para /login se não autenticado.

## Chamadas à API
- Base URL via variável VITE_API_URL
- Axios com interceptor que injeta Bearer token automaticamente
- Erros 401 e 403 (token expirado/inválido) redirecionam para /login e limpam o store
- Erros tratados e exibidos ao usuário (nunca silenciados)

## Estilização
- Apenas TailwindCSS — sem CSS modules, sem styled-components
- Exceção: animações complexas podem usar classes CSS customizadas
- Paleta principal: indigo-600 como cor primária

## Dark Mode — OBRIGATÓRIO
- Todas as telas e features DEVEM ter suporte a dark mode
- Tailwind configurado com `darkMode: 'class'` — a classe `dark` é aplicada no `<html>` pelo themeStore
- Preferência salva em localStorage + detecta preferência do sistema como padrão
- Toggle de tema disponível no header do Layout (ícone lua/sol)
- Regras de mapeamento de cores para dark mode:
  - `bg-white` → adicionar `dark:bg-gray-900`
  - `bg-gray-50` → adicionar `dark:bg-gray-950`
  - `bg-gray-100` → adicionar `dark:bg-gray-800`
  - `border-gray-200` → adicionar `dark:border-gray-800`
  - `border-gray-300` → adicionar `dark:border-gray-700`
  - `text-gray-900` → adicionar `dark:text-white`
  - `text-gray-700` → adicionar `dark:text-gray-300`
  - `text-gray-600` → adicionar `dark:text-gray-400`
  - `text-gray-500` → adicionar `dark:text-gray-400`
  - `text-gray-400` → adicionar `dark:text-gray-500`
  - Inputs: adicionar `dark:border-gray-700 dark:bg-gray-800 dark:text-white`
  - Hover de cards: adicionar `dark:hover:border-primary-700`
  - Gradientes de fundo das telas public: `dark:from-gray-950 dark:to-gray-900`
  - StatusBadge: cada cor tem variante `dark:bg-{cor}-900/30 dark:text-{cor}-400`

## Variáveis de ambiente
VITE_API_URL=http://localhost:8080

## Testes
- Vitest + React Testing Library
- MSW para mockar chamadas à API (src/test/handlers.ts)
- Factories de dados em src/test/factories/
- Rodar: npm run test
- Rodar com UI: npm run test:ui
