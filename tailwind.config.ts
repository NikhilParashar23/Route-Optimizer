import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-grid': '#0A0C10',
        'bg-panel': '#12151C',
        'route-blue': '#3B82F6',
        'signal-cyan': '#00E5C7',
        'bus-yellow': '#FFC93C',
        'text-primary': '#F5F6F8',
        'text-muted': '#8A93A3',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-space-grotesk)', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'monospace'],
      },
      boxShadow: {
        'glow-blue': '0 0 25px -3px rgba(59, 130, 246, 0.45), 0 0 10px -2px rgba(59, 130, 246, 0.3)',
        'glow-cyan': '0 0 25px -3px rgba(0, 229, 199, 0.45), 0 0 10px -2px rgba(0, 229, 199, 0.3)',
        'glow-yellow': '0 0 25px -3px rgba(255, 201, 60, 0.35)',
        'glass-panel': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      dropShadow: {
        'glow-blue': '0 0 12px rgba(59, 130, 246, 0.65)',
        'glow-cyan': '0 0 12px rgba(0, 229, 199, 0.65)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.9' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
