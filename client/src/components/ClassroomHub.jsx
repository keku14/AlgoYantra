import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { BellRing, Check, ClipboardCopy, DoorOpen, GraduationCap, Info, Minus, Plus, School, UserMinus, Users, X } from "lucide-react";

import SectionCard from "./SectionCard.jsx";

function getClassroomMeta(classroom) {
  return [classroom?.institution, classroom?.section].filter(Boolean).join(" • ");
}

export default function ClassroomHub({
  role,
  classrooms,
  activeClassroom,
  onSwitchClassroom,
  onCreateClassroom,
  onJoinClassroom,
  onLeaveClassroom,
  onLoadTeacherRoster,
  onRemoveStudentFromClassroom,
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
  const [classroomPendingDelete, setClassroomPendingDelete] = useState(null);
  const [classroomPendingLeave, setClassroomPendingLeave] = useState(null);
  const [studentPendingRemoval, setStudentPendingRemoval] = useState(null);
  const [removingStudentId, setRemovingStudentId] = useState(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const sortedClassrooms = useMemo(
    () => [...classrooms].sort((left, right) => String(left.name || "").localeCompare(String(right.name || ""))),
    [classrooms],
  );
  useEffect(() => {
    if (role !== "teacher") {
      return;
    }

    if (
      selectedTeacherClassroomId
      && !sortedClassrooms.some((classroom) => String(classroom._id) === String(selectedTeacherClassroomId))
    ) {
      setSelectedTeacherClassroomId("");
      setTeacherRoster([]);
      setTeacherRosterClassroom(null);
    }
  }, [role, selectedTeacherClassroomId, sortedClassrooms]);

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
    setIsJoinModalOpen(false);
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

  async function confirmDeleteClassroom() {
    if (!classroomPendingDelete) {
      return;
    }

    const classroomToDelete = classroomPendingDelete;
    setClassroomPendingDelete(null);

    await onDeleteClassroom?.(classroomToDelete);
    if (String(selectedTeacherClassroomId) === String(classroomToDelete._id)) {
      setSelectedTeacherClassroomId("");
      setTeacherRoster([]);
      setTeacherRosterClassroom(null);
    }
  }

  async function confirmLeaveClassroom() {
    if (!classroomPendingLeave) {
      return;
    }

    const classroomToLeave = classroomPendingLeave;
    setClassroomPendingLeave(null);
    await onLeaveClassroom?.(classroomToLeave._id);
  }

  async function openRosterModal(classroom) {
    setSelectedTeacherClassroomId(String(classroom._id));
    setTeacherRosterClassroom(classroom);
  }

  async function confirmRemoveStudent() {
    if (!studentPendingRemoval) {
      return;
    }

    const pendingRemoval = studentPendingRemoval;
    setStudentPendingRemoval(null);

    try {
      setRemovingStudentId(pendingRemoval.studentId);
      await onRemoveStudentFromClassroom?.(pendingRemoval.classroomId, pendingRemoval.studentId);

      const refreshedRoster = await onLoadTeacherRoster?.(pendingRemoval.classroomId);
      setTeacherRoster(refreshedRoster?.students || []);
      setTeacherRosterClassroom(refreshedRoster?.classroom || teacherRosterClassroom);
      toast.success("Student removed from classroom.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove student from classroom.");
    } finally {
      setRemovingStudentId(null);
    }
  }

  return (
    <div className="space-y-6">
      {role === "teacher" ? (
        <SectionCard
          title="Your classrooms"
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
          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/20 p-3 light:border-slate-200 light:bg-slate-50">
              <div className="dashboard-scrollbar max-h-[34rem] space-y-3 overflow-y-auto pr-2">
                {sortedClassrooms.length ? sortedClassrooms.map((classroom) => {
                  const isActive = String(activeClassroom?._id || "") === String(classroom._id);

                  return (
                    <div
                      key={classroom._id}
                      onClick={async () => {
                        if (!isActive) {
                          await onSwitchClassroom?.(classroom._id);
                        }
                      }}
                      className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
                        isActive
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
                            openRosterModal(classroom);
                          }}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition hover:bg-white/10 light:border-slate-200"
                        >
                          <Info size={14} />
                          Info
                        </button>
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
                          onClick={(event) => {
                            event.stopPropagation();
                            setClassroomPendingDelete(classroom);
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
                    No classrooms created yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </SectionCard>
      ) : null}

      {role !== "teacher" ? (
        <div className="grid items-stretch gap-6 xl:grid-cols-[1fr,0.92fr]">
          <SectionCard
            title="Joined classrooms"
            className="flex h-full min-h-[calc(100vh-18rem)] flex-col"
            actions={(
              <button
                type="button"
                onClick={() => setIsJoinModalOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 transition"
                aria-label="Join classroom"
              >
                <Plus size={18} />
              </button>
            )}
          >
            <div className="dashboard-scrollbar flex-1 space-y-3 overflow-y-auto pr-2">
              {sortedClassrooms.length ? sortedClassrooms.map((classroom) => {
                const isActive = String(activeClassroom?._id || "") === String(classroom._id);
                const pendingAssignmentCount = Number(classroom.pendingAssignmentCount || 0);

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
                        <div className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                          pendingAssignmentCount > 0
                            ? "border-amber-300/20 bg-amber-500/10 text-amber-100 light:text-amber-700"
                            : "border-white/10 bg-white/5 text-slate-300 light:border-slate-200 light:bg-slate-100 light:text-slate-600"
                        }`}>
                          <BellRing size={14} />
                          {pendingAssignmentCount} pending assignment{pendingAssignmentCount === 1 ? "" : "s"}
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setClassroomPendingLeave(classroom);
                          }}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-300/20 bg-rose-500/10 text-rose-100 transition hover:bg-rose-500/20 light:text-rose-700"
                          aria-label={`Leave ${classroom.name}`}
                        >
                          <Minus size={16} />
                        </button>
                      </div>
                    </div>
                    {isActive ? (
                      <div className="mt-4 text-sm font-medium text-emerald-300 light:text-emerald-700">
                        Current classroom
                      </div>
                    ) : null}
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
            className="flex h-full min-h-[calc(100vh-18rem)] flex-col"
          >
            <div className="flex flex-1 flex-col justify-between gap-4 text-sm leading-7 text-slate-300 light:text-slate-600">
              <div className="flex items-start gap-3 rounded-[1.35rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
                <DoorOpen className="mt-1 h-5 w-5 text-cyan-300 light:text-cyan-700" />
                <p>Join a classroom only with a class code shared by your teacher or professor.</p>
              </div>
              <div className="flex items-start gap-3 rounded-[1.35rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
                <GraduationCap className="mt-1 h-5 w-5 text-cyan-300 light:text-cyan-700" />
                <p>Your assignments, submissions, and progress belong to the classroom you currently open.</p>
              </div>
              <div className="flex items-start gap-3 rounded-[1.35rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
                <Users className="mt-1 h-5 w-5 text-cyan-300 light:text-cyan-700" />
                <p>If you join more than one classroom, switching classrooms changes which work and records you see.</p>
              </div>
            </div>
          </SectionCard>
        </div>
      ) : null}

      {classroomPendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 py-8">
          <div className="glass-panel section-gradient w-full max-w-md p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-300/80 light:text-rose-600">
              Warning
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-white light:text-slate-900">
              Delete classroom?
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300 light:text-slate-600">
              Delete classroom "{classroomPendingDelete.name}"? This will remove its assignments and submissions.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setClassroomPendingDelete(null)}
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-slate-200 light:border-slate-200 light:text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteClassroom}
                className="rounded-full border border-rose-300/20 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20 light:text-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {role !== "teacher" && classroomPendingLeave ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 py-8">
          <div className="glass-panel section-gradient w-full max-w-md p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-300/80 light:text-rose-600">
              Leave classroom
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-white light:text-slate-900">
              Exit this classroom?
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300 light:text-slate-600">
              Do you want to exit "{classroomPendingLeave.name}"?
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setClassroomPendingLeave(null)}
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-slate-200 light:border-slate-200 light:text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLeaveClassroom}
                className="rounded-full border border-rose-300/20 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20 light:text-rose-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {role === "teacher" && teacherRosterClassroom ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 py-8">
          <div className="glass-panel section-gradient w-full max-w-4xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300/80 light:text-indigo-600">
                  Classroom info
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-white light:text-slate-900">
                  {teacherRosterClassroom.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedTeacherClassroomId("");
                  setTeacherRoster([]);
                  setTeacherRosterClassroom(null);
                }}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-700"
                aria-label="Close classroom info"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-300 light:text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 light:border-slate-200">
                <School size={15} />
                {teacherRosterClassroom.code}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 light:border-slate-200">
                <Users size={15} />
                {teacherRoster.length} enrolled
              </span>
              <button
                type="button"
                onClick={() => copyCode(teacherRosterClassroom.code)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 transition hover:bg-white/10 light:border-slate-200"
              >
                <ClipboardCopy size={15} />
                Copy code
              </button>
            </div>

            <div className="dashboard-scrollbar mt-6 max-h-[26rem] space-y-3 overflow-y-auto pr-2">
              {teacherRosterLoading ? (
                <div className="rounded-[1.35rem] border border-dashed border-white/15 p-6 text-sm text-slate-400 light:border-slate-300 light:text-slate-600">
                  Loading roster...
                </div>
              ) : teacherRoster.length ? teacherRoster.map((student) => (
                <div
                  key={student._id || student.studentId}
                  className="rounded-[1.35rem] border border-white/10 bg-slate-950/20 p-4 light:border-slate-200 light:bg-slate-50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-white light:text-slate-900">{student.name}</p>
                      <p className="mt-1 text-sm text-slate-400 light:text-slate-600">{student.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-display text-xl font-bold text-cyan-200 light:text-cyan-700">
                          {student.averageScore ?? 0}%
                        </p>
                        <p className="text-sm text-slate-400 light:text-slate-600">
                          {student.attempts ?? 0} submission{(student.attempts ?? 0) === 1 ? "" : "s"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStudentPendingRemoval({
                          classroomId: teacherRosterClassroom._id,
                          classroomName: teacherRosterClassroom.name,
                          studentId: student._id,
                          studentName: student.name,
                        })}
                        disabled={removingStudentId === student._id}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-300/20 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20 disabled:opacity-60 light:text-rose-700"
                      >
                        <UserMinus size={16} />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.35rem] border border-dashed border-white/15 p-6 text-sm text-slate-400 light:border-slate-300 light:text-slate-600">
                  No students are enrolled in this classroom yet.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {role === "teacher" && studentPendingRemoval ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 px-4 py-8">
          <div className="glass-panel section-gradient w-full max-w-md p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-300/80 light:text-rose-600">
              Remove student
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-white light:text-slate-900">
              Remove from classroom?
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300 light:text-slate-600">
              Remove "{studentPendingRemoval.studentName}" from "{studentPendingRemoval.classroomName}"?
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setStudentPendingRemoval(null)}
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-slate-200 light:border-slate-200 light:text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveStudent}
                disabled={removingStudentId === studentPendingRemoval.studentId}
                className="rounded-full border border-rose-300/20 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20 disabled:opacity-60 light:text-rose-700"
              >
                {removingStudentId === studentPendingRemoval.studentId ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {role !== "teacher" && isJoinModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 py-8">
          <div className="glass-panel section-gradient w-full max-w-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300/80 light:text-indigo-600">
                  Enter your class code
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-white light:text-slate-900">
                  Join a classroom
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsJoinModalOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-700"
                aria-label="Close join classroom dialog"
              >
                <X size={18} />
              </button>
            </div>

            <form id="student-join-classroom-form" onSubmit={handleStudentSubmit} className="mt-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm text-slate-300 light:text-slate-700">Class code</span>
                <input
                  value={studentCode}
                  onChange={(event) => setStudentCode(event.target.value.toUpperCase())}
                  placeholder="e.g. ABC-234"
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 uppercase tracking-[0.22em] text-white light:border-slate-200 light:bg-white light:text-slate-900"
                />
              </label>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={mutatingClassroom}
                  className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
                >
                  {mutatingClassroom ? "Joining..." : "Join classroom"}
                </button>
              </div>
            </form>
          </div>
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
