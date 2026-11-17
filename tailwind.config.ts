import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Obsidian Vault × Cipher Ledger Core Tokens
        background: {
          DEFAULT: '#0C0D0E', // Main application background (Basalt)
          secondary: '#131517', // Secondary structural surfaces
          subtle: '#131517',  // Backward compatibility alias
          surface: '#1A1D20', // Primary component surfaces (Obsidian Plate)
          elevated: '#24282D',// Elevated interactive elements (Alloy Elevate)
        },
        foreground: {
          DEFAULT: '#F3F4F6', // Main text (Chalk White)
          secondary: '#A1A1AA', // Supporting text
          muted: '#A1A1AA',   // Supporting text (Zinc 400)
          dim: '#71717A',     // Low-priority / muted text (Zinc 500)
        },
        border: {
          DEFAULT: '#282C32', // Default boundaries (Milled Edge)
          strong: '#383E46',  // Emphasized boundaries
          muted: '#1B1E22',   // Subtle dividers
          focus: '#E5A93C',   // Primary accent focus ring
          accent: '#E5A93C',  // Brand accent boundary
        },
        accent: {
          DEFAULT: '#E5A93C', // Primary Accent (Crucible Gold / Safety Amber)
          hover: '#D9982F',
          active: '#C28424',
          muted: 'rgba(229, 169, 60, 0.12)',
          border: 'rgba(229, 169, 60, 0.3)',
        },
        status: {
          success: '#10B981', // Safe and successful states (Emerald)
          danger: '#DC2626',  // Breached and critical states (Crimson)
          warning: '#F59E0B', // Warnings and caution states (Amber)
          info: '#38BDF8',    // Informational states (Sky)
        },
        // Mapped cyber tokens for existing feature compatibility
        cyber: {
          emerald: {
            DEFAULT: '#10B981',
            hover: '#059669',
            active: '#047857',
            muted: 'rgba(16, 185, 129, 0.12)',
            border: 'rgba(16, 185, 129, 0.3)',
          },
          amber: {
            DEFAULT: '#E5A93C',
            hover: '#D9982F',
            active: '#C28424',
            muted: 'rgba(229, 169, 60, 0.12)',
            border: 'rgba(229, 169, 60, 0.3)',
          },
          rose: {
            DEFAULT: '#DC2626',
            hover: '#B91C1C',
            active: '#991B1B',
            muted: 'rgba(220, 38, 38, 0.12)',
            border: 'rgba(220, 38, 38, 0.3)',
          },
          cyan: {
            DEFAULT: '#38BDF8',
            hover: '#0284C7',
            active: '#0369A1',
            muted: 'rgba(56, 189, 248, 0.12)',
            border: 'rgba(56, 189, 248, 0.3)',
          },
        },
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"Space Mono"',
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
        elevated: '0 4px 16px -2px rgba(0, 0, 0, 0.6), 0 2px 6px -2px rgba(0, 0, 0, 0.4)',
        inset: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.5)',
        'glow-accent': '0 0 16px -4px rgba(229, 169, 60, 0.25)',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
        card: '8px',
        xl: '12px',
        panel: '12px',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.16, 1, 0.3, 1)',
        mechanical: 'cubic-bezier(0.2, 0, 0, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
