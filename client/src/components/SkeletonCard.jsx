export default function SkeletonCard() {
  return (
    <div className="glass-panel animate-pulse p-6">
      <div className="mb-4 h-4 w-28 rounded-full bg-white/12 light:bg-slate-200" />
      <div className="mb-3 h-8 w-3/4 rounded-2xl bg-white/8 light:bg-slate-200/80" />
      <div className="h-28 rounded-3xl bg-white/8 light:bg-slate-200/70" />
    </div>
  );
}
