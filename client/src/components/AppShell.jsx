import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Sparkles } from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

export default function AppShell({
  title,
  subtitle,
  user,
  tabs,
  activeTab,
  onTabChange,
  actions,
  hideHeader = false,
  children,
}) {
  const { logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const userInitial = String(user?.name || user?.email || "A").trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          {!hideHeader ? (
            <div className="flex items-center gap-3">
              <div className="rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-500 p-3 shadow-glow">
                <Sparkles className="text-slate-950" size={22} />
              </div>
              <div>
                <p className="font-display text-xl font-bold text-white light:text-slate-900">
                  AlgoYantra
                </p>
                <p className="text-sm text-slate-300 light:text-slate-600">
                  Tree learning cockpit
                </p>
              </div>
            </div>
          ) : (
            <div />
          )}

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((current) => !current)}
              className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-slate-100 transition hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-800"
              aria-label="Open profile menu"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 font-display text-sm font-bold text-slate-950">
                {userInitial}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-semibold">{user?.name}</span>
                <span className="block text-xs text-slate-400 light:text-slate-500">{user?.role}</span>
              </span>
              <ChevronDown size={18} />
            </button>

            {isProfileMenuOpen ? (
              <div className="glass-panel section-gradient absolute right-0 top-[calc(100%+0.75rem)] z-20 w-[300px] p-5 shadow-2xl">
                <div className="rounded-3xl border border-white/10 bg-white/8 p-4 light:border-slate-200 light:bg-white/70">
                  <p className="text-sm text-slate-300 light:text-slate-600">{user?.role}</p>
                  <h2 className="mt-1 font-display text-lg font-semibold text-white light:text-slate-900">
                    {user?.name}
                  </h2>
                  <p className="mt-2 text-sm text-slate-300 light:text-slate-600">{user?.email}</p>
                </div>

                <nav className="mt-4 space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        onTabChange(tab.id);
                        setIsProfileMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                        activeTab === tab.id
                          ? "bg-white text-slate-950 shadow-lg"
                          : "text-slate-200 hover:bg-white/10 light:text-slate-700 light:hover:bg-slate-100"
                      }`}
                    >
                      <tab.icon size={18} />
                      {tab.label}
                    </button>
                  ))}
                </nav>

                <div className="mt-4 space-y-3">
                  <ThemeToggle />
                  <button
                    type="button"
                    onClick={logout}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/15 light:border-slate-200 light:bg-white light:text-slate-900"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <main className="space-y-6">
          {!hideHeader ? (
            <header className="glass-panel section-gradient p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                    Production-ready Tree Platform
                  </p>
                  <h1 className="mt-2 font-display text-3xl font-bold text-white light:text-slate-900">
                    {title}
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 light:text-slate-700">
                    {subtitle}
                  </p>
                </div>
                {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
              </div>
            </header>
          ) : null}

          {children}
        </main>
      </div>
    </div>
  );
}
