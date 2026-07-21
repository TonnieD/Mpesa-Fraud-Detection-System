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
        background: "var(--background)",
        foreground: "var(--foreground)",
        safaricom: {
          green: "#4CAF50",
          "green-dark": "#1B5E20",
          "green-light": "#A5D6A7",
          dark: "#0D1F0D",
          light: "#FAFAFA",
          text: "#1A1A1A",
        },
        alert: {
          allow: "#4CAF50",
          challenge: "#F59E0B",
          block: "#DC2626",
        },
      },
    },
  },
  plugins: [],
};
export default config;
