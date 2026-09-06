import type { Config } from 'tailwindcss';
import sharedPreset from '@za/config/tailwind-preset';

const config: Config = {
  presets: [sharedPreset],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
    '../../packages/shared/src/**/*.{ts,tsx}',
  ],
};

export default config;
