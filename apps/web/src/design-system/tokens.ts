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
 * FOR THE DESIGNER
 * ─────────────────
 * This file uses plain TypeScript objects. You do not need to know React or Tailwind.
 * Change a hex value → save → the change appears everywhere automatically.
 * See DESIGN_SYSTEM.md for a step-by-step guide.
 */

import type { FeedbackGroupStatus } from '../services/feedbackGroups';

// ─── Primitive color palettes ─────────────────────────────────────────────────

/**
 * Brand primary — Indigo scale.
 * primary-600 (#4f46e5) is the main CTA color: buttons, links, active states.
 */
export const colors = {
  primary: {
    50:  '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },
} as const;

// ─── Semantic surface tokens ──────────────────────────────────────────────────
/**
 * Documents the intended meaning of each gray shade.
 * Tailwind utilities remain `gray-*` to avoid a mass rename — this object
 * is the designer's reference for what each shade represents.
 *
 * Light-mode value → dark-mode value (mirrored in CSS variables in index.css).
 */
export const surface = {
  /** Page background: gray-50 light / gray-950 dark */
  background:      '#f9fafb',
  backgroundDark:  '#030712',

  /** Cards, sidebar, header, modals: white light / gray-900 dark */
  panel:           '#ffffff',
  panelDark:       '#111827',

  /** Hover rows, subtle insets inside a panel: gray-100 light / gray-800 dark */
  panelAlt:        '#f3f4f6',
  panelAltDark:    '#1f2937',

  /** Default dividers and borders: gray-200 light / gray-800 dark */
  border:          '#e5e7eb',
  borderDark:      '#1f2937',

  /** Focused inputs, stronger borders: gray-300 light / gray-700 dark */
  borderStrong:    '#d1d5db',
  borderStrongDark:'#374151',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
/**
 * Inter is used for both the web app and PDF reports — brand consistency.
 * Loaded via Google Fonts @import in src/index.css.
 */
export const typography = {
  fontFamily: {
    /** Body and UI text */
    sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    /** Code snippets, API keys, monospace fields */
    mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
  },
} as const;

// ─── Border radius ────────────────────────────────────────────────────────────
/**
 * Used in tailwind.config.js to register these as Tailwind `rounded-*` utilities.
 * Primary card/panel radius: `rounded-lg` (0.75rem).
 */
export const borderRadius = {
  none:    '0px',
  sm:      '0.25rem',   // rounded-sm  — tight chips, compact elements
  DEFAULT: '0.375rem',  // rounded     — inputs, small tags
  md:      '0.5rem',    // rounded-md  — buttons, secondary elements
  lg:      '0.75rem',   // rounded-lg  — cards, panels (primary border radius)
  xl:      '1rem',      // rounded-xl  — modals, auth cards
  full:    '9999px',    // rounded-full — badges, avatars, pills
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────
export const shadows = {
  sm:      '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.10), 0 1px 2px -1px rgb(0 0 0 / 0.10)',
  md:      '0 4px 6px -1px rgb(0 0 0 / 0.10), 0 2px 4px -2px rgb(0 0 0 / 0.10)',
  lg:      '0 10px 15px -3px rgb(0 0 0 / 0.10), 0 4px 6px -4px rgb(0 0 0 / 0.10)',
} as const;

// ─── Semantic status tokens ───────────────────────────────────────────────────
/**
 * Color classes for each feedback group status.
 * Used by StatusBadge.tsx.
 *
 * NOTE: These must be full, literal Tailwind class strings.
 * Tailwind's JIT scanner needs to see the exact class names in source files
 * to include them in the final CSS. Do NOT construct them dynamically.
 *
 * To change a status color: replace the color name (e.g. blue → teal).
 * Available Tailwind colors: https://tailwindcss.com/docs/colors
 */
export const statusTokens: Record<FeedbackGroupStatus, string> = {
  OPEN:        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PLANNED:     'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  IN_PROGRESS: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  DONE:        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CLOSED:      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
  ARCHIVED:    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

// ─── Semantic category tokens ─────────────────────────────────────────────────
/**
 * Color classes for each feedback category.
 * Used by CategoryBadge.tsx.
 *
 * Same JIT rule applies — keep these as full literal strings.
 */
export type FeedbackCategory = 'BUG' | 'SUGGESTION' | 'COMPLAINT' | 'PRAISE';

export const categoryTokens: Record<FeedbackCategory, { bg: string; text: string }> = {
  BUG:        { bg: 'bg-red-100 dark:bg-red-900/30',        text: 'text-red-700 dark:text-red-400'        },
  SUGGESTION: { bg: 'bg-blue-100 dark:bg-blue-900/30',      text: 'text-blue-700 dark:text-blue-400'      },
  COMPLAINT:  { bg: 'bg-orange-100 dark:bg-orange-900/30',  text: 'text-orange-700 dark:text-orange-400'  },
  PRAISE:     { bg: 'bg-green-100 dark:bg-green-900/30',    text: 'text-green-700 dark:text-green-400'    },
};

// ─── Integration provider tokens ──────────────────────────────────────────────
/**
 * Color classes for external issue badges (Jira, ClickUp).
 * Used in FeedbackGroupCard and FeedbackGroupDetailModal.
 */
export type IntegrationProvider = 'JIRA' | 'CLICKUP';

export const integrationTokens: Record<IntegrationProvider, { bg: string; text: string }> = {
  JIRA:    { bg: 'bg-blue-100 dark:bg-blue-900/40',    text: 'text-blue-700 dark:text-blue-300'    },
  CLICKUP: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300' },
};
