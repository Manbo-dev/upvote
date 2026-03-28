# Upvote — Design System

## O que é isso?

Um sistema de design leve com **fonte única de verdade** para todas as decisões visuais.
Você não precisa conhecer React ou Tailwind para fazer alterações.

Tudo fica em um arquivo: **`src/design-system/tokens.ts`**

---

## Como fazer alterações

### Mudar a cor primária (botões, links, estados ativos)

Abra `src/design-system/tokens.ts` e edite os valores hex em `colors.primary`.
A cor principal usada em botões e CTAs é o shade `600`:

```ts
600: '#4f46e5',  // ← altere este valor
```

Depois, abra `src/index.css` e atualize a variável CSS correspondente:

```css
--color-primary-600: #4f46e5;  /* ← manter em sincronia */
```

### Mudar a fonte

Em `tokens.ts`, edite o array `typography.fontFamily.sans`:

```ts
sans: ['SuaFonte', 'ui-sans-serif', 'system-ui', 'sans-serif'],
```

Em `src/index.css`, substitua o `@import` do Google Fonts no topo do arquivo pelo da nova fonte.

### Mudar a cor de um status (badge colorido)

Em `tokens.ts`, localize `statusTokens` e edite a linha do status desejado.
Os valores seguem o padrão de cores do Tailwind CSS.

Exemplo — mudar OPEN de azul para verde-água:
```ts
OPEN: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
```

Paleta disponível: https://tailwindcss.com/docs/colors

> **Importante:** Mantenha as strings completas — não construa os nomes das classes
> dinamicamente, pois o compilador precisa ver o nome exato para incluir a cor no CSS.

### Mudar a cor de uma categoria

Mesmo processo, na seção `categoryTokens` em `tokens.ts`. Cada categoria tem `bg` e `text`.

---

## Mapa de arquivos

| Arquivo | O que controla |
|---------|---------------|
| `src/design-system/tokens.ts` | Tudo: cores, tipografia, raios, sombras, badges de status e categoria |
| `src/index.css` | `@import` da fonte + CSS custom properties + estilos base do body |
| `tailwind.config.js` | Registra os tokens como classes Tailwind — não editar diretamente |
| `src/components/StatusBadge.tsx` | Renderiza badges de status — lê de `statusTokens` |
| `src/components/CategoryBadge.tsx` | Renderiza badges de categoria — lê de `categoryTokens` |

---

## Paleta de cores

### Cor primária (`primary`)

| Shade | Hex | Uso típico |
|-------|-----|------------|
| 50 | `#eef2ff` | Backgrounds sutis, hover states leves |
| 100 | `#e0e7ff` | Highlights, selected states |
| 200–300 | — | Bordas, ícones secundários |
| 400–500 | — | Ícones, texto secundário com ênfase |
| **600** | `#4f46e5` | **CTAs, botões primários, links** |
| 700 | `#4338ca` | Hover de botões primários |
| 800–950 | — | Texto sobre fundos claros, brand forte |

### Superfícies e cinzas

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `background` | `#f9fafb` (gray-50) | `#030712` (gray-950) | Background da página |
| `panel` | `#ffffff` | `#111827` (gray-900) | Cards, sidebar, header, modais |
| `panelAlt` | `#f3f4f6` (gray-100) | `#1f2937` (gray-800) | Hover rows, insets sutis |
| `border` | `#e5e7eb` (gray-200) | `#1f2937` (gray-800) | Divisórias padrão |
| `borderStrong` | `#d1d5db` (gray-300) | `#374151` (gray-700) | Inputs focados, bordas fortes |

### Status

| Status | Cor | Classe Tailwind |
|--------|-----|----------------|
| OPEN | Azul | `blue-100/800` |
| PLANNED | Amarelo | `yellow-100/800` |
| IN_PROGRESS | Laranja | `orange-100/800` |
| DONE | Verde | `green-100/800` |
| CLOSED | Cinza | `gray-100/800` |
| ARCHIVED | Roxo | `purple-100/800` |

### Categorias

| Categoria | Cor | Classe Tailwind |
|-----------|-----|----------------|
| BUG | Vermelho | `red-100`, `red-700` |
| SUGGESTION | Azul | `blue-100`, `blue-700` |
| COMPLAINT | Laranja | `orange-100`, `orange-700` |
| PRAISE | Verde | `green-100`, `green-700` |

---

## Tipografia

**Fonte:** Inter (Google Fonts) — pesos 400, 500, 600, 700.

A mesma fonte é usada nos relatórios PDF exportados pelo sistema,
garantindo consistência visual entre o app e os documentos gerados.

**Escala de tamanhos** (referência Tailwind):

| Classe | Tamanho | Uso típico |
|--------|---------|------------|
| `text-xs` | 12px | Badges, labels pequenos |
| `text-sm` | 14px | Texto secundário, inputs |
| `text-base` | 16px | Texto de corpo padrão |
| `text-lg` | 18px | Subtítulos |
| `text-xl` | 20px | Títulos de seção |
| `text-2xl` | 24px | Títulos de página |
| `text-3xl` | 30px | Títulos grandes |

---

## Dark Mode

O dark mode é controlado automaticamente pelo app — o usuário alterna pelo header.
Você não precisa fazer nada especial para suportá-lo.

Todos os tokens de cor em `statusTokens` e `categoryTokens` já incluem variantes `dark:`.
As CSS custom properties em `src/index.css` têm valores alternativos em `:root.dark`.

---

## Raios de borda

| Classe | Valor | Uso |
|--------|-------|-----|
| `rounded-sm` | 4px | Elementos compactos |
| `rounded` | 6px | Inputs, tags pequenas |
| `rounded-md` | 8px | Botões, elementos secundários |
| `rounded-lg` | 12px | **Cards, painéis** (raio primário do app) |
| `rounded-xl` | 16px | Modais, cards de auth |
| `rounded-full` | 9999px | Badges, avatares, pills |

---

## O que este sistema não cobre (ainda)

- Tokens de espaçamento interno de componentes específicos
- Tokens de animação e transição
- Escala de z-index
- Tokens de tamanho de ícone

Esses podem ser adicionados em `tokens.ts` conforme o design evolui.
