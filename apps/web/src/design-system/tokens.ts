/**
 * Design Tokens — Upvote
 *
 * Single source of truth for all visual decisions.
 * Changes here propagate automatically to Tailwind utilities and CSS custom properties.
 *
 * HOW IT WORKS
 * ─────────────
 * 1. tailwind.config.js imports `colors` and `typography` to register them as
 *    Tailwind utility classes (e.g. `text-primary-600`, `font-sans`).
 * 2. src/index.css declares matching CSS custom properties derived from these values.
 * 3. Components read `statusTokens` / `categoryTokens` directly — no hardcoded strings.
 *
 * PALETTE: Warm Neutral
 * ─────────────────────
 * Light: cream/beige backgrounds, warm borders
 * Dark: dark chocolate/warm charcoal (not cool gray)
 * Primary: teal accent
 */

import type { FeedbackGroupStatus } from '../services/feedbackGroups';

// ─── Primitive color palettes ─────────────────────────────────────────────────

/**
 * Brand primary — Forest green scale.
 * primary-600 (#1F5C45) is the main CTA color: buttons, links, active states.
 */
export const colors = {
  primary: {
    50:  '#EDFAF5',
    100: '#CCEEE0',
    200: '#99DDBF',
    300: '#5CC99A',
    400: '#31AB7A',
    500: '#228B61',
    600: '#1F5C45',
    700: '#1A4D3A',
    800: '#133B2C',
    900: '#0C2720',
    950: '#061410',
  },
} as const;

// ─── Semantic surface tokens ──────────────────────────────────────────────────
/**
 * Warm neutral surface palette.
 * Light mode: cream/beige tones
 * Dark mode: warm chocolate/charcoal tones (not cool blue-gray)
 */
export const surface = {
  /** Page background: warm cream light / dark chocolate dark */
  background:      '#FAF8F5',
  backgroundDark:  '#1A1614',

  /** Cards, sidebar, header, modals: white light / warm dark panel */
  panel:           '#FFFFFF',
  panelDark:       '#231F1C',

  /** Hover rows, subtle insets inside a panel: warm beige light / warm dark hover */
  panelAlt:        '#F5F0EB',
  panelAltDark:    '#2E2924',

  /** Default dividers and borders: warm border light / warm dark border */
  border:          '#E8E0D8',
  borderDark:      '#3D3530',

  /** Focused inputs, stronger borders */
  borderStrong:    '#D4C9BD',
  borderStrongDark:'#52483F',
} as const;

// ─── Warm neutral scale (for Tailwind utilities) ─────────────────────────────
/**
 * Custom warm neutral scale replacing cool grays.
 * Use `warm-50` through `warm-950` in Tailwind classes.
 */
export const warmNeutral = {
  50:  '#FAF8F5',
  100: '#F5F0EB',
  200: '#E8E0D8',
  300: '#D4C9BD',
  400: '#A8A29E',
  500: '#8A7F76',
  600: '#57534E',
  700: '#3D3530',
  800: '#2E2924',
  900: '#231F1C',
  950: '#1A1614',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
export const typography = {
  fontFamily: {
    sans:    ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    display: ['Fraunces', 'ui-serif', 'serif'],
    mono:    ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
  },
} as const;

// ─── Border radius ────────────────────────────────────────────────────────────
export const borderRadius = {
  none:    '0px',
  sm:      '0.25rem',
  DEFAULT: '0.375rem',
  md:      '0.5rem',
  lg:      '0.75rem',
  xl:      '1rem',
  '2xl':   '1.5rem',
  full:    '9999px',
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────
export const shadows = {
  sm:      '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
  md:      '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.08)',
  lg:      '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)',
} as const;

// ─── Category card accent colors ─────────────────────────────────────────────
/**
 * Soft pastel accents for kanban card left borders.
 * These are intentionally subtle — light tints, not bold colors.
 */
export const categoryAccents = {
  BUG:        { border: '#F5C6CB', bg: '#FEF2F2' },
  SUGGESTION: { border: '#BFD7ED', bg: '#EFF6FF' },
  COMPLAINT:  { border: '#FDD9B5', bg: '#FFF7ED' },
  PRAISE:     { border: '#B7E4C7', bg: '#F0FDF4' },
} as const;

// ─── Semantic status tokens ───────────────────────────────────────────────────
export const statusTokens: Record<FeedbackGroupStatus, string> = {
  OPEN:        'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  PLANNED:     'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  IN_PROGRESS: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
  DONE:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  CLOSED:      'bg-warm-200 text-warm-600 dark:bg-warm-800 dark:text-warm-400',
  ARCHIVED:    'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
};

// ─── Semantic category tokens ─────────────────────────────────────────────────
export type FeedbackCategory = 'BUG' | 'SUGGESTION' | 'COMPLAINT' | 'PRAISE';

export const categoryTokens: Record<FeedbackCategory, { bg: string; text: string }> = {
  BUG:        { bg: 'bg-red-100 dark:bg-red-900/30',        text: 'text-red-700 dark:text-red-400'        },
  SUGGESTION: { bg: 'bg-blue-100 dark:bg-blue-900/30',      text: 'text-blue-700 dark:text-blue-400'      },
  COMPLAINT:  { bg: 'bg-orange-100 dark:bg-orange-900/30',  text: 'text-orange-700 dark:text-orange-400'  },
  PRAISE:     { bg: 'bg-green-100 dark:bg-green-900/30',    text: 'text-green-700 dark:text-green-400'    },
};

// ─── Integration provider tokens ──────────────────────────────────────────────
export type IntegrationProvider = 'JIRA' | 'CLICKUP';

export const integrationTokens: Record<IntegrationProvider, { bg: string; text: string }> = {
  JIRA:    { bg: 'bg-blue-100 dark:bg-blue-900/40',    text: 'text-blue-700 dark:text-blue-300'    },
  CLICKUP: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300' },
};
