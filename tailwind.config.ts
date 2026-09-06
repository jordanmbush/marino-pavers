/* eslint-disable import/no-extraneous-dependencies */
import tailwindTypography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

export default {
  darkMode: ['class'],
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Archivo Expanded"', '"Archivo"', ...fontFamily.sans],
        sans: ['"Plus Jakarta Sans"', ...fontFamily.sans],
        mono: ['"Space Mono"', ...fontFamily.mono],
      },
      fontWeight: {
        400: '400',
        500: '500',
        600: '600',
        700: '700',
        800: '800',
        900: '900',
      },
      colors: {
        // Sonoran masonry palette
        basalt: {
          DEFAULT: '#211C17',
          950: '#181410',
          900: '#211C17',
          800: '#2E271F',
          700: '#3D342A',
          600: '#4E4336',
        },
        sand: {
          DEFAULT: '#E5D9C3',
          light: '#EDE3D2',
          dark: '#D6C6AA',
        },
        bone: '#F3ECDE',
        cherokee: {
          DEFAULT: '#A8432B',
          dark: '#8E3421',
          light: '#C0563D',
        },
        ochre: {
          DEFAULT: '#CD854A',
          light: '#DBA06E',
        },
        sage: {
          DEFAULT: '#71755B',
          dark: '#585B45',
        },
      },
      borderRadius: {
        tile: '3px',
      },
      boxShadow: {
        paver: '0 18px 40px -24px rgba(33, 28, 23, 0.55)',
        'paver-lg': '0 40px 80px -36px rgba(33, 28, 23, 0.6)',
        seam: 'inset 0 1px 0 0 rgba(243, 236, 222, 0.06)',
      },
      letterSpacing: {
        label: '0.24em',
      },
      maxWidth: {
        shell: '80rem',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(22px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'lay-in': {
          '0%': { opacity: '0', transform: 'translateX(-10px) rotate(-1deg)' },
          '100%': { opacity: '1', transform: 'translateX(0) rotate(0)' },
        },
      },
      animation: {
        rise: 'rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'lay-in': 'lay-in 0.6s ease-out both',
      },
    },
  },
  plugins: [tailwindTypography],
} satisfies Config;
