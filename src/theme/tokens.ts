/**
 * Breachly design tokens — see CLAUDE.md §8.
 * Calm, credible, trustworthy. Not alarmist.
 */

export const colors = {
  // Base surfaces
  base: '#0B121A', // deep navy background
  card: '#13202E', // card surfaces
  cardElevated: '#17283A',
  hairline: '#21364A', // borders / dividers

  // Semantic
  safe: '#46D6A6', // mint green — all clear
  exposed: '#F2B24B', // calm amber — exposed
  severe: '#FF6B6B', // red — high severity, used sparingly
  primary: '#5BA9F4', // blue — primary action

  // Text
  text: '#EAF1F8',
  textMuted: '#9DB2C6',
  textFaint: '#6B829A',

  // Misc
  onPrimary: '#06121F',
  overlay: 'rgba(6, 12, 20, 0.6)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const font = {
  // Falls back to system fonts until Inter / JetBrains Mono are loaded.
  ui: 'Inter',
  uiMedium: 'Inter-Medium',
  uiSemibold: 'Inter-SemiBold',
  uiBold: 'Inter-Bold',
  mono: 'JetBrainsMono',
} as const;

export const type = {
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  h2: { fontSize: 20, lineHeight: 26, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
  small: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const },
} as const;
