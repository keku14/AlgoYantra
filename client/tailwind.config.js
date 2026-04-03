import plugin from "tailwindcss/plugin";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Manrope", "sans-serif"],
      },
      boxShadow: {
        glow: "0 18px 50px -24px rgba(143, 199, 194, 0.28)",
        glass: "0 22px 64px -32px rgba(18, 28, 40, 0.44)",
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at top right, rgba(143, 199, 194, 0.18), transparent 34%), radial-gradient(circle at top left, rgba(183, 197, 206, 0.12), transparent 28%), radial-gradient(circle at bottom, rgba(122, 137, 168, 0.14), transparent 34%)",
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant("light", ".light &");
    }),
  ],
};
