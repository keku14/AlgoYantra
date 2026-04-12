export default function ClassroomSwitcher({
  activeClassroom,
}) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 light:border-slate-200 light:bg-white light:text-slate-800">
      <span className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 sm:inline light:text-slate-500">
        Classroom
      </span>
      <span className="min-w-[180px] truncate text-sm font-medium">
        {activeClassroom?.name || "Select classroom"}
      </span>
    </div>
  );
}
