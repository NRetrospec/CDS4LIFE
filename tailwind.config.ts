import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#001934",
        "navy-ink": "#010307",
        sky: "#C4E2F3",
        teal: "#267874",
        forest: "#20442F",
        olive: "#939D5F",
        gold: "#E4D1A0",
        bronze: "#7B6A36",
        paper: "#F9FAF9",
        mist: "#E4EBEE",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: { soft: "0 18px 50px rgba(0,25,52,.18)" },
      borderRadius: { card: "22px" },
    },
  },
  plugins: [],
};
export default config;
