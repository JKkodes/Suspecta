/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0F1420",
          light: "#171D2E",
          lighter: "#232B40",
        },
        brick: {
          DEFAULT: "#B33A3A",
          light: "#CC5A4E",
          dark: "#8A2C2C",
        },
        cream: {
          DEFAULT: "#F1E9DC",
          dim: "#C9BFAE",
        },
        signal: {
          safe: "#5FA777",
          low: "#8FB84E",
          moderate: "#D9A441",
          high: "#CC5A4E",
          danger: "#B33A3A",
        },
      },
      fontFamily: {
        display: ["'Special Elite'", "'Courier New'", "monospace"],
        body: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      backgroundImage: {
        "case-texture":
          "radial-gradient(circle at 20% 20%, rgba(241,233,220,0.04) 0, transparent 45%), radial-gradient(circle at 80% 60%, rgba(179,58,58,0.06) 0, transparent 50%)",
      },
    },
  },
  plugins: [],
};
