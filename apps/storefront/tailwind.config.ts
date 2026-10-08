import type { Config } from 'tailwindcss';
import sharedPreset from '@za/config/tailwind-preset';

/**
 * ADR 0029 — the "ZA Identity System" token layer, superseding ADR 0028's
 * palette/logo/typography specifics while keeping its architecture intact:
 * additive alongside the shared `@za/config/tailwind-preset` (never inside
 * it), every token namespaced `brand-*` so it can never collide with, or be
 * mistaken for, the shared `pink`/`neutral`/etc. scale that `packages/ui`
 * and `apps/admin` still render with, completely unchanged. See ADR 0029 §1.
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
        // ADR 0029 §2 — exact hex values from the identity system.
        'brand-cream': '#FFF4E6',
        'brand-paper': '#FFFCFD',
        'brand-ink': '#241F23',
        'brand-plum': '#7B4D6D',
        'brand-berry': '#704060',
        'brand-rose': '#E58FA7',
        'brand-petal': { 100: '#F9D6E1', 300: '#F6B7C8' },
        'brand-blush': '#FBEAF0',
        'brand-dusty': '#D88AAD',
        'brand-mauve': '#C09098',
        'brand-lavender': '#CDB8F0',
        'brand-gold': '#F8D98A',
        'brand-success': '#8FA888',
        'brand-success-solid': '#5F7A57',
        'brand-success-text': '#4F6E48',
        'brand-error': '#B5495B',
        'brand-error-tint': '#F5DADD',
        // Pale tints derived from the primary/rare-accent hues above, needed
        // for card/badge surfaces (the identity book only swatches the
        // saturated step of each — these are this implementation's own
        // interpolations, kept strong enough to read clearly, not washed out).
        'brand-plum-tint': '#D7CAD3',
        'brand-gold-tint': '#FBEBC4',
        'brand-lavender-tint': '#E7DBF8',
      },
      fontFamily: {
        script: ['var(--font-script)', 'cursive'],
      },
      borderRadius: {
        'brand-sm': '12px',
        'brand-md': '20px',
        'brand-lg': '28px',
        'brand-xl': '36px',
        'brand-pill': '999px',
        'brand-blob': '63% 37% 54% 46% / 43% 45% 55% 57%',
      },
      boxShadow: {
        // ADR 0029 §9 — one warm-plum shadow recipe everywhere, never generic gray.
        'brand-soft': '0 20px 60px rgba(123, 77, 109, 0.14)',
        'brand-tight': '0 8px 22px rgba(123, 77, 109, 0.12)',
        'brand-glow': '0 0 40px rgba(248, 217, 138, 0.4)',
      },
      backgroundImage: {
        'brand-gradient-hero':
          'radial-gradient(circle at 14% 20%, rgba(229,143,167,.30), transparent 40%), radial-gradient(circle at 88% 8%, rgba(205,184,240,.28), transparent 38%), linear-gradient(160deg, #FFF8FA 0%, #F9D6E1 46%, #FFF4E6 100%)',
        'brand-gradient-section':
          'linear-gradient(180deg, #FFFCFD 0%, #FBEAF0 100%)',
        'brand-gradient-newsletter':
          'linear-gradient(120deg, #7B4D6D 0%, #704060 100%)',
        'brand-gradient-spotlight':
          'radial-gradient(circle, rgba(248,217,138,0.9) 0%, rgba(248,217,138,0) 70%)',
        'brand-gradient-rose-dusty':
          'linear-gradient(150deg, #E58FA7, #D88AAD)',
        'brand-gradient-plum-berry':
          'linear-gradient(150deg, #7B4D6D, #704060)',
        'brand-gradient-lavender-dusty':
          'linear-gradient(150deg, #CDB8F0, #D88AAD)',
      },
      spacing: {
        'section-y': 'clamp(4rem, 8vw, 9rem)',
      },
      keyframes: {
        // ADR 0029 §10 — exact motion-language specs (durations/curves/distances).
        'brand-float': {
          '0%, 100%': { transform: 'translateY(10px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'brand-fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'brand-slide-x': {
          '0%, 100%': { transform: 'translateX(-26px)' },
          '50%': { transform: 'translateX(26px)' },
        },
        'brand-pop': {
          '0%, 80%, 100%': { transform: 'scale(1)' },
          '90%': { transform: 'scale(1.18)' },
        },
        'brand-ribbon-draw': {
          '0%': { strokeDashoffset: '240' },
          '100%': { strokeDashoffset: '0' },
        },
        'brand-hero-reveal': {
          '0%': { opacity: '0', transform: 'scale(.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'brand-twinkle': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(0.9)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
        // The book's page-turn hint: the outer edge of a page lifts a little and
        // breathes (the individual `rotate` property composes with the leaf's own
        // transform).
        'book-lift-right': {
          '0%, 100%': { rotate: '0 1 0 -3deg' },
          '50%': { rotate: '0 1 0 -10deg' },
        },
        'book-lift-left': {
          '0%, 100%': { rotate: '0 1 0 3deg' },
          '50%': { rotate: '0 1 0 10deg' },
        },
        // A quick blink for the peeking eyes of the hero CTA (CreepyLink).
        'brand-blink': {
          '0%, 90%, 100%': { transform: 'scaleY(1)' },
          '95%': { transform: 'scaleY(0.08)' },
        },
      },
      animation: {
        'brand-float': 'brand-float 2.6s ease-in-out infinite',
        'brand-float-slow': 'brand-float 5s ease-in-out infinite',
        'brand-fade-up': 'brand-fade-up 400ms cubic-bezier(.22,1,.36,1) both',
        'brand-slide-x':
          'brand-slide-x 2.1s cubic-bezier(.22,1,.36,1) infinite',
        'brand-pop': 'brand-pop 1.6s ease-in-out infinite',
        'brand-pop-once': 'brand-pop 250ms cubic-bezier(.34,1.56,.64,1) 1',
        'brand-ribbon-draw': 'brand-ribbon-draw 600ms ease both',
        'brand-hero-reveal':
          'brand-hero-reveal 600ms cubic-bezier(.22,1,.36,1) both',
        'brand-twinkle': 'brand-twinkle 3s ease-in-out infinite',
        'brand-blink': 'brand-blink 4s ease-in-out infinite',
        'book-lift-right': 'book-lift-right 3.2s ease-in-out infinite',
        'book-lift-left': 'book-lift-left 3.2s ease-in-out infinite',
      },
      transitionTimingFunction: {
        brand: 'cubic-bezier(.22,1,.36,1)',
      },
    },
  },
};

export default config;
