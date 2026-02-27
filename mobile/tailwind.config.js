/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#0a0f1c",
        accent: "#3b82f6",
        "accent-light": "#60a5fa",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        muted: "#6b7280",
        "surface": "#f8fafc",
        "surface-dark": "#1e293b",
      },
    },
  },
  plugins: [],
};
