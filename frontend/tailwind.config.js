/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080810",
        cinema: "#05060b",
        surface: {
          DEFAULT: "#0f1118",
          hover: "#161925",
          light: "#1c2030",
          bright: "#242840",
        },
        primary: {
          DEFAULT: "#6366f1",
          hover: "#4f46e5",
          dim: "#4338ca",
          glow: "rgba(99, 102, 241, 0.35)",
          subtle: "rgba(99, 102, 241, 0.12)",
        },
        accent: {
          pink: "#ec4899",
          cyan: "#06b6d4",
          violet: "#8b5cf6",
          rose: "#f43f5e",
        },
        gold: {
          DEFAULT: "#f59e0b",
          dim: "#d97706",
          subtle: "rgba(245, 158, 11, 0.15)",
        },
        live: "#ef4444",
        success: "#10b981",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-cinema': 'linear-gradient(135deg, #0f1118 0%, #080810 100%)',
        'gradient-glow': 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 100%)',
      },
      boxShadow: {
        'glow-sm': '0 0 12px rgba(99, 102, 241, 0.25)',
        'glow-md': '0 0 24px rgba(99, 102, 241, 0.35)',
        'glow-lg': '0 0 48px rgba(99, 102, 241, 0.4)',
        'glow-pink': '0 0 20px rgba(236, 72, 153, 0.3)',
        'glow-gold': '0 0 20px rgba(245, 158, 11, 0.3)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.6)',
        'cinema': '0 20px 60px rgba(0, 0, 0, 0.8)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float-up': 'floatUp 2.8s ease-out forwards',
        'float-up-slow': 'floatUp 3.5s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer': 'shimmer 1.8s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-soft': 'bounceSoft 1s ease-in-out infinite',
        'live-ping': 'livePing 1.5s ease-in-out infinite',
        'message-in': 'messageIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(99, 102, 241, 0.3)' },
          '50%': { boxShadow: '0 0 32px rgba(99, 102, 241, 0.65), 0 0 60px rgba(139, 92, 246, 0.2)' },
        },
        floatUp: {
          '0%': { opacity: '1', transform: 'translateY(0) scale(0.85) rotate(-3deg)' },
          '30%': { opacity: '1', transform: 'translateY(-70px) scale(1.15) rotate(3deg)' },
          '70%': { opacity: '0.7', transform: 'translateY(-160px) scale(1.3) rotate(-2deg)' },
          '100%': { opacity: '0', transform: 'translateY(-240px) scale(1.5) rotate(5deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        livePing: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.3)' },
        },
        messageIn: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
