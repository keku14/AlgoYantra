import { MoonStar, SunMedium } from "lucide-react";

import { useTheme } from "../context/ThemeContext.jsx";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-slate-100 transition hover:border-indigo-300/40 hover:bg-white/15 dark:text-slate-100 light:border-slate-200 light:bg-white light:text-slate-900"
    >
      {isDark ? <SunMedium size={16} /> : <MoonStar size={16} />}
    </button>
  );
}
