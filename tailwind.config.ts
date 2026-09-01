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
        neutral: {
          DEFAULT: "#F7F7F5",
          dark: "#1A1A1A"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;