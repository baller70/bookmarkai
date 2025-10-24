/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        'audiowide': ['var(--font-audiowide)', 'cursive'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        blobPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-25%)' },
        },
        morphBlob: {
          '0%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
          '100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        voiceBar1: {
          '0%': { transform: 'scaleY(0.4)' },
          '100%': { transform: 'scaleY(1.2)' },
        },
        voiceBar2: {
          '0%': { transform: 'scaleY(0.6)' },
          '100%': { transform: 'scaleY(1.4)' },
        },
        voiceBar3: {
          '0%': { transform: 'scaleY(0.3)' },
          '100%': { transform: 'scaleY(1.0)' },
        },
        voiceBar4: {
          '0%': { transform: 'scaleY(0.7)' },
          '100%': { transform: 'scaleY(1.3)' },
        },
        voiceBar5: {
          '0%': { transform: 'scaleY(0.2)' },
          '100%': { transform: 'scaleY(1.1)' },
        },
        rotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(59, 130, 246, 0.6)' },
        },
        morphBlobAdvanced: {
          '0%': { 
            borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
            transform: 'scale(1) rotate(0deg)'
          },
          '25%': { 
            borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%',
            transform: 'scale(1.02) rotate(90deg)'
          },
          '50%': { 
            borderRadius: '50% 50% 50% 50% / 50% 50% 50% 50%',
            transform: 'scale(1.05) rotate(180deg)'
          },
          '75%': { 
            borderRadius: '70% 30% 60% 40% / 40% 70% 50% 60%',
            transform: 'scale(1.02) rotate(270deg)'
          },
          '100%': { 
            borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
            transform: 'scale(1) rotate(360deg)'
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        blobPulse: 'blobPulse 4s ease-in-out infinite',
        bounce: 'bounce 1s ease-in-out infinite',
        morphBlob: 'morphBlob 6s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        voiceBar1: 'voiceBar1 0.6s ease-in-out infinite alternate',
        voiceBar2: 'voiceBar2 0.7s ease-in-out infinite alternate',
        voiceBar3: 'voiceBar3 0.5s ease-in-out infinite alternate',
        voiceBar4: 'voiceBar4 0.8s ease-in-out infinite alternate',
        voiceBar5: 'voiceBar5 0.4s ease-in-out infinite alternate',
        rotate: 'rotate 20s linear infinite',
        glowPulse: 'glowPulse 3s ease-in-out infinite',
        morphBlobAdvanced: 'morphBlobAdvanced 8s ease-in-out infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

