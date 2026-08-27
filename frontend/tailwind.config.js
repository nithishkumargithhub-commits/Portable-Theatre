/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#030408",
        cinema: {
          950: "#020306",
          900: "#06070e",
          850: "#0a0c16",
          800: "#0f1220",
          700: "#171c32",
          600: "#222a4a",
          border: "rgba(255, 255, 255, 0.07)",
          highlight: "rgba(255, 255, 255, 0.12)",
        },
        surface: {
          DEFAULT: "#0a0c16",
          hover: "#101424",
          light: "#161b30",
          bright: "#1f2644",
        },
        primary: {
          DEFAULT: "#6366f1",
          hover: "#4f46e5",
          dim: "#4338ca",
          glow: "rgba(99, 102, 241, 0.45)",
          subtle: "rgba(99, 102, 241, 0.14)",
        },
        neon: {
          cyan: "#00f5d4",
          purple: "#9d4edd",
          pink: "#f72585",
          amber: "#ffb703",
          crimson: "#ff0054",
          blue: "#3a86ff",
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
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
        tech: ['"Space Grotesk"', 'monospace'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-cinema': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.18), rgba(255, 255, 255, 0))',
        'gradient-spotlight': 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(99, 102, 241, 0.12), transparent 40%)',
        'gradient-glow': 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(157,78,221,0.12) 50%, rgba(247,37,133,0.06) 100%)',
        'gradient-mesh': 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0, transparent 50%), radial-gradient(at 100% 0%, rgba(236, 72, 153, 0.12) 0, transparent 50%), radial-gradient(at 50% 100%, rgba(6, 182, 212, 0.1) 0, transparent 50%)',
      },
      boxShadow: {
        'glow-sm': '0 0 16px rgba(99, 102, 241, 0.3)',
        'glow-md': '0 0 30px rgba(99, 102, 241, 0.45)',
        'glow-lg': '0 0 60px rgba(99, 102, 241, 0.55)',
        'glow-neon': '0 0 25px rgba(0, 245, 212, 0.35)',
        'glow-pink': '0 0 25px rgba(247, 37, 133, 0.35)',
        'glow-purple': '0 0 30px rgba(157, 78, 221, 0.4)',
        'glow-gold': '0 0 25px rgba(255, 183, 3, 0.35)',
        'card': '0 8px 32px -4px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'card-hover': '0 20px 50px -8px rgba(0, 0, 0, 0.8), 0 0 30px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        'cinema': '0 25px 80px -12px rgba(0, 0, 0, 0.9), 0 0 40px rgba(99, 102, 241, 0.15)',
        'screen': '0 0 100px -10px rgba(99, 102, 241, 0.25), 0 20px 60px rgba(0,0,0,0.8)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'float-up': 'floatUp 2.8s ease-out forwards',
        'float-up-slow': 'floatUp 3.5s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer': 'shimmer 2.2s linear infinite',
        'marquee': 'marquee 25s linear infinite',
        'marquee-reverse': 'marqueeReverse 25s linear infinite',
        'spin-slow': 'spin 12s linear infinite',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
        'live-ping': 'livePing 1.8s ease-in-out infinite',
        'message-in': 'messageIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'laser-scan': 'laserScan 3s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 16px rgba(99, 102, 241, 0.35)' },
          '50%': { boxShadow: '0 0 36px rgba(99, 102, 241, 0.75), 0 0 70px rgba(157, 78, 221, 0.35)' },
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
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        marqueeReverse: {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        livePing: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(1.4)' },
        },
        messageIn: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        laserScan: {
          '0%, 100%': { top: '0%', opacity: '0' },
          '15%': { opacity: '0.8' },
          '85%': { opacity: '0.8' },
          '100%': { top: '100%', opacity: '0' },
        }
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
}
