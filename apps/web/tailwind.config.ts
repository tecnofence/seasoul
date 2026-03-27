import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1A3E6E', light: '#D6E4F0' },
        resort:  { DEFAULT: '#1A5E6E', light: '#D6EEF0' }
      }
    }
  },
  plugins: []
}
export default config
