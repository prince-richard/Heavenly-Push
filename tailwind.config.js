/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1E40AF",
          light: "#3B82F6",
          dark: "#1E3A8A",
        },
        accent: {
          DEFAULT: "#F59E0B",
          light: "#FCD34D",
          dark: "#D97706",
        },
        hc: {
          bg: "#000000",
          text: "#FFFFFF",
          accent: "#FFD700",
          link: "#00BFFF",
          error: "#FF6B6B",
          success: "#00FF7F",
          border: "#FFFFFF",
        },
        hcLight: {
          bg: "#FFFFFF",
          text: "#000000",
          accent: "#B8860B",
          link: "#0000EE",
          error: "#CC0000",
          success: "#006400",
          border: "#000000",
        },
      },
      spacing: {
        "touch": "44px",
      },
      fontSize: {
        "accessible-sm": ["16px", "24px"],
        "accessible-base": ["18px", "28px"],
        "accessible-lg": ["22px", "32px"],
        "accessible-xl": ["26px", "36px"],
        "accessible-2xl": ["32px", "42px"],
      },
    },
  },
  plugins: [],
};
