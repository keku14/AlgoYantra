import { Link } from "react-router-dom";
import { BookOpenCheck, BrainCircuit, RadioTower, Trophy } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: BrainCircuit,
    title: "Real tree algorithms",
    description: "BST, AVL, Red-Black, and Binary Tree logic are evaluated with real invariants and operation simulation.",
  },
  {
    icon: RadioTower,
    title: "Live classroom mode",
    description: "Teachers can broadcast edits, highlight nodes, animate traversals, and run quick polls in real time.",
  },
  {
    icon: Trophy,
    title: "Gamified student loop",
    description: "XP, levels, streaks, leaderboards, and mistake-aware feedback keep practice engaging and measurable.",
  },
  {
    icon: BookOpenCheck,
    title: "Visual lesson delivery",
    description: "Interactive lessons combine structured explanations with dynamic D3 tree rendering and step playback.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="glass-panel section-gradient overflow-hidden p-6 sm:p-10">
          <div className="grid gap-10 xl:grid-cols-[1.08fr,0.92fr] xl:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
                DSA Tree Learning & Assessment Platform
              </p>
              <h1 className="mt-4 max-w-4xl font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl light:text-slate-900">
                AlgoYantra turns tree data structures into a live, teachable, and testable experience.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 light:text-slate-700">
                Learn with motion-rich visualizations, practice with real insert/delete/traversal logic, and assess with flexible invariant-based grading instead of brittle static answers.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/auth"
                  className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 font-semibold text-slate-950 shadow-glow"
                >
                  Launch platform
                </Link>
                <a
                  href="#features"
                  className="rounded-full border border-white/15 bg-white/10 px-6 py-3 font-semibold text-slate-100 light:border-slate-200 light:bg-white light:text-slate-900"
                >
                  Explore features
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-white/10 bg-white/8 p-5">
                <p className="text-sm text-slate-300 light:text-slate-700">Teacher demo</p>
                <div className="mt-3 font-display text-xl font-bold text-white light:text-slate-900">
                  teacher@algoyantra.dev
                </div>
                <p className="mt-1 text-sm text-cyan-200 light:text-cyan-700">Teach123!</p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-white/8 p-5">
                <p className="text-sm text-slate-300 light:text-slate-700">Student demo</p>
                <div className="mt-3 font-display text-xl font-bold text-white light:text-slate-900">
                  student@algoyantra.dev
                </div>
                <p className="mt-1 text-sm text-cyan-200 light:text-cyan-700">Learn123!</p>
              </div>
              <div className="rounded-[2rem] border border-emerald-300/15 bg-emerald-500/10 p-5 sm:col-span-2">
                <p className="text-sm text-emerald-100 light:text-emerald-700">
                  Built as a workspace MERN application with JWT auth, Socket.IO live sessions, MongoDB persistence, and shared algorithm logic between client and server.
                </p>
              </div>
            </div>
          </div>
        </header>

        <section id="features" className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="glass-panel p-6"
            >
              <div className="mb-4 inline-flex rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 p-3 text-slate-950">
                <feature.icon size={22} />
              </div>
              <h2 className="font-display text-xl font-semibold text-white light:text-slate-900">
                {feature.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300 light:text-slate-700">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </section>
      </div>
    </div>
  );
}
