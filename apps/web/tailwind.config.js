import { colors, typography, borderRadius, shadows } from './src/design-system/tokens.ts';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
      },
      fontFamily: typography.fontFamily,
      borderRadius,
      boxShadow: shadows,
    },
  },
  plugins: [],
};
