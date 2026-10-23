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
        navy: {
          DEFAULT: "#14263D",
          dark: "#0E1C2E",
          light: "#1E3554",
          subtle: "#2A456B",
        },
        teal: {
          DEFAULT: "#0F9F91",
          hover: "#0D8A7E",
          light: "#E6F6F5",
          dark: "#096D64",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F5F7FA",
          subtle: "#EEF2F6",
        },
        border: "#E2E8F0",
      },
    },
  },
  plugins: [],
};
export default config;
