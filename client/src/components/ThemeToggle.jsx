import { MoonStar, SunMedium } from "lucide-react";

import { useTheme } from "../context/ThemeContext.jsx";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-300/40 hover:bg-white/15 dark:text-slate-100 light:border-slate-200 light:bg-white light:text-slate-900"
    >
      {isDark ? <SunMedium size={16} /> : <MoonStar size={16} />}
      {isDark ? "Light" : "Dark"} mode
    </button>
  );
}
