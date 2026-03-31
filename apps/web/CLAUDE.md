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
- /dashboard/integrations → privado, conectar/desconectar Jira e ClickUp
- /integrations/:provider/callback → público, callback OAuth (Jira/ClickUp)
- /b/:slug → público, board de sugestões (acesso sem login)
Rotas privadas redirecionam para /login se não autenticado.

## Chamadas à API
- Base URL via variável VITE_API_URL
- Axios com interceptor que injeta Bearer token automaticamente
- Erros 401 e 403 (token expirado/inválido) redirecionam para /login e limpam o store
- Erros tratados e exibidos ao usuário (nunca silenciados)

## Design System — Warm Neutral + shadcn/ui

### Palette
The UI uses a **warm neutral palette** (cream/beige light, dark chocolate dark) with a forest green primary (`#1F5C45`). All colors are defined as CSS variables (HSL) in `src/index.css` and mapped through Tailwind in `tailwind.config.js`.

### Typography
- **Body**: `DM Sans` — registered as `font-sans` (default for all text)
- **Display/Headings**: `Fraunces` (optical variable serif) — registered as `font-display`, applied globally to `h1`, `h2`, `h3` via `@layer base`. Use `font-display` class for any additional display-style text (hero titles, card headings, logo).

### Color tokens (single source of truth)
- **Design tokens**: `src/design-system/tokens.ts` — exports `warmNeutral`, `categoryAccents`, `statusTokens`, `categoryTokens`
- **CSS variables**: `src/index.css` — `:root` (light) and `.dark` (dark) HSL variables following shadcn convention
- **Tailwind config**: `tailwind.config.js` — maps CSS variables to semantic colors (background, foreground, card, primary, muted, accent, destructive, border, input, ring) + `warm` utility scale

### Semantic classes (ALWAYS use these)

| Purpose | Class |
|---------|-------|
| Page background | `bg-background` |
| Card/panel background | `bg-card` |
| Primary text | `text-foreground` |
| Secondary text | `text-muted-foreground` |
| Card/section borders | `border-border` |
| Input borders | `border-input` |
| Hover backgrounds | `hover:bg-accent` |
| Subtle surfaces | `bg-warm-50`, `bg-warm-100`, `dark:bg-warm-800` |

**Do NOT use `gray-*` classes** — they were fully replaced by `warm-*` and semantic tokens.

### Category card accents (soft left borders)

| Category | Border color |
|----------|-------------|
| BUG | `#F5C6CB` (soft rose) |
| SUGGESTION | `#BFD7ED` (soft sky) |
| COMPLAINT | `#FDD9B5` (soft peach) |
| PRAISE | `#B7E4C7` (soft mint) |

Applied via `border-l-4` with dynamic `borderLeftColor` from `categoryAccents` in `tokens.ts`.

### shadcn/ui Component Library

Reusable UI components live in `src/components/ui/`. Built on Radix UI primitives + CVA (class-variance-authority) + `cn()` utility from `src/lib/utils.ts`.

| Component | File | Usage |
|-----------|------|-------|
| Button | `ui/button.tsx` | All buttons (variants: default, destructive, outline, secondary, ghost, link) |
| Input | `ui/input.tsx` | All text inputs |
| Label | `ui/label.tsx` | Form labels |
| Dialog | `ui/dialog.tsx` | All modals (replaced old `Modal.tsx`) |
| DropdownMenu | `ui/dropdown-menu.tsx` | Dropdown menus |
| Select | `ui/select.tsx` | Select dropdowns |
| Tooltip | `ui/tooltip.tsx` | Tooltip on hover |
| Badge | `ui/badge.tsx` | Status/category badges |
| Card | `ui/card.tsx` | Card containers |
| Avatar | `ui/avatar.tsx` | User avatars (sidebar profile) |
| Separator | `ui/separator.tsx` | Visual dividers |
| Tabs | `ui/tabs.tsx` | Tabbed interfaces |
| Switch | `ui/switch.tsx` | Toggle switches |

**Rules:**
- Always use shadcn/ui components instead of inline button/input/modal styling
- Use `<Dialog>` for all modals — the old `Modal.tsx` is deprecated
- Use lucide-react icons — no inline SVGs for standard icons
- Use `cn()` from `src/lib/utils.ts` for conditional class merging

### Layout Architecture

**File:** `src/components/Layout.tsx`

- **Sidebar**: Always visible on `lg:` breakpoint, collapsible (icon-only ↔ expanded) via toggle button
- **Navigation groups**: MAIN (Channels, Integrations) and ACCOUNT (API Keys, Billing, Settings), separated by `<Separator>`
- **Profile section** (sidebar bottom): Avatar with initials fallback, user name/email, logout button
- **Theme toggle** (Sun/Moon) and **language toggle** (PT/EN): both in sidebar bottom area
- **Header**: Simplified — page title on left, mobile hamburger on right
- **Icons**: All navigation icons use lucide-react (LayoutGrid, Puzzle, Key, CreditCard, Settings, etc.)
- **Tooltips**: Nav items show tooltips when sidebar is collapsed

## Dark Mode — OBRIGATÓRIO
- Todas as telas e features DEVEM ter suporte a dark mode
- Tailwind configurado com `darkMode: 'class'` — a classe `dark` é aplicada no `<html>` pelo themeStore
- Preferência salva em localStorage + detecta preferência do sistema como padrão
- Toggle de tema disponível no sidebar (ícone lua/sol)
- Warm dark mode uses dark chocolate/brown tones, NOT cool blue-gray
- Light mode: cream background (`#FAF8F5`), white cards (`#FFFFFF`)
- Dark mode: dark chocolate background (`#1A1614`), warm dark panels (`#231F1C`)
- Mapping rules:
  - Inputs: `border-input bg-card text-foreground`
  - Hover de cards: `hover:border-primary-300 dark:hover:border-primary-600`
  - Gradientes de fundo das telas public: `from-warm-50 to-primary-50 dark:from-warm-950 dark:to-warm-900`
  - StatusBadge: cada cor tem variante `dark:bg-{cor}-900/30 dark:text-{cor}-400`

## Variáveis de ambiente
VITE_API_URL=http://localhost:8080

## Testes
- Vitest + React Testing Library
- MSW para mockar chamadas à API (src/test/handlers.ts)
- Factories de dados em src/test/factories/
- Rodar: npm run test
- Rodar com UI: npm run test:ui
