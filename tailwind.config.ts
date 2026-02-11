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
        navy: "#002e56",
        "sky-blue": "#79bde9",
        "dark-bg": "#0a0f1c",
        "dark-surface": "#111827",
        accent: "#79bde9",
      },
      fontFamily: {
        sans: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
      },
      letterSpacing: {
        wide: "0.025em",
        wider: "0.05em",
      },
    },
  },
  plugins: [],
};
export default config;
