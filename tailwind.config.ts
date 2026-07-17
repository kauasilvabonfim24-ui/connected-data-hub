import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1B2A4A',
          50: '#EBEEF3',
          100: '#D2D9E6',
          400: '#3D5580',
          600: '#243A61',
          900: '#0F1832'
        },
        amber: {
          DEFAULT: '#FFB020',
          400: '#FFC152',
          600: '#E69200'
        },
        ia: {
          DEFAULT: '#0EA5A0',
          100: '#D6F3F1',
          600: '#0B7D79'
        },
        ink: {
          DEFAULT: '#101828',
          muted: '#667085',
          soft: '#98A2B3'
        },
        surface: {
          DEFAULT: '#F5F6F8',
          card: '#FFFFFF',
          border: '#E4E7EC'
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.08)'
      }
    }
  },
  plugins: []
} satisfies Config
