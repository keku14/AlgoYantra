import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Check, ClipboardCopy, DoorOpen, GraduationCap, Plus, School, Search, Users, X } from "lucide-react";

import SectionCard from "./SectionCard.jsx";

function getClassroomMeta(classroom) {
  return [classroom?.institution, classroom?.section].filter(Boolean).join(" • ");
}

export default function ClassroomHub({
  role,
  classrooms,
  activeClassroom,
  onSwitchClassroom,
  onClearActiveClassroom,
  onCreateClassroom,
  onJoinClassroom,
  onLoadTeacherRoster,
  onUpdateClassroom,
  onDeleteClassroom,
  switchingClassroom = false,
  mutatingClassroom = false,
}) {
  const [teacherForm, setTeacherForm] = useState({
    name: "",
    institution: "",
    section: "",
  });
  const [studentCode, setStudentCode] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [selectedTeacherClassroomId, setSelectedTeacherClassroomId] = useState("");
  const [teacherRoster, setTeacherRoster] = useState([]);
  const [teacherRosterClassroom, setTeacherRosterClassroom] = useState(null);
  const [teacherRosterLoading, setTeacherRosterLoading] = useState(false);
  const [teacherClassroomSearch, setTeacherClassroomSearch] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const sortedClassrooms = useMemo(
    () => [...classrooms].sort((left, right) => String(left.name || "").localeCompare(String(right.name || ""))),
    [classrooms],
  );
  const filteredTeacherClassrooms = useMemo(() => {
    const normalized = teacherClassroomSearch.trim().toLowerCase();

    if (!normalized) {
      return sortedClassrooms;
    }

    return sortedClassrooms.filter((classroom) => (
      String(classroom.name || "").toLowerCase().includes(normalized)
      || String(classroom.code || "").toLowerCase().includes(normalized)
      || String(classroom.institution || "").toLowerCase().includes(normalized)
      || String(classroom.section || "").toLowerCase().includes(normalized)
    ));
  }, [sortedClassrooms, teacherClassroomSearch]);
  const filteredTeacherRoster = useMemo(() => {
    const normalized = teacherSearch.trim().toLowerCase();

    if (!normalized) {
      return teacherRoster;
    }

    return teacherRoster.filter((student) => (
      String(student.name || "").toLowerCase().includes(normalized)
      || String(student.email || "").toLowerCase().includes(normalized)
    ));
  }, [teacherRoster, teacherSearch]);

  useEffect(() => {
    if (role !== "teacher") {
      return;
    }

    if (activeClassroom?._id) {
      setSelectedTeacherClassroomId(String(activeClassroom._id));
      return;
    }

    if (
      selectedTeacherClassroomId
      && !sortedClassrooms.some((classroom) => String(classroom._id) === String(selectedTeacherClassroomId))
    ) {
      setSelectedTeacherClassroomId("");
      setTeacherRoster([]);
      setTeacherRosterClassroom(null);
      setTeacherSearch("");
    }
  }, [activeClassroom?._id, role, selectedTeacherClassroomId, sortedClassrooms]);

  useEffect(() => {
    async function loadTeacherRoster() {
      if (role !== "teacher" || !selectedTeacherClassroomId || !onLoadTeacherRoster) {
        setTeacherRoster([]);
        setTeacherRosterClassroom(null);
        return;
      }

      try {
        setTeacherRosterLoading(true);
        const data = await onLoadTeacherRoster(selectedTeacherClassroomId);
        setTeacherRoster(data.students || []);
        setTeacherRosterClassroom(data.classroom || null);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load classroom roster.");
      } finally {
        setTeacherRosterLoading(false);
      }
    }

    loadTeacherRoster();
  }, [onLoadTeacherRoster, role, selectedTeacherClassroomId]);

  async function copyCode(code) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Class code copied.");
    } catch (_error) {
      toast.error("Could not copy the class code.");
    }
  }

  async function handleTeacherSubmit(event) {
    event.preventDefault();

    if (!teacherForm.name.trim()) {
      toast.error("Classroom name is required.");
      return;
    }

    if (editingClassroom?._id) {
      await onUpdateClassroom?.(editingClassroom._id, {
        name: teacherForm.name,
        institution: teacherForm.institution,
        section: teacherForm.section,
      });
    } else {
      await onCreateClassroom?.({
        name: teacherForm.name,
        institution: teacherForm.institution,
        section: teacherForm.section,
      });
    }

    setTeacherForm({
      name: "",
      institution: "",
      section: "",
    });
    setEditingClassroom(null);
    setIsCreateModalOpen(false);
  }

  async function handleStudentSubmit(event) {
    event.preventDefault();

    if (!studentCode.trim()) {
      toast.error("Enter a classroom code.");
      return;
    }

    await onJoinClassroom?.({
      code: studentCode,
    });
    setStudentCode("");
  }

  function openCreateModal() {
    setEditingClassroom(null);
    setTeacherForm({
      name: "",
      institution: "",
      section: "",
    });
    setIsCreateModalOpen(true);
  }

  function openEditModal(classroom) {
    setEditingClassroom(classroom);
    setTeacherForm({
      name: classroom.name || "",
      institution: classroom.institution || "",
      section: classroom.section || "",
    });
    setIsCreateModalOpen(true);
  }

  return (
    <div className="space-y-6">
      {role === "teacher" ? (
        <SectionCard
          title="Your classrooms"
          eyebrow="Switch between cohorts"
          actions={(
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950"
              aria-label="Create new classroom"
            >
              <Plus size={18} />
            </button>
          )}
        >
          <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/20 p-4 light:border-slate-200 light:bg-slate-50">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 light:text-slate-500">
                  Search classrooms
                </p>
                <label className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 light:border-slate-200 light:bg-white">
                  <Search size={18} className="shrink-0 text-slate-400 light:text-slate-500" />
                  <input
                    type="text"
                    value={teacherClassroomSearch}
                    onChange={(event) => setTeacherClassroomSearch(event.target.value)}
                    placeholder="Search by class name, code, institution, or section"
                    className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-500 light:text-slate-900"
                  />
                </label>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/20 p-3 light:border-slate-200 light:bg-slate-50">
                <div className="dashboard-scrollbar max-h-[720px] space-y-3 overflow-y-auto pr-2">
                {filteredTeacherClassrooms.length ? filteredTeacherClassrooms.map((classroom) => {
                  const isActive = String(activeClassroom?._id || "") === String(classroom._id);
                  const isSelected = String(selectedTeacherClassroomId || "") === String(classroom._id);

                  return (
                    <div
                      key={classroom._id}
                      onClick={async () => {
                        setSelectedTeacherClassroomId(classroom._id);
                        setTeacherSearch("");

                        if (!isActive) {
                          await onSwitchClassroom?.(classroom._id);
                        }
                      }}
                      className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
                        isSelected
                          ? "border-cyan-300/60 bg-cyan-400/10 text-cyan-50"
                          : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-800"
                      } ${switchingClassroom ? "cursor-wait opacity-80" : "cursor-pointer"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-500">
                            {getClassroomMeta(classroom) || "Classroom"}
                          </p>
                          <h3 className="mt-2 font-display text-xl font-semibold">{classroom.name}</h3>
                        </div>
                        {isActive ? (
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300 light:text-emerald-700">
                            Active
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300 light:text-slate-600">
                        <span className="inline-flex items-center gap-2">
                          <School size={15} />
                          {classroom.code}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Users size={15} />
                          {classroom.studentCount || 0} student{classroom.studentCount === 1 ? "" : "s"}
                        </span>
                        {isActive ? (
                          <span className="inline-flex items-center gap-2 text-emerald-300 light:text-emerald-700">
                            <Check size={15} />
                            In use now
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openEditModal(classroom);
                          }}
                          className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition hover:bg-white/10 light:border-slate-200"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async (event) => {
                            event.stopPropagation();
                            const confirmed = window.confirm(`Delete classroom "${classroom.name}"? This will remove its assignments and submissions.`);

                            if (!confirmed) {
                              return;
                            }

                            await onDeleteClassroom?.(classroom);
                            if (String(selectedTeacherClassroomId) === String(classroom._id)) {
                              setSelectedTeacherClassroomId("");
                              setTeacherRoster([]);
                              setTeacherRosterClassroom(null);
                              setTeacherSearch("");
                            }
                          }}
                          className="rounded-full border border-rose-300/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-rose-100 transition hover:bg-rose-500/20 light:text-rose-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="rounded-[1.5rem] border border-dashed border-white/15 p-6 text-sm text-slate-400 light:border-slate-300 light:text-slate-600">
                    {teacherClassroomSearch.trim()
                      ? "No classrooms matched your search."
                      : "No classrooms created yet."}
                  </div>
                )}
                </div>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
              {teacherRosterClassroom ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-500">
                        Enrolled students
                      </p>
                      <h3 className="mt-2 font-display text-2xl font-semibold text-white light:text-slate-900">
                        {teacherRosterClassroom.name}
                      </h3>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-300 light:text-slate-600">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 light:border-slate-200">
                          <School size={15} />
                          {teacherRosterClassroom.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyCode(teacherRosterClassroom.code)}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 transition hover:bg-white/10 light:border-slate-200"
                        >
                          <ClipboardCopy size={15} />
                          Copy code
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          setSelectedTeacherClassroomId("");
                          setTeacherRoster([]);
                          setTeacherRosterClassroom(null);
                          setTeacherSearch("");
                          await onClearActiveClassroom?.();
                        }}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-700"
                        aria-label="Clear selected classroom"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 light:border-slate-200 light:text-slate-600">
                      {teacherRoster.length} enrolled
                    </div>
                  </div>

                  <div className="mt-2 rounded-[1.75rem] border border-white/10 bg-slate-950/20 p-5 light:border-slate-200 light:bg-slate-50">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 light:text-slate-500">
                      Search students
                    </p>
                    <label className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 light:border-slate-200 light:bg-white">
                      <Search size={18} className="shrink-0 text-slate-400 light:text-slate-500" />
                      <input
                        type="text"
                        value={teacherSearch}
                        onChange={(event) => setTeacherSearch(event.target.value)}
                        placeholder="Search students by name or email"
                        className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-500 light:text-slate-900"
                      />
                    </label>
                  </div>

                  <div className="dashboard-scrollbar max-h-[520px] space-y-3 overflow-y-auto pr-2">
                    {teacherRosterLoading ? (
                      <div className="rounded-[1.35rem] border border-dashed border-white/15 p-6 text-sm text-slate-400 light:border-slate-300 light:text-slate-600">
                        Loading roster...
                      </div>
                    ) : filteredTeacherRoster.length ? filteredTeacherRoster.map((student) => (
                      <div
                        key={student._id || student.studentId}
                        className="rounded-[1.35rem] border border-white/10 bg-slate-950/20 p-4 light:border-slate-200 light:bg-slate-50"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-white light:text-slate-900">{student.name}</p>
                            <p className="mt-1 text-sm text-slate-400 light:text-slate-600">{student.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-display text-xl font-bold text-cyan-200 light:text-cyan-700">
                              {student.averageScore ?? 0}%
                            </p>
                            <p className="text-sm text-slate-400 light:text-slate-600">
                              {student.attempts ?? 0} submission{(student.attempts ?? 0) === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="rounded-[1.35rem] border border-dashed border-white/15 p-6 text-sm text-slate-400 light:border-slate-300 light:text-slate-600">
                        {teacherSearch.trim()
                          ? "No students matched your search."
                          : "No students are enrolled in this classroom yet."}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-white/15 p-6 text-sm text-slate-400 light:border-slate-300 light:text-slate-600">
                  Your classrooms stay listed on the left even when no class is active. Select one to open its students here, or create a new classroom from the plus button.
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      ) : (
        <SectionCard
          title="Join a classroom"
          eyebrow="Enter your class code"
        >
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm text-slate-300 light:text-slate-700">Class code</span>
                <input
                  value={studentCode}
                  onChange={(event) => setStudentCode(event.target.value.toUpperCase())}
                  placeholder="e.g. ABC-234"
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 uppercase tracking-[0.22em] text-white light:border-slate-200 light:bg-white light:text-slate-900"
                />
              </label>

              <button
                type="submit"
                disabled={mutatingClassroom}
                className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
              >
                {mutatingClassroom ? "Joining..." : "Join classroom"}
              </button>
            </form>
        </SectionCard>
      )}

      {role !== "teacher" ? (
        <div className="grid gap-6 xl:grid-cols-[1fr,0.92fr]">
          <SectionCard
            title="Joined classrooms"
            eyebrow="Switch between cohorts"
          >
            <div className="space-y-3">
              {sortedClassrooms.length ? sortedClassrooms.map((classroom) => {
                const isActive = String(activeClassroom?._id || "") === String(classroom._id);

                return (
                  <button
                    key={classroom._id}
                    type="button"
                    onClick={() => onSwitchClassroom?.(classroom._id)}
                    disabled={switchingClassroom || isActive}
                    className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
                      isActive
                        ? "border-cyan-300/60 bg-cyan-400/10 text-cyan-50"
                        : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-800"
                    } disabled:cursor-not-allowed disabled:opacity-80`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-500">
                          {getClassroomMeta(classroom) || "Classroom"}
                        </p>
                        <h3 className="mt-2 font-display text-xl font-semibold">{classroom.name}</h3>
                      </div>
                      <div className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] light:border-slate-200">
                        {isActive ? "Active" : "Switch"}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300 light:text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <School size={15} />
                        {classroom.code}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Users size={15} />
                        {classroom.studentCount || 0} student{classroom.studentCount === 1 ? "" : "s"}
                      </span>
                      {isActive ? (
                        <span className="inline-flex items-center gap-2 text-emerald-300 light:text-emerald-700">
                          <Check size={15} />
                          In use now
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              }) : (
                <div className="rounded-[1.5rem] border border-dashed border-white/15 p-6 text-sm text-slate-400 light:border-slate-300 light:text-slate-600">
                  You have not joined any classrooms yet.
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Classroom guidance"
            eyebrow="How classroom access works"
          >
            <div className="space-y-4 text-sm leading-7 text-slate-300 light:text-slate-600">
              <div className="flex items-start gap-3 rounded-[1.35rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
                <DoorOpen className="mt-1 h-5 w-5 text-cyan-300 light:text-cyan-700" />
                <p>Use the class code from your professor to join the right classroom before opening assignments.</p>
              </div>
              <div className="flex items-start gap-3 rounded-[1.35rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
                <GraduationCap className="mt-1 h-5 w-5 text-cyan-300 light:text-cyan-700" />
                <p>Assignments, submissions, and analytics now stay inside the active classroom so cohorts do not mix.</p>
              </div>
            </div>
          </SectionCard>
        </div>
      ) : null}

      {role === "teacher" && isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 py-8">
          <div className="glass-panel section-gradient w-full max-w-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300/80 light:text-indigo-600">
                  {editingClassroom ? "Edit classroom" : "New classroom"}
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-white light:text-slate-900">
                  {editingClassroom ? "Update classroom" : "Create a classroom"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingClassroom(null);
                }}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-700"
                aria-label="Close create classroom dialog"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleTeacherSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm text-slate-300 light:text-slate-700">Classroom name</span>
                  <input
                    value={teacherForm.name}
                    onChange={(event) => setTeacherForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="e.g. Data Structures A"
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white light:border-slate-200 light:bg-white light:text-slate-900"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-slate-300 light:text-slate-700">Section</span>
                  <input
                    value={teacherForm.section}
                    onChange={(event) => setTeacherForm((current) => ({ ...current, section: event.target.value }))}
                    placeholder="e.g. Semester 4 / CSE-B"
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white light:border-slate-200 light:bg-white light:text-slate-900"
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm text-slate-300 light:text-slate-700">Institution</span>
                <input
                  value={teacherForm.institution}
                  onChange={(event) => setTeacherForm((current) => ({ ...current, institution: event.target.value }))}
                  placeholder="e.g. ABC Engineering College"
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white light:border-slate-200 light:bg-white light:text-slate-900"
                />
              </label>

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingClassroom(null);
                  }}
                  className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-slate-200 light:border-slate-200 light:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mutatingClassroom}
                  className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
                >
                  {mutatingClassroom ? (editingClassroom ? "Saving..." : "Creating...") : (editingClassroom ? "Save changes" : "Create classroom")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
