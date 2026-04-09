import clsx from "clsx";
import { motion } from "framer-motion";

export default function StatCard({ icon: Icon, label, value, helper, tone = "cyan" }) {
  const toneMap = {
    cyan: "from-sky-500/18 via-indigo-500/12 to-slate-900/0 border-sky-300/18 text-sky-100 light:text-sky-700",
    emerald: "from-emerald-500/18 via-cyan-500/10 to-slate-900/0 border-emerald-300/18 text-emerald-100 light:text-emerald-700",
    amber: "from-amber-500/18 via-orange-500/10 to-slate-900/0 border-amber-300/18 text-amber-100 light:text-amber-700",
    rose: "from-fuchsia-500/18 via-rose-500/10 to-slate-900/0 border-rose-300/18 text-rose-100 light:text-rose-700",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "rounded-[1.25rem] border bg-gradient-to-br p-5 shadow-glow backdrop-blur-lg",
        toneMap[tone],
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-200/80 light:text-slate-600">{label}</span>
        <div className="rounded-2xl border border-white/10 bg-white/10 p-2 shadow-sm light:border-slate-200 light:bg-white/90">
          <Icon size={18} />
        </div>
      </div>
      <div className="font-display text-3xl font-bold tracking-[-0.04em] text-white light:text-slate-900">{value}</div>
      {helper ? (
        <p className="mt-2 text-sm leading-6 text-slate-300/80 light:text-slate-600">{helper}</p>
      ) : null}
    </motion.div>
  );
}
