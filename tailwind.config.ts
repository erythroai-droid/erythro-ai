import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primitives: Coal (Угольные оттенки)
        coal: {
          100: "#B9B9B9",
          200: "#989898",
          300: "#686868",
          400: "#4B4B4B",
          500: "#1E1E1E",
          600: "#1B1B1B",
          700: "#151515",
          800: "#111111",
          900: "#0D0D0D",
        },
        // Primitives: Erythro (Фирменный Красный)
        erythro: {
          100: "#F7BBBA",
          200: "#F39A99",
          300: "#EE6C6A",
          400: "#EA504D",
          500: "#E52421", // Основной акцент системы
          600: "#D0211E",
          700: "#A31A17",
          800: "#7E1412",
          900: "#600F0E",
          DEFAULT: "#E52421",
        },
        // Primitives: Gold (Премиальное Золото)
        gold: {
          100: "#FFFFFF",
          200: "#FFF5E5",
          300: "#FFF0D9",
          400: "#FFEDD2",
          500: "#FFE9C7",
          600: "#F1D9B5",
          700: "#B5A58D",
          800: "#8C806D",
          900: "#6B6254",
          DEFAULT: "#FFE9C7",
        },
      },
      borderRadius: {
        "radius-xs": "2px",
        "radius-sm": "5px",
        "radius-md": "10px",
        "radius-lg": "20px",
        "radius-xl": "40px",
        "radius-2xl": "80px",
        "radius-max": "9999px",
      },
      spacing: {
        "space-xs": "4px",
        "space-s": "8px",
        "space-m": "16px",
        "space-l": "24px",
        "space-xl": "32px",
        "space-30px": "30px",
        "space-40px": "40px",
        "space-60px": "60px",
        "space-100px": "100px",
      },
      maxWidth: {
        "content-grid": "1170px",
      },
      boxShadow: {
        "btn-primary-dark": "0 3px 20px 0 rgba(255, 233, 199, 0.3)",
        "btn-primary-light": "0 3px 20px 0 rgba(229, 36, 33, 0.5)",
        "btn-secondary": "0 3px 20px 0 rgba(255, 233, 199, 0.3)",
        "card-services-dark": "0 5px 20px 0 rgba(13, 13, 13, 0.3)",
        "card-services-light": "0 5px 20px 0 rgba(13, 13, 13, 0.2)",
        "btn-tertiary": "0 3px 20px 0 rgba(255, 255, 255, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
