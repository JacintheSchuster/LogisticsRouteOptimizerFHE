import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'rgba(120, 142, 182, 0.22)',
        input: 'rgba(120, 142, 182, 0.22)',
        ring: '#6d6eff',
        background: '#070910',
        foreground: '#f5f7ff',
        'color-bg': '#070910',
        'color-bg-alt': '#0a0d16',
        'color-text': '#f5f7ff',
        'color-text-dim': 'rgba(198, 207, 232, 0.72)',
        'color-panel': 'rgba(16, 20, 36, 0.92)',
        'color-panel-alt': 'rgba(20, 24, 42, 0.88)',
        'color-border': 'rgba(120, 142, 182, 0.22)',
        'color-border-strong': 'rgba(120, 142, 182, 0.38)',
        primary: {
          DEFAULT: '#6d6eff',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: 'rgba(148, 163, 184, 0.18)',
          foreground: '#f5f7ff',
        },
        accent: {
          DEFAULT: '#6d6eff',
          hover: '#5456ff',
          soft: 'rgba(109, 110, 255, 0.16)',
          border: 'rgba(109, 110, 255, 0.28)',
          foreground: '#ffffff',
        },
        success: {
          DEFAULT: '#2bc37b',
          soft: 'rgba(43, 195, 123, 0.16)',
        },
        warning: {
          DEFAULT: '#f3b13b',
          soft: 'rgba(243, 177, 59, 0.16)',
        },
        error: {
          DEFAULT: '#ef5350',
          soft: 'rgba(239, 83, 80, 0.16)',
        },
        info: {
          DEFAULT: '#3b82f6',
          soft: 'rgba(59, 130, 246, 0.16)',
        },
        destructive: {
          DEFAULT: '#ef5350',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: 'rgba(148, 163, 184, 0.18)',
          foreground: 'rgba(198, 207, 232, 0.72)',
        },
        popover: {
          DEFAULT: 'rgba(16, 20, 36, 0.92)',
          foreground: '#f5f7ff',
        },
        card: {
          DEFAULT: 'rgba(16, 20, 36, 0.92)',
          foreground: '#f5f7ff',
        },
      },
      spacing: {
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '5': '1.5rem',
        '6': '2rem',
        '8': '4rem',
      },
      borderRadius: {
        sm: '0.5rem',
        md: '1.05rem',
        lg: '1.35rem',
        full: '999px',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'SF Mono', 'Monaco', 'Cascadia Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        sm: '0 2px 8px rgba(0, 0, 0, 0.1)',
        md: '0 4px 12px rgba(0, 0, 0, 0.15)',
        lg: '0 8px 24px rgba(109, 110, 255, 0.25)',
        panel: '0 18px 42px -32px rgba(5, 8, 18, 0.9)',
      },
      transitionDuration: {
        quick: '150ms',
        default: '180ms',
        smooth: '300ms',
      },
      transitionTimingFunction: {
        default: 'cubic-bezier(0.2, 0.9, 0.35, 1)',
      },
      backdropBlur: {
        glass: '18px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'spin': 'spin 0.7s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
