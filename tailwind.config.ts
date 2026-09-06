import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F4C81",
          dark: "#0B3A63",
          light: "#1E6FB8"
        },
        accent: {
          DEFAULT: "#C8102E",
          light: "#E53935"
        },
        success: {
          DEFAULT: "#1A7F4C"
        },
        aviso: {
          DEFAULT: "#B7791F"
        },
        neutral: {
          DEFAULT: "#F7F7F5",
          dark: "#1A1A1A"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["var(--font-lora)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 2px 12px -2px rgb(15 76 129 / 0.08), 0 8px 24px -8px rgb(15 76 129 / 0.1)",
        card: "0 1px 2px rgb(26 26 26 / 0.04), 0 8px 24px -12px rgb(26 26 26 / 0.12)",
        glow: "0 0 0 1px rgb(15 76 129 / 0.08), 0 8px 32px -12px rgb(15 76 129 / 0.25)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      letterSpacing: {
        tightest: "-0.02em",
      },
      maxWidth: {
        readable: "68ch",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;