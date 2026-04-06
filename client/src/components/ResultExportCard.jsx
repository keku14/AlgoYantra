import { useRef } from "react";
import { Download } from "lucide-react";

import { exportElementToPdf } from "../utils/pdf.js";
import SectionCard from "./SectionCard.jsx";
import TreeVisualizer from "./TreeVisualizer.jsx";

export default function ResultExportCard({ assignment, evaluation }) {
  const exportRef = useRef(null);

  if (!evaluation) {
    return null;
  }

  return (
    <SectionCard
      title="Result snapshot"
      eyebrow="Assessment feedback"
      actions={
        <button
          type="button"
          onClick={() =>
            exportElementToPdf(
              exportRef.current,
              `algoyantra-${assignment?.title?.toLowerCase().replace(/\s+/g, "-") || "result"}.pdf`,
            )
          }
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-100 light:border-slate-200 light:text-slate-800"
        >
          <Download size={16} />
          Export PDF
        </button>
      }
    >
      <div ref={exportRef} className="space-y-5 rounded-[2rem] bg-slate-950/25 p-4 light:bg-slate-50">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">Score</p>
            <div className="mt-2 font-display text-4xl font-bold text-white light:text-slate-900">
              {evaluation.score}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">Mistakes</p>
            <div className="mt-2 text-lg font-semibold text-white light:text-slate-900">
              {evaluation.mistakes.length}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">Suggestions</p>
            <div className="mt-2 text-lg font-semibold text-white light:text-slate-900">
              {evaluation.suggestions.length}
            </div>
          </div>
        </div>

        <TreeVisualizer tree={evaluation.correctTree} height={320} />

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.5rem] border border-rose-300/15 bg-rose-500/10 p-4">
            <p className="text-sm font-semibold text-rose-100 light:text-rose-700">Mistake breakdown</p>
            <div className="mt-3 space-y-2">
              {evaluation.mistakes.map((mistake) => (
                <div key={mistake} className="rounded-2xl bg-slate-950/25 px-3 py-2 text-sm text-slate-200 light:bg-white light:text-slate-700">
                  {mistake}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-emerald-300/15 bg-emerald-500/10 p-4">
            <p className="text-sm font-semibold text-emerald-100 light:text-emerald-700">
              Suggested corrections
            </p>
            <div className="mt-3 space-y-2">
              {evaluation.suggestions.map((suggestion) => (
                <div key={suggestion} className="rounded-2xl bg-slate-950/25 px-3 py-2 text-sm text-slate-200 light:bg-white light:text-slate-700">
                  {suggestion}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
