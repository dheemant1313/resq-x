/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        command: {
          950: '#070a10', // Deepest command void
          900: '#0b101c', // Primary canvas background
          850: '#0f172a', // Card / panel base
          800: '#15203b', // Elevated surface
          700: '#1e2d4f', // Border / separator
          600: '#334155', // Muted stroke
        },
        emergency: {
          orange: '#ff5722', // Tactical accent
          glow: '#ff7043',
          red: '#ef4444',    // Critical alert
          amber: '#f59e0b',  // High priority warning
          green: '#10b981',  // Secure / dispatched / operational
          cyan: '#06b6d4',   // Route vector / telemetry
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'glow-orange': '0 0 20px -5px rgba(255, 87, 34, 0.4)',
        'glow-cyan': '0 0 20px -5px rgba(6, 182, 212, 0.35)',
        'command-card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
