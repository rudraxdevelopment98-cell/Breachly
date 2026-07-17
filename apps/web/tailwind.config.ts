import type { Config } from 'tailwindcss';

// Calm, credible palette carried over from the Breachly design direction.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0B121A',
        card: '#13202E',
        cardElevated: '#17283A',
        hairline: '#21364A',
        safe: '#46D6A6',
        exposed: '#F2B24B',
        severe: '#FF6B6B',
        primary: '#5BA9F4',
        text: '#EAF1F8',
        textMuted: '#9DB2C6',
        textFaint: '#6B829A',
      },
    },
  },
  plugins: [],
};

export default config;
