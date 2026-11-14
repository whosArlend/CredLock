import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0a0e17', // Deep navy abyss base
          subtle: '#0f172a',  // Secondary background
          surface: '#131d31', // Card surface
          elevated: '#1a263e',// Popovers / Modals
        },
        border: {
          DEFAULT: '#1e293b',
          muted: '#172033',
          focus: '#334155',
          accent: '#10b981',
        },
        foreground: {
          DEFAULT: '#f8fafc', // Crisp off-white
          muted: '#94a3b8',   // Secondary metadata
          dim: '#64748b',     // Tertiary subtle text
        },
        cyber: {
          emerald: {
            DEFAULT: '#10b981',
            hover: '#059669',
            active: '#047857',
            muted: 'rgba(16, 185, 129, 0.12)',
            border: 'rgba(16, 185, 129, 0.3)',
          },
          amber: {
            DEFAULT: '#f59e0b',
            muted: 'rgba(245, 158, 11, 0.12)',
            border: 'rgba(245, 158, 11, 0.3)',
          },
          rose: {
            DEFAULT: '#f43f5e',
            muted: 'rgba(244, 63, 94, 0.12)',
            border: 'rgba(244, 63, 94, 0.3)',
          },
          cyan: {
            DEFAULT: '#06b6d4',
            muted: 'rgba(6, 182, 212, 0.12)',
            border: 'rgba(6, 182, 212, 0.3)',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        elevated: '0 10px 30px -5px rgba(0, 0, 0, 0.6)',
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.25)',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        card: '0.75rem',
        panel: '1rem',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
