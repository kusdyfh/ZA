/**
 * Shared Tailwind preset — implements the design tokens frozen in
 * docs/09-DESIGN-SYSTEM.md. Both apps/storefront and apps/admin extend
 * this preset rather than redefining tokens, so a brand update happens
 * in one place.
 *
 * @type {Partial<import('tailwindcss').Config>}
 */
module.exports = {
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        pink: {
          50: '#FDF3F6',
          100: '#FBE4EC',
          200: '#F6C9D9',
          300: '#EEA0B9',
          400: '#E97798',
          500: '#E8567F',
          600: '#CD3F68',
          700: '#A93054',
          800: '#872842',
          900: '#7A1F3D',
        },
        neutral: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
        },
        success: { 500: '#3D9A5C' },
        warning: { 500: '#D68B2A' },
        danger: { 500: '#C0425A' },
        info: { 500: '#4A7FB5' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-serif', 'serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.375rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.75rem' }],
        '5xl': ['3rem', { lineHeight: '3.5rem' }],
      },
      borderRadius: {
        sm: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(122, 31, 61, 0.06)',
        md: '0 4px 12px rgba(122, 31, 61, 0.08)',
        lg: '0 12px 32px rgba(122, 31, 61, 0.12)',
        focus: '0 0 0 3px rgba(246, 201, 217, 0.9)',
      },
    },
  },
};
