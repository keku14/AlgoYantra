import plugin from "tailwindcss/plugin";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["IBM Plex Sans", "sans-serif"],
      },
      boxShadow: {
        glow: "0 20px 45px -20px rgba(14, 165, 233, 0.45)",
        glass: "0 20px 50px -25px rgba(15, 23, 42, 0.55)",
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at top right, rgba(56, 189, 248, 0.35), transparent 35%), radial-gradient(circle at top left, rgba(251, 191, 36, 0.25), transparent 30%), radial-gradient(circle at bottom, rgba(99, 102, 241, 0.25), transparent 35%)",
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant("light", ".light &");
    }),
  ],
};
