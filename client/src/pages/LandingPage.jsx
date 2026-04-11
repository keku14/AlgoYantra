import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  CircleUserRound,
  LogIn,
  MoonStar,
  Sparkles,
  SunMedium,
  UserPlus,
} from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AuthForm from "../components/AuthForm.jsx";
import SiteBrand from "../components/SiteBrand.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const graphNodes = [
  { id: "root", label: "7", left: "26%", top: "34%", size: "h-12 w-12" },
  { id: "left", label: "0", left: "14%", top: "46%", size: "h-10 w-10" },
  { id: "right", label: "7", left: "39%", top: "45%", size: "h-10 w-10" },
  { id: "left-left", label: "0", left: "7%", top: "60%", size: "h-9 w-9" },
  { id: "left-right", label: "0", left: "21%", top: "60%", size: "h-9 w-9" },
  { id: "right-left", label: "7", left: "32%", top: "61%", size: "h-9 w-9" },
  { id: "right-right", label: "0", left: "47%", top: "61%", size: "h-9 w-9" },
];

const graphEdges = [
  { from: { x: "28%", y: "39%" }, to: { x: "17%", y: "49%" } },
  { from: { x: "29%", y: "39%" }, to: { x: "41%", y: "48%" } },
  { from: { x: "16%", y: "51%" }, to: { x: "9%", y: "61%" } },
  { from: { x: "18%", y: "51%" }, to: { x: "23%", y: "61%" } },
  { from: { x: "40%", y: "50%" }, to: { x: "34%", y: "62%" } },
  { from: { x: "42%", y: "50%" }, to: { x: "49%", y: "62%" } },
];

function GridGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_34%,rgba(77,255,238,0.26),transparent_16%),radial-gradient(circle_at_80%_74%,rgba(77,255,238,0.18),transparent_14%),radial-gradient(circle_at_58%_54%,rgba(77,255,238,0.14),transparent_20%)] light:bg-[radial-gradient(circle_at_68%_34%,rgba(67,226,219,0.22),transparent_16%),radial-gradient(circle_at_80%_74%,rgba(67,226,219,0.14),transparent_14%),radial-gradient(circle_at_58%_54%,rgba(67,226,219,0.1),transparent_20%)]" />
      <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(80,255,234,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(80,255,234,0.08)_1px,transparent_1px)] [background-size:120px_120px] light:opacity-35 light:[background-image:linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px)]" />
    </div>
  );
}

function TreeBoard() {
  return (
    <div className="relative ml-auto w-full max-w-[34rem]">
      <motion.div
        initial={{ opacity: 0, x: 32, y: 18, rotate: -7, scale: 0.96 }}
        animate={{ opacity: 1, x: 0, y: 0, rotate: -10, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-20 ml-auto aspect-[1.28] w-[85%] rounded-[2rem] border border-cyan-300/20 bg-[linear-gradient(160deg,rgba(16,22,43,0.96),rgba(21,31,58,0.92))] shadow-[0_0_80px_-18px_rgba(74,255,235,0.45),0_28px_70px_-34px_rgba(0,0,0,0.8)] light:border-slate-300/80 light:bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(245,248,252,0.96))] light:shadow-[0_0_70px_-14px_rgba(45,212,191,0.36),0_28px_70px_-38px_rgba(148,163,184,0.55)]"
      >
        <div className="absolute inset-0 rounded-[2rem] border border-white/5 light:border-slate-300/70" />
        <div className="absolute inset-y-0 left-0 w-14 rounded-l-[2rem] border-r border-white/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] light:border-slate-200 light:bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,249,253,0.84))]">
          <div className="flex h-full flex-col items-center gap-4 pt-6 text-slate-500 light:text-slate-300">
            <div className="h-8 w-8 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 light:border-sky-200 light:bg-sky-100" />
            <div className="h-3 w-3 rounded-full bg-slate-700 light:bg-slate-300" />
            <div className="h-3 w-3 rounded-full bg-slate-700 light:bg-slate-300" />
            <div className="h-3 w-3 rounded-full bg-slate-700 light:bg-slate-300" />
            <div className="mt-auto mb-5 h-3 w-3 rounded-full bg-slate-700 light:bg-slate-300" />
          </div>
        </div>

        <div className="absolute left-14 right-0 top-0 h-12 border-b border-white/5 px-5 light:border-slate-200">
          <div className="flex h-full items-center justify-between">
            <p className="text-xs font-semibold tracking-[0.18em] text-slate-300/80 light:text-slate-700">Binary Tree</p>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-300/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-cyan-300/80" />
            </div>
          </div>
        </div>

        <div className="absolute inset-x-16 bottom-10 top-16">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {graphEdges.map((edge, index) => (
              <line
                key={`${edge.from.x}-${edge.to.x}`}
                x1={edge.from.x}
                y1={edge.from.y}
                x2={edge.to.x}
                y2={edge.to.y}
                stroke="rgba(115,255,241,0.52)"
                strokeWidth="0.6"
                strokeLinecap="round"
                opacity={0.9 - index * 0.08}
              />
            ))}
          </svg>

          {graphNodes.map((node, index) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.08, duration: 0.35 }}
              className={`absolute ${node.size} flex items-center justify-center rounded-full border border-cyan-200/35 bg-cyan-300/10 text-sm font-semibold text-cyan-50 shadow-[0_0_24px_rgba(76,255,239,0.34)] backdrop-blur-sm light:border-slate-400/80 light:bg-white/80 light:text-slate-800 light:shadow-[0_8px_24px_-18px_rgba(15,23,42,0.35)]`}
              style={{ left: node.left, top: node.top }}
            >
              <div className="absolute inset-1 rounded-full border border-cyan-100/15 light:border-slate-300/70" />
              <span className="relative z-10">{node.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30, x: -8, rotate: -12 }}
        animate={{ opacity: 1, y: 0, x: 0, rotate: -10 }}
        transition={{ duration: 0.65, delay: 0.15, ease: "easeOut" }}
        className="absolute bottom-1 left-[6%] z-10 w-44 rounded-[1.4rem] border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(20,28,50,0.95),rgba(15,21,40,0.92))] p-3 shadow-[0_18px_40px_-26px_rgba(0,0,0,0.75)] light:border-slate-300/80 light:bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(246,249,253,0.94))] light:shadow-[0_24px_48px_-34px_rgba(100,116,139,0.45)]"
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-slate-300/80 light:text-slate-600">Tree stats</p>
          <Sparkles className="h-3.5 w-3.5 text-cyan-200 light:text-sky-500" />
        </div>
        <div className="space-y-2">
          <div className="h-12 rounded-2xl bg-[linear-gradient(180deg,rgba(13,19,36,0.96),rgba(17,25,44,0.84))] p-2 light:bg-[linear-gradient(180deg,rgba(245,248,252,0.98),rgba(239,244,249,0.92))]">
            <svg viewBox="0 0 100 30" className="h-full w-full">
              <path d="M0 22 C12 8, 22 9, 34 20 S58 28, 68 18 S83 7, 100 15" fill="none" stroke="rgba(103,232,249,0.95)" strokeWidth="2.5" strokeLinecap="round" className="light:stroke-[#111827]" />
            </svg>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 26, y: -12, rotate: 14 }}
        animate={{ opacity: 1, x: 0, y: 0, rotate: 13 }}
        transition={{ duration: 0.65, delay: 0.2, ease: "easeOut" }}
        className="absolute right-0 top-5 z-30 w-52 rounded-[1.3rem] border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(20,28,50,0.95),rgba(15,21,40,0.92))] p-3 shadow-[0_18px_40px_-26px_rgba(0,0,0,0.75)] light:border-slate-300/80 light:bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(246,249,253,0.94))] light:shadow-[0_24px_48px_-34px_rgba(100,116,139,0.45)]"
      >
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-slate-300/80 light:text-slate-600">Assignments</p>
        <div className="mt-3 space-y-2">
          {["AVL Exploration", "RB Tree Repair", "Binary Basics"].map((item, index) => (
            <div key={item} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 light:border-slate-200 light:bg-slate-50">
              <span className="text-[0.72rem] text-slate-200 light:text-slate-700">{item}</span>
              <span className={`rounded-full px-2 py-0.5 text-[0.55rem] font-semibold ${index === 0 ? "bg-cyan-400/15 text-cyan-200" : "bg-emerald-400/15 text-emerald-200"}`}>
                {index === 0 ? "Pending" : "Live"}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 18, y: 34, rotate: 10 }}
        animate={{ opacity: 1, x: 0, y: 0, rotate: 8 }}
        transition={{ duration: 0.65, delay: 0.3, ease: "easeOut" }}
        className="absolute bottom-6 right-[10%] z-20 w-40 rounded-[1.35rem] border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(20,28,50,0.95),rgba(15,21,40,0.92))] p-3 shadow-[0_18px_40px_-26px_rgba(0,0,0,0.75)] light:border-slate-300/80 light:bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(246,249,253,0.94))] light:shadow-[0_24px_48px_-34px_rgba(100,116,139,0.45)]"
      >
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-slate-300/80 light:text-slate-600">Student progress</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="relative h-14 w-14 rounded-full border border-cyan-300/25 bg-cyan-300/8 light:border-slate-300 light:bg-slate-50">
            <div className="absolute inset-2 rounded-full border-4 border-cyan-300/80 border-t-transparent light:border-sky-500 light:border-t-transparent" />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-cyan-100 light:text-slate-700">92%</div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-100 light:text-slate-800">Sheet completion</p>
            <p className="mt-1 text-[0.68rem] text-slate-400 light:text-slate-500">Topology and traversal</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LandingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login, signup } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mode, setMode] = useState("login");
  const [authRole, setAuthRole] = useState("teacher");
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

  function openProfile(nextMode, nextRole) {
    setMode(nextMode);
    setAuthRole(nextRole);
    setProfileOpen(true);
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
    <div className="relative min-h-screen overflow-hidden bg-[#070b1e] text-white light:bg-[#f4f6f8] light:text-slate-900">
      <GridGlow />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_63%_38%,rgba(89,255,237,0.22),transparent_14%),radial-gradient(circle_at_76%_44%,rgba(89,255,237,0.12),transparent_22%),linear-gradient(120deg,rgba(8,12,29,0.72),rgba(8,12,29,0.22)_42%,rgba(8,12,29,0.8))] light:bg-[radial-gradient(circle_at_63%_38%,rgba(95,240,227,0.18),transparent_14%),radial-gradient(circle_at_76%_44%,rgba(95,240,227,0.1),transparent_20%),linear-gradient(120deg,rgba(255,255,255,0.92),rgba(248,250,252,0.78)_42%,rgba(241,245,249,0.94))]" />
      <SiteBrand className="fixed left-5 top-5 z-30 sm:left-8 lg:left-10" />

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
            className="fixed inset-0 z-40 bg-slate-950/42 backdrop-blur-xl"
          />
        ) : null}
      </AnimatePresence>

      <div className={`relative z-10 px-5 pb-5 pt-24 transition-[filter,transform,opacity] duration-300 sm:px-8 sm:pt-28 lg:px-10 lg:pt-28 ${profileOpen ? "scale-[0.995] blur-[3px]" : ""}`}>
        <main className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-7xl items-center gap-10 lg:grid-cols-[1.02fr_1fr] lg:gap-6">
          <section className="max-w-3xl pb-8 pt-6 sm:pt-10 lg:pb-0 lg:pt-0">
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="text-sm font-semibold uppercase tracking-[0.26em] text-cyan-200/80 light:text-sky-700"
            >
              Visual tree learning
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="mt-4 text-5xl font-black leading-[0.94] tracking-[-0.06em] text-slate-100 light:text-slate-900 sm:text-6xl lg:text-[5rem]"
            >
              Mastering Tree Data Structures Visually
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.16 }}
              className="mt-10 flex max-w-md flex-col gap-4"
            >
              <button
                type="button"
                onClick={() => openProfile("login", "teacher")}
                className="rounded-full border border-cyan-200/35 bg-[linear-gradient(180deg,rgba(33,99,127,0.78),rgba(25,72,94,0.9))] px-7 py-4 text-lg font-semibold text-white shadow-[0_0_0_1px_rgba(128,255,246,0.08)_inset,0_14px_40px_-24px_rgba(50,255,233,0.65)] hover:border-cyan-200/55 light:border-sky-300 light:bg-[linear-gradient(180deg,#2380dc,#0f69cb)] light:shadow-[0_18px_36px_-24px_rgba(37,99,235,0.5)]"
              >
                Explore Teacher Tools
              </button>
              <button
                type="button"
                onClick={() => openProfile("login", "student")}
                className="rounded-full border border-cyan-200/35 bg-[linear-gradient(180deg,rgba(30,89,117,0.74),rgba(21,62,82,0.9))] px-7 py-4 text-lg font-semibold text-white shadow-[0_0_0_1px_rgba(128,255,246,0.08)_inset,0_14px_40px_-24px_rgba(50,255,233,0.55)] hover:border-cyan-200/55 light:border-sky-300 light:bg-[linear-gradient(180deg,#2380dc,#0f69cb)] light:shadow-[0_18px_36px_-24px_rgba(37,99,235,0.5)]"
              >
                Explore Student Workspace
              </button>
            </motion.div>
          </section>

          <section className="relative hidden min-h-[34rem] items-center justify-end lg:flex">
            <div className="absolute right-10 top-8 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl light:bg-cyan-200/50" />
            <div className="absolute bottom-8 right-24 h-56 w-56 rounded-full bg-emerald-300/10 blur-3xl light:bg-teal-200/40" />
            <TreeBoard />
          </section>
        </main>
      </div>

      <div ref={profileRef} className="fixed right-5 top-5 z-50 flex items-center gap-3 sm:right-8 lg:right-10">
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 backdrop-blur-xl hover:border-cyan-300/40 hover:bg-white/10 light:border-slate-300 light:bg-white/80 light:text-slate-700 light:shadow-[0_18px_36px_-30px_rgba(100,116,139,0.4)]"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <SunMedium size={17} /> : <MoonStar size={17} />}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setAuthRole("teacher");
            setProfileOpen((current) => !current);
          }}
          className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(18,25,49,0.92),rgba(11,17,37,0.92))] px-3 py-2 text-left shadow-[0_16px_40px_-28px_rgba(15,23,42,0.95)] backdrop-blur-xl hover:border-cyan-300/35 light:border-slate-300 light:bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,247,251,0.96))] light:shadow-[0_18px_36px_-30px_rgba(100,116,139,0.4)]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4b73ff,#37d7ff)] text-white light:bg-[linear-gradient(135deg,#f8fafc,#eef2f7)] light:text-slate-700 light:border light:border-slate-300">
            <CircleUserRound className="h-5 w-5" />
          </span>
          <span className="hidden sm:block">
            <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-slate-400 light:text-slate-500">
              Profile
            </span>
          </span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform light:text-slate-500 ${profileOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {profileOpen ? (
            <motion.section
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="absolute right-0 top-[calc(100%+0.9rem)] z-50 w-[min(24rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] rounded-[1.8rem] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(11,18,36,0.98),rgba(10,15,30,0.98))] p-5 shadow-[0_30px_90px_-46px_rgba(15,23,42,1)] backdrop-blur-2xl light:border-slate-300 light:bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(245,247,251,0.99))] light:shadow-[0_30px_90px_-46px_rgba(148,163,184,0.45)]"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 text-white shadow-[0_0_34px_-12px_rgba(56,189,248,0.8)]">
                    {mode === "login" ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Profile Access
                    </p>
                    <h2 className="mt-1 font-display text-xl font-bold text-white light:text-slate-900">
                      {mode === "login" ? "Welcome back" : "Create profile"}
                    </h2>
                  </div>
                </div>
              </div>

              <AuthForm
                key={`${mode}-${authRole}`}
                mode={mode}
                loading={loading}
                onSubmit={handleSubmit}
                initialRole={authRole}
              />

              <div className="mt-5 text-center text-sm text-slate-400 light:text-slate-600">
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="font-semibold text-cyan-300 transition hover:text-cyan-200 light:text-sky-600 light:hover:text-sky-500"
                >
                  {mode === "login" ? "Sign up" : "Log in"}
                </button>
              </div>
            </motion.section>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
