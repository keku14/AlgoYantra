import clsx from "clsx";
import { motion } from "framer-motion";

export default function StatCard({ icon: Icon, label, value, helper, tone = "cyan" }) {
  const toneMap = {
    cyan: "from-cyan-500/20 to-sky-500/10 border-cyan-300/20 text-cyan-100",
    emerald: "from-emerald-500/20 to-teal-500/10 border-emerald-300/20 text-emerald-100",
    amber: "from-amber-500/20 to-orange-500/10 border-amber-300/20 text-amber-100",
    rose: "from-rose-500/20 to-pink-500/10 border-rose-300/20 text-rose-100",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "rounded-3xl border bg-gradient-to-br p-5 shadow-glow backdrop-blur-lg",
        toneMap[tone],
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-200/80 light:text-slate-700">{label}</span>
        <div className="rounded-2xl border border-white/10 bg-white/10 p-2 light:border-slate-200 light:bg-white">
          <Icon size={18} />
        </div>
      </div>
      <div className="font-display text-3xl font-bold text-white light:text-slate-900">{value}</div>
      {helper ? (
        <p className="mt-2 text-sm text-slate-300/85 light:text-slate-700">{helper}</p>
      ) : null}
    </motion.div>
  );
}
