import clsx from "clsx";
import { motion } from "framer-motion";

export default function SectionCard({
  title,
  eyebrow,
  actions,
  children,
  className,
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={clsx("glass-panel section-gradient p-6", className)}
    >
      {(title || eyebrow || actions) && (
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/85">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="font-display text-xl font-semibold text-white light:text-slate-900">
                {title}
              </h2>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      )}
      {children}
    </motion.section>
  );
}
