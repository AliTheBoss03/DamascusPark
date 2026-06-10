import type { Config } from "tailwindcss";

// The neutral `slate` scale is redefined as CSS variables so the whole app
// themes between light and dark automatically (see app/globals.css). Brand
// colors (amber accent, zone red/yellow/green) are intentionally NOT themed.
const slate = {
  50: "hsl(var(--slate-50) / <alpha-value>)",
  100: "hsl(var(--slate-100) / <alpha-value>)",
  200: "hsl(var(--slate-200) / <alpha-value>)",
  300: "hsl(var(--slate-300) / <alpha-value>)",
  400: "hsl(var(--slate-400) / <alpha-value>)",
  500: "hsl(var(--slate-500) / <alpha-value>)",
  600: "hsl(var(--slate-600) / <alpha-value>)",
  700: "hsl(var(--slate-700) / <alpha-value>)",
  800: "hsl(var(--slate-800) / <alpha-value>)",
  900: "hsl(var(--slate-900) / <alpha-value>)",
  950: "hsl(var(--slate-950) / <alpha-value>)",
};

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        slate,
        zone: {
          red: "#ef4444",
          yellow: "#f59e0b",
          green: "#22c55e",
        },
        brand: {
          gold: "#d4a017",
          navy: "#0f172a",
          card: "#1e293b",
          border: "#334155",
        },
      },
      fontFamily: {
        sans: ["var(--font-cairo)", "Cairo", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Courier New", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ping-slow": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
