import type { Config } from "tailwindcss";
import { theme } from "./client/src/lib/theme";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          100: "hsl(var(--primary-100))",
          200: "hsl(var(--primary-200))",
          300: "hsl(var(--primary-300))",
          400: "hsl(var(--primary-400))",
          500: "hsl(var(--primary-500))",
          600: "hsl(var(--primary-600))",
          700: "hsl(var(--primary-700))",
          800: "hsl(var(--primary-800))",
          900: "hsl(var(--primary-900))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          100: "hsl(var(--secondary-100))",
          200: "hsl(var(--secondary-200))",
          300: "hsl(var(--secondary-300))",
          400: "hsl(var(--secondary-400))",
          500: "hsl(var(--secondary-500))",
          600: "hsl(var(--secondary-600))",
          700: "hsl(var(--secondary-700))",
          800: "hsl(var(--secondary-800))",
          900: "hsl(var(--secondary-900))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-shadow": {
          "0%, 100%": {
            boxShadow: "0 0 0 0 rgba(var(--primary), 0)",
          },
          "50%": {
            boxShadow: "0 0 20px 0 rgba(var(--primary), 0.1)",
          },
        },
        "page-turn": {
          "0%": {
            transform: "rotateX(0deg)",
            opacity: "0",
          },
          "100%": {
            transform: "rotateX(0deg)",
            opacity: "1",
          },
          "40%": {
            transform: "rotateX(-20deg)",
            opacity: "0.4",
          },
        },
        "page-out": {
          "0%": {
            transform: "rotateX(0deg)",
            opacity: "1",
          },
          "60%": {
            transform: "rotateX(20deg)",
            opacity: "0.4",
          },
          "100%": {
            transform: "rotateX(0deg)",
            opacity: "0",
          },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-shadow": "pulse-shadow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "page-turn": "page-turn 1s cubic-bezier(0.4, 0, 0.2, 1)",
        "page-out": "page-out 1s cubic-bezier(0.4, 0, 0.2, 1)",
      },
      perspective: {
        '1000': '1000px',
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;