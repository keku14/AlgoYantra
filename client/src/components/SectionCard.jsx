import clsx from "clsx";
import { motion } from "framer-motion";

export default function SectionCard({
  title,
  eyebrow,
  leadingAction,
  actions,
  children,
  className,
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={clsx("glass-panel section-gradient p-6 md:p-7", className)}
    >
      {(title || eyebrow || actions || leadingAction) && (
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            {leadingAction ? <div className="shrink-0">{leadingAction}</div> : null}
            <div className="space-y-1">
              {eyebrow ? (
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-indigo-300/85 light:text-indigo-600">
                  {eyebrow}
                </p>
              ) : null}
              {title ? (
                <h2 className="font-display text-xl font-semibold text-slate-100 light:text-slate-900">
                  {title}
                </h2>
              ) : null}
            </div>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      )}
      {children}
    </motion.section>
  );
}
