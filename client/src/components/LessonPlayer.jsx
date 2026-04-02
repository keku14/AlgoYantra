import { useEffect, useState } from "react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";

import SectionCard from "./SectionCard.jsx";
import TreeVisualizer from "./TreeVisualizer.jsx";

export default function LessonPlayer({ lesson }) {
  const steps = lesson?.visualizationData?.steps || [];
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [lesson?._id]);

  useEffect(() => {
    if (!playing || !steps.length) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => {
        if (current >= steps.length - 1) {
          setPlaying(false);
          return current;
        }

        return current + 1;
      });
    }, 1400);

    return () => window.clearInterval(timer);
  }, [playing, steps.length]);

  if (!lesson) {
    return (
      <SectionCard title="Interactive lesson">
        <div className="rounded-[2rem] border border-dashed border-white/15 p-8 text-center text-slate-400 light:border-slate-300 light:text-slate-600">
          Pick a lesson to begin.
        </div>
      </SectionCard>
    );
  }

  const activeStep = steps[index] || {
    tree: lesson.visualizationData?.tree || null,
    highlights: [],
    description: lesson.summary,
  };

  const maxIndex = Math.max(0, steps.length - 1);

  return (
    <SectionCard
      title={lesson.title}
      eyebrow={`${lesson.type} • ${lesson.difficulty}`}
      actions={
        <>
          <button
            type="button"
            onClick={() => setIndex((current) => Math.max(0, current - 1))}
            className="rounded-full border border-white/10 p-2 text-slate-200 light:border-slate-200 light:text-slate-700"
          >
            <SkipBack size={16} />
          </button>
          <button
            type="button"
            onClick={() => setPlaying((current) => !current)}
            className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 p-2 text-slate-950"
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            type="button"
            onClick={() => setIndex((current) => Math.min(maxIndex, current + 1))}
            className="rounded-full border border-white/10 p-2 text-slate-200 light:border-slate-200 light:text-slate-700"
          >
            <SkipForward size={16} />
          </button>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="space-y-4">
          <p className="text-sm leading-7 text-slate-300 light:text-slate-700">{lesson.summary}</p>
          <TreeVisualizer tree={activeStep.tree} highlights={activeStep.highlights} height={380} />
          <div className="rounded-[2rem] border border-cyan-300/10 bg-cyan-400/10 p-4 text-sm text-cyan-50 light:text-cyan-800">
            {activeStep.description || "Use the step controls to inspect the algorithm animation."}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 light:border-slate-200 light:bg-white">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Lesson content
            </p>
            <div className="mt-4 space-y-4">
              {(lesson.content || []).map((section) => (
                <div key={section.heading} className="rounded-2xl bg-slate-950/30 p-4 light:bg-slate-50">
                  <h4 className="font-display text-lg font-semibold text-white light:text-slate-900">
                    {section.heading}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-slate-300 light:text-slate-700">
                    {section.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 light:border-slate-200 light:bg-white">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Step timeline
            </p>
            <div className="mt-4 space-y-3">
              {(steps.length ? steps : [activeStep]).map((step, stepIndex) => (
                <button
                  key={step.id || `${lesson._id}-${stepIndex}`}
                  type="button"
                  onClick={() => setIndex(stepIndex)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    stepIndex === index
                      ? "border-cyan-300/50 bg-cyan-400/10 text-cyan-100"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-700"
                  }`}
                >
                  Step {stepIndex + 1}: {step.description || "Snapshot"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
