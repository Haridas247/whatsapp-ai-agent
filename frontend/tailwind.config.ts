import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        serif: ['var(--font-playfair)', 'serif'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: '#10b981',
          hover: '#059669',
          light: '#ecfdf5',
          dark: '#064e3b',
        },
        whatsapp: {
          DEFAULT: '#25D366',
          dark: '#075E54',
          light: '#DCF8C6',
        }
      },
    },
  },
  plugins: [],
};
export default config;
