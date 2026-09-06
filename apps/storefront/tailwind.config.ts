import type { Config } from 'tailwindcss';
import sharedPreset from '@za/config/tailwind-preset';

/**
 * Epic 13 (ADR 0028) — the storefront's own "brand" token layer, additive
 * alongside the shared `@za/config/tailwind-preset` (never inside it). Every
 * token here is namespaced `brand-*` so it can never collide with, or be
 * mistaken for, the shared `pink`/`neutral`/etc. scale that `packages/ui`
 * and `apps/admin` still render with, completely unchanged. See ADR 0028 §1.
 */
const config: Config = {
  presets: [sharedPreset],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
    '../../packages/shared/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-blush': {
          50: '#FFF6FA',
          100: '#FEEBF3',
          200: '#FBD3E6',
          300: '#F7B0D2',
          400: '#F084B9',
          500: '#E85FA0',
          600: '#D13F84',
          700: '#AC2E68',
          800: '#872550',
          900: '#5E1B38',
        },
        'brand-cream': {
          50: '#FFFEFB',
          100: '#FFFBF3',
          200: '#FDF3E2',
          300: '#FBEACC',
          400: '#F5DDB0',
          500: '#F5E6D3',
          600: '#E8D0A8',
        },
        'brand-butter': {
          100: '#FFF9E8',
          300: '#FFEFC2',
          500: '#FFD966',
          700: '#E0A82E',
        },
        'brand-sky': {
          100: '#EAF4FA',
          300: '#C3E1F0',
          500: '#8FC4E3',
          700: '#4E93BD',
        },
        'brand-plum': {
          100: '#F1E9F7',
          300: '#D6BEEA',
          500: '#A87BC9',
          700: '#7A4F9C',
        },
        'brand-glow': '#FFE9A8',
        'brand-glow-strong': '#FFC94D',
        'brand-ink': '#3A2A2E',
        'brand-ink-muted': '#7A6368',
      },
      fontFamily: {
        script: ['var(--font-script)', 'cursive'],
      },
      borderRadius: {
        'brand-sm': '12px',
        'brand-md': '20px',
        'brand-lg': '28px',
        'brand-xl': '40px',
        'brand-pill': '999px',
        'brand-blob': '63% 37% 54% 46% / 43% 45% 55% 57%',
      },
      boxShadow: {
        'brand-soft': '0 8px 24px rgba(232, 95, 160, 0.12)',
        'brand-card': '0 12px 32px rgba(58, 42, 46, 0.08)',
        'brand-glow': '0 0 40px rgba(255, 201, 77, 0.35)',
      },
      backgroundImage: {
        'brand-gradient-hero': 'linear-gradient(135deg, #E85FA0 0%, #F084B9 45%, #FFD966 100%)',
        'brand-gradient-section': 'linear-gradient(180deg, #FFFBF3 0%, #FFF6FA 100%)',
        'brand-gradient-newsletter': 'linear-gradient(120deg, #E85FA0 0%, #A87BC9 100%)',
        'brand-gradient-spotlight': 'radial-gradient(circle, rgba(255,233,168,0.9) 0%, rgba(255,233,168,0) 70%)',
      },
      spacing: {
        'section-y': 'clamp(4rem, 8vw, 9rem)',
      },
      keyframes: {
        'brand-float': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(3deg)' },
        },
        'brand-float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'brand-fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'brand-twinkle': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(0.9)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
      },
      animation: {
        'brand-float': 'brand-float 6s ease-in-out infinite',
        'brand-float-slow': 'brand-float-slow 8s ease-in-out infinite',
        'brand-fade-up': 'brand-fade-up 0.6s ease-out both',
        'brand-twinkle': 'brand-twinkle 3s ease-in-out infinite',
      },
    },
  },
};

export default config;
