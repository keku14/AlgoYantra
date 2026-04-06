import plugin from "tailwindcss/plugin";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 20px 48px -26px rgba(79, 70, 229, 0.28)",
        glass: "0 24px 70px -34px rgba(15, 23, 42, 0.36)",
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at top right, rgba(99, 102, 241, 0.18), transparent 34%), radial-gradient(circle at top left, rgba(56, 189, 248, 0.1), transparent 28%), radial-gradient(circle at bottom, rgba(129, 140, 248, 0.14), transparent 34%)",
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant("light", ".light &");
    }),
  ],
};
