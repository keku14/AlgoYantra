import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  GraduationCap,
  LogIn,
  UserPlus,
  Users,
  UserCircle2,
} from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AuthForm from "../components/AuthForm.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const featurePanels = [
  {
    eyebrow: "Teacher",
    title: "Teach with structure",
    description: "Create assignments, explain tree operations visually, and track class progress with clarity.",
    icon: GraduationCap,
    accent: "from-indigo-500/30 via-blue-500/10 to-cyan-400/10",
  },
  {
    eyebrow: "Student",
    title: "Learn by seeing",
    description: "Practice tree problems hands-on with guided visuals and immediate understanding of what changed.",
    icon: Users,
    accent: "from-cyan-400/30 via-sky-500/10 to-indigo-500/10",
  },
];

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login, signup } = useAuth();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!profileOpen) {
        return;
      }

      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [profileOpen]);

  if (user) {
    return <Navigate to={user.role === "teacher" ? "/teacher" : "/student"} replace />;
  }

  async function handleSubmit(form) {
    try {
      setLoading(true);
      const account =
        mode === "login"
          ? await login({
              email: form.email,
              password: form.password,
              role: form.role,
            })
          : await signup(form);

      toast.success(mode === "login" ? "Welcome back." : "Account created.");
      navigate(location.state?.from || (account.role === "teacher" ? "/teacher" : "/student"), {
        replace: true,
      });
    } catch (error) {
      const message = error.response?.data?.message
        || (error.request
          ? "Server unavailable. Start the backend and check the MongoDB connection."
          : "Authentication failed.");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AnimatePresence>
          {profileOpen ? (
            <motion.button
              key="profile-backdrop"
              type="button"
              aria-label="Close profile panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={() => setProfileOpen(false)}
              className="fixed inset-0 z-10 bg-slate-950/28 backdrop-blur-md light:bg-slate-900/10"
            />
          ) : null}
        </AnimatePresence>

        <div className="mb-6 flex items-start justify-end gap-3">
          <div ref={profileRef} className="relative z-20">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setProfileOpen((current) => !current);
                }}
                className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-slate-950/75 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_40px_-28px_rgba(15,23,42,0.95)] backdrop-blur-xl transition hover:border-cyan-400/35 hover:bg-slate-900/85 light:border-indigo-200 light:bg-[linear-gradient(180deg,rgba(238,242,255,0.98),rgba(232,240,255,0.96))] light:text-slate-700 light:shadow-[0_18px_40px_-30px_rgba(99,102,241,0.16)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 text-white light:border light:border-slate-200 light:bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] light:text-indigo-600">
                  <UserCircle2 className="h-5 w-5" />
                </span>
                <span className="text-left">
                  <span className="block text-[0.65rem] uppercase tracking-[0.22em] text-slate-400 light:text-slate-500">
                    Profile
                  </span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform light:text-slate-400 ${
                    profileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            <AnimatePresence>
              {profileOpen ? (
                <motion.section
                  initial={{ opacity: 0, y: -12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="absolute right-0 top-[calc(100%+0.9rem)] w-[min(24rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] rounded-[1.8rem] border border-white/10 bg-slate-950/88 p-5 shadow-[0_30px_90px_-46px_rgba(15,23,42,1)] backdrop-blur-2xl light:border-sky-100 light:bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,249,255,0.96))] light:shadow-[0_30px_90px_-46px_rgba(59,130,246,0.18)]"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 text-white shadow-glow light:border-sky-100 light:from-sky-100 light:via-cyan-50 light:to-indigo-100 light:text-indigo-600 light:shadow-none">
                        {mode === "login" ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-500 light:text-slate-500">
                          Profile Access
                        </p>
                        <h2 className="mt-1 font-display text-xl font-bold text-white light:text-slate-900">
                          {mode === "login" ? "Welcome back" : "Create profile"}
                        </h2>
                      </div>
                    </div>

                    <ThemeToggle />
                  </div>

                  <AuthForm key={mode} mode={mode} loading={loading} onSubmit={handleSubmit} />

                  <div className="mt-5 text-center text-sm text-slate-400 light:text-slate-600">
                    {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                    <button
                      type="button"
                      onClick={() => setMode(mode === "login" ? "signup" : "login")}
                      className="font-semibold text-cyan-300 transition hover:text-cyan-200 light:text-indigo-600 light:hover:text-indigo-500"
                    >
                      {mode === "login" ? "Sign up" : "Log in"}
                    </button>
                  </div>
                </motion.section>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <section className="glass-panel section-gradient relative overflow-hidden px-6 py-14 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.16),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12),transparent_28%)]" />
          <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300/80 light:text-indigo-600">
              AlgoYantra
            </p>
            <h1 className="mt-6 font-display text-5xl font-extrabold tracking-[-0.08em] text-white sm:text-6xl lg:text-7xl light:text-slate-900">
              AlgoYantra
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg light:text-slate-600">
              Visual tree learning for modern classrooms.
            </p>

            <div className="mt-12 grid w-full gap-5 md:grid-cols-2">
              {featurePanels.map((panel, index) => {
                const Icon = panel.icon;

                return (
                  <motion.div
                    key={panel.eyebrow}
                    initial={{ opacity: 0, y: 22, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.45, delay: 0.1 * index }}
                    className={`rounded-[1.8rem] border border-white/10 bg-gradient-to-br ${panel.accent} p-[1px] shadow-[0_20px_70px_-40px_rgba(56,189,248,0.45)] light:border-slate-200`}
                  >
                    <div className="rounded-[1.72rem] bg-slate-950/88 px-6 py-7 text-left light:bg-white/94">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 light:bg-slate-100">
                          <Icon className="h-5 w-5 text-cyan-200 light:text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400 light:text-slate-500">
                            {panel.eyebrow}
                          </p>
                          <h2 className="mt-1 text-xl font-semibold text-white light:text-slate-900">
                            {panel.title}
                          </h2>
                        </div>
                      </div>
                      <p className="mt-5 text-sm leading-7 text-slate-300 light:text-slate-600">
                        {panel.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
