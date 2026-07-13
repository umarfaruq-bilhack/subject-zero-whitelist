/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0A0C08",
        rot: "#151A0F",
        toxic: "#9FEF00",
        toxicDim: "#5C8A00",
        wound: "#7A1F1F",
        bone: "#E8E4D8",
        murk: "#4A3728",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
      },
      backgroundImage: {
        scanlines:
          "repeating-linear-gradient(0deg, rgba(159,239,0,0.035) 0px, rgba(159,239,0,0.035) 1px, transparent 1px, transparent 3px)",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: 1 },
          "42%": { opacity: 1 },
          "43%": { opacity: 0.4 },
          "44%": { opacity: 1 },
          "89%": { opacity: 1 },
          "90%": { opacity: 0.6 },
          "91%": { opacity: 1 },
        },
        fill: {
          from: { width: "0%" },
        },
      },
      animation: {
        flicker: "flicker 6s infinite",
      },
    },
  },
  plugins: [],
};
