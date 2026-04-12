import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Activity, Brain, FilePenLine, FilePlus2, GitBranch, School, Target, Trash2, Trophy, Users, X } from "lucide-react";

import api from "../api/client.js";
import AnalyticsCharts from "../components/AnalyticsCharts.jsx";
import AppShell from "../components/AppShell.jsx";
import AssignmentEditor from "../components/AssignmentEditor.jsx";
import ClassroomHub from "../components/ClassroomHub.jsx";
import ClassroomSwitcher from "../components/ClassroomSwitcher.jsx";
import SectionCard from "../components/SectionCard.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import StatCard from "../components/StatCard.jsx";
import TeacherTreeStudio from "../components/TeacherTreeStudio.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const tabs = [
  { id: "classrooms", label: "Classrooms", icon: School },
  { id: "studio", label: "Teach Trees", icon: GitBranch },
  { id: "assignments", label: "Assignments", icon: Brain },
  { id: "analytics", label: "Analytics", icon: Activity },
];
const TAB_STORAGE_KEY = "algoyantra_teacher_active_tab";
const DEFAULT_TEACHER_TAB = "classrooms";

export default function TeacherDashboard() {
  const {
    user,
    classrooms,
    activeClassroom,
    clearActiveClassroom,
    createClassroom,
    deleteClassroom,
    refreshProfile,
    switchClassroom,
    updateClassroom,
  } = useAuth();
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem(TAB_STORAGE_KEY) || DEFAULT_TEACHER_TAB);
  const [loading, setLoading] = useState(true);
  const [creatingClassroom, setCreatingClassroom] = useState(false);
  const [switchingClassroom, setSwitchingClassroom] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState(null);
  const [pendingDeleteAssignmentId, setPendingDeleteAssignmentId] = useState(null);
  const [isAssignmentEditorOpen, setIsAssignmentEditorOpen] = useState(false);
  const hasActiveClassroom = Boolean(activeClassroom?._id);

  async function loadDashboard() {
    if (!hasActiveClassroom) {
      setAssignments([]);
      setAnalytics(null);
      setAssignmentSubmissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [assignmentsResponse, analyticsResponse] = await Promise.all([
        api.get("/assignments"),
        api.get("/analytics/teacher/overview"),
      ]);

      setAssignments(assignmentsResponse.data.assignments);
      setAnalytics(analyticsResponse.data);
    } catch (error) {
      if (error.response?.data?.code !== "ACTIVE_CLASSROOM_REQUIRED") {
        toast.error(error.response?.data?.message || "Failed to load teacher dashboard.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab !== "classrooms" && !activeClassroom?._id) {
      setActiveTab("classrooms");
      return;
    }

    if (!hasActiveClassroom) {
      setLoading(false);
      setActiveTab("classrooms");
      return;
    }

    loadDashboard();
  }, [activeClassroom?._id, activeTab, hasActiveClassroom]);

  useEffect(() => {
    localStorage.setItem(TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    async function loadAssignmentSubmissions() {
      if (!selectedAssignmentId || !hasActiveClassroom) {
        setAssignmentSubmissions([]);
        return;
      }

      try {
        const { data } = await api.get(`/submissions/assignment/${selectedAssignmentId}`);
        setAssignmentSubmissions(data.submissions);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load assignment results.");
      }
    }

    loadAssignmentSubmissions();
  }, [selectedAssignmentId, activeClassroom?._id]);

  useEffect(() => {
    setSelectedAssignmentId(null);
    setSelectedStudentId(null);
    setEditingAssignmentId(null);
    setPendingDeleteAssignmentId(null);
    setIsAssignmentEditorOpen(false);
  }, [activeClassroom?._id]);

  const overview = analytics?.overview || {
    totalStudents: 0,
    activeAssignments: 0,
    averageScore: 0,
  };

  const selectedAssignment =
    assignments.find((assignment) => assignment._id === selectedAssignmentId) || null;
  const editingAssignment =
    assignments.find((assignment) => assignment._id === editingAssignmentId) || null;
  const pendingDeleteAssignment =
    assignments.find((assignment) => assignment._id === pendingDeleteAssignmentId) || null;
  const assignmentAverage = assignmentSubmissions.length
    ? Math.round(
        assignmentSubmissions.reduce((sum, submission) => sum + submission.score, 0)
          / assignmentSubmissions.length,
      )
    : 0;
  const topScore = assignmentSubmissions.length
    ? Math.max(...assignmentSubmissions.map((submission) => submission.score))
    : 0;
  const pendingStudents = Math.max(overview.totalStudents - assignmentSubmissions.length, 0);
  const studentReports = analytics?.studentReports || [];
  const sortedStudentReports = useMemo(
    () => [...studentReports].sort((left, right) => String(left.name || "").localeCompare(String(right.name || ""))),
    [studentReports],
  );
  const filteredStudentReports = useMemo(() => {
    const normalizedSearch = studentSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return sortedStudentReports;
    }

    return sortedStudentReports.filter((student) => (
      String(student.name || "").toLowerCase().includes(normalizedSearch)
    ));
  }, [sortedStudentReports, studentSearch]);
  const visibleStudentReports = useMemo(
    () => filteredStudentReports,
    [filteredStudentReports],
  );
  const selectedStudentReport = useMemo(() => {
    if (!selectedStudentId) {
      return null;
    }

    const report = studentReports.find((student) => String(student.studentId) === String(selectedStudentId));

    if (!report) {
      return null;
    }

    return {
      ...report,
      name: report.name || "Student",
      email: report.email || "No email available",
      averageScore: Number.isFinite(Number(report.averageScore)) ? Number(report.averageScore) : 0,
      attempts: Number.isFinite(Number(report.attempts)) ? Number(report.attempts) : 0,
      marksEarned: Number.isFinite(Number(report.marksEarned)) ? Number(report.marksEarned) : 0,
      marksPossible: Number.isFinite(Number(report.marksPossible)) ? Number(report.marksPossible) : 0,
      treeTypeBreakdown: Array.isArray(report.treeTypeBreakdown) ? report.treeTypeBreakdown : [],
      assignments: Array.isArray(report.assignments) ? report.assignments : [],
    };
  }, [studentReports, selectedStudentId]);
  useEffect(() => {
    if (!filteredStudentReports.length) {
      setSelectedStudentId(null);
      return;
    }

    const stillExists = studentReports.some(
      (student) => String(student.studentId) === String(selectedStudentId),
    );

    if (selectedStudentId && !stillExists) {
      setSelectedStudentId(null);
    }
  }, [studentReports, selectedStudentId]);

  function formatTreeTypeLabel(treeType) {
    return String(treeType || "")
      .split("-")
      .map((part) => (part.toUpperCase() === "BST" ? "BST" : part.charAt(0).toUpperCase() + part.slice(1)))
      .join(" ");
  }

  async function handleDeleteAssignment(assignmentId) {
    try {
      setDeletingAssignmentId(assignmentId);
      await api.delete(`/assignments/${assignmentId}`);
      toast.success("Assignment deleted.");
      if (selectedAssignmentId === assignmentId) {
        setSelectedAssignmentId(null);
      }
      if (editingAssignmentId === assignmentId) {
        setEditingAssignmentId(null);
        setIsAssignmentEditorOpen(false);
      }
      setPendingDeleteAssignmentId(null);
      await loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete assignment.");
    } finally {
      setDeletingAssignmentId(null);
    }
  }

  async function handleCreateClassroom(payload) {
    try {
      setCreatingClassroom(true);
      await createClassroom(payload);
      toast.success("Classroom created.");
      setActiveTab("classrooms");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create classroom.");
    } finally {
      setCreatingClassroom(false);
    }
  }

  async function handleUpdateClassroom(classroomId, payload) {
    try {
      setCreatingClassroom(true);
      await updateClassroom(classroomId, payload);
      toast.success("Classroom updated.");
      setActiveTab("classrooms");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update classroom.");
    } finally {
      setCreatingClassroom(false);
    }
  }

  async function handleDeleteClassroom(classroom) {
    try {
      setCreatingClassroom(true);
      await deleteClassroom(classroom._id);
      toast.success("Classroom deleted.");
      setActiveTab("classrooms");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete classroom.");
    } finally {
      setCreatingClassroom(false);
    }
  }

  async function handleSwitchClassroom(classroomId) {
    if (!classroomId || classroomId === activeClassroom?._id) {
      setActiveTab("classrooms");
      return;
    }

    try {
      setSwitchingClassroom(true);
      await switchClassroom(classroomId);
      toast.success("Active classroom updated.");
      setActiveTab("classrooms");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to switch classroom.");
    } finally {
      setSwitchingClassroom(false);
    }
  }

  async function handleClearActiveClassroom() {
    try {
      setSwitchingClassroom(true);
      await clearActiveClassroom();
      setActiveTab("classrooms");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to clear active classroom.");
    } finally {
      setSwitchingClassroom(false);
    }
  }

  async function handleLoadTeacherRoster(classroomId) {
    const { data } = await api.get(`/classrooms/${classroomId}/roster`);
    const rosterByStudentId = new Map(
      (analytics?.studentReports || []).map((student) => [String(student.studentId), student]),
    );

    return {
      classroom: data.classroom,
      students: (data.students || []).map((student) => {
        const report = rosterByStudentId.get(String(student._id));

        return {
          _id: student._id,
          name: student.name,
          email: student.email,
          averageScore: report?.averageScore || 0,
          attempts: report?.attempts || 0,
        };
      }),
    };
  }

  async function handleRemoveStudentFromClassroom(classroomId, studentId) {
    await api.delete(`/classrooms/${classroomId}/students/${studentId}`);
    await refreshProfile();

    if (String(activeClassroom?._id || "") === String(classroomId)) {
      await loadDashboard();
    }
  }

  const noClassroomState = (
    <SectionCard title="No classroom selected" eyebrow="Create your first class space">
      <div className="rounded-[1.5rem] border border-dashed border-white/15 p-6 text-sm leading-7 text-slate-400 light:border-slate-300 light:text-slate-600">
        Create a classroom first. Once a classroom is active, assignments, submissions, and analytics will stay isolated to that class so students from other colleges or sections do not mix.
      </div>
    </SectionCard>
  );

  const studentPerformanceSection = (
    <SectionCard
      title="Student performance"
      eyebrow="Individual learner insights"
      actions={selectedStudentReport ? (
        <button
          type="button"
          onClick={() => setSelectedStudentId(null)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-700"
          aria-label="Clear student selection"
        >
          <X size={18} />
        </button>
      ) : null}
    >
      {studentReports.length ? (
        <div className="grid gap-6 xl:grid-cols-[320px,minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">
                Search students
              </p>
              <input
                type="text"
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
                placeholder="Search by student name"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white light:border-slate-200 light:bg-white light:text-slate-900"
              />
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-3 light:border-slate-200 light:bg-white">
              <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                {visibleStudentReports.length ? visibleStudentReports.map((student) => (
                  <button
                    key={student.studentId}
                    type="button"
                    onClick={() => setSelectedStudentId(String(student.studentId))}
                    className={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition ${
                      String(selectedStudentId) === String(student.studentId)
                        ? "border-cyan-300/60 bg-cyan-400/10 text-cyan-50"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 light:border-slate-200 light:bg-slate-50 light:text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white light:text-slate-900">{student.name}</p>
                        <p className="mt-1 text-sm text-slate-400 light:text-slate-600">
                          {student.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-display text-xl font-bold text-cyan-200 light:text-cyan-700">
                          {student.averageScore}%
                        </div>
                        <p className="text-sm text-slate-400 light:text-slate-600">
                          {student.attempts} attempt{student.attempts === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                  </button>
                )) : (
                  <div className="rounded-[1.5rem] border border-dashed border-white/15 p-5 text-sm text-slate-400 light:border-slate-300 light:text-slate-600">
                    No students matched your search.
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedStudentReport ? (
            <div className="space-y-6">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 light:border-slate-200 light:bg-white">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">
                      Student performance overview
                    </p>
                    <h3 className="mt-2 font-display text-2xl font-semibold text-white light:text-slate-900">
                      {selectedStudentReport.name}
                    </h3>
                    <p className="mt-2 text-sm text-slate-300 light:text-slate-600">
                      {selectedStudentReport.email}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-right text-cyan-50 light:text-cyan-700">
                    <div className="font-display text-3xl font-bold">
                      {selectedStudentReport.averageScore}%
                    </div>
                    <p className="text-sm">
                      {selectedStudentReport.marksEarned}/{selectedStudentReport.marksPossible} Marks
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">Assignments attempted</p>
                  <div className="mt-2 font-display text-3xl font-bold text-white light:text-slate-900">
                    {selectedStudentReport.attempts}
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">Overall score</p>
                  <div className="mt-2 font-display text-3xl font-bold text-white light:text-slate-900">
                    {selectedStudentReport.averageScore}%
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">Overall marks</p>
                  <div className="mt-2 font-display text-3xl font-bold text-white light:text-slate-900">
                    {selectedStudentReport.marksEarned}/{selectedStudentReport.marksPossible}
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 light:border-slate-200 light:bg-white">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">
                  Tree-wise progress
                </p>
                <div className="mt-4 space-y-3">
                  {selectedStudentReport.treeTypeBreakdown.length ? selectedStudentReport.treeTypeBreakdown.map((treeEntry) => (
                    <div
                      key={treeEntry.treeType}
                      className="rounded-[1.25rem] border border-white/10 bg-slate-950/25 p-4 light:border-slate-200 light:bg-slate-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-white light:text-slate-900">
                            {formatTreeTypeLabel(treeEntry.treeType)}
                          </p>
                          <p className="mt-1 text-sm text-slate-400 light:text-slate-600">
                            {treeEntry.attempts} assignment{treeEntry.attempts === 1 ? "" : "s"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-xl font-bold text-cyan-200 light:text-cyan-700">
                            {treeEntry.averageScore}%
                          </p>
                          <p className="text-sm text-slate-400 light:text-slate-600">
                            {treeEntry.marksEarned}/{treeEntry.marksPossible} Marks
                          </p>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-[1.25rem] border border-dashed border-white/15 p-4 text-sm text-slate-400 light:border-slate-300 light:text-slate-600">
                      No tree progress yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-white/15 p-6 text-sm text-slate-400 light:border-slate-300 light:text-slate-600">
              Select a student to view performance details.
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-white/15 p-6 text-sm text-slate-400 light:border-slate-300 light:text-slate-600">
          No student performance data is available yet.
        </div>
      )}
    </SectionCard>
  );

  return (
    <AppShell
      title="Teacher dashboard"
      subtitle="Create assignments for students and review results assignment by assignment."
      user={user}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      topActions={(
        <ClassroomSwitcher
          activeClassroom={activeClassroom}
        />
      )}
      hideHeader
    >
      {pendingDeleteAssignment ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4">
          <div className="glass-panel section-gradient w-full max-w-md p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-300/80 light:text-rose-700">
              Confirm deletion
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-white light:text-slate-900">
              Delete assignment?
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300 light:text-slate-700">
              This will permanently delete
              {" "}
              <span className="font-semibold text-white light:text-slate-900">
                {pendingDeleteAssignment.title}
              </span>
              {" "}
              and remove all related submissions.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDeleteAssignmentId(null)}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 light:border-slate-200 light:text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAssignment(pendingDeleteAssignment._id)}
                disabled={deletingAssignmentId === pendingDeleteAssignment._id}
                className="inline-flex items-center gap-2 rounded-full border border-rose-300/20 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 disabled:opacity-60 light:text-rose-700"
              >
                <Trash2 size={16} />
                {deletingAssignmentId === pendingDeleteAssignment._id ? "Deleting..." : "Delete assignment"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : null}

      {!loading && activeTab === "classrooms" ? (
        <ClassroomHub
          role="teacher"
          classrooms={classrooms}
          activeClassroom={activeClassroom}
          onSwitchClassroom={handleSwitchClassroom}
          onClearActiveClassroom={handleClearActiveClassroom}
          onCreateClassroom={handleCreateClassroom}
          onLoadTeacherRoster={handleLoadTeacherRoster}
          onRemoveStudentFromClassroom={handleRemoveStudentFromClassroom}
          onUpdateClassroom={handleUpdateClassroom}
          onDeleteClassroom={handleDeleteClassroom}
          switchingClassroom={switchingClassroom}
          mutatingClassroom={creatingClassroom}
        />
      ) : null}

      {!loading && activeTab === "assignments" ? (
        hasActiveClassroom ? (
          <div className="space-y-6">
          {isAssignmentEditorOpen ? (
            <AssignmentEditor
              assignment={editingAssignment}
              onSaved={async () => {
                setEditingAssignmentId(null);
                setIsAssignmentEditorOpen(false);
                await loadDashboard();
              }}
              onCancel={() => {
                setEditingAssignmentId(null);
                setIsAssignmentEditorOpen(false);
              }}
            />
          ) : null}

          <SectionCard
            title="Published assignments"
            eyebrow="Your assignment list"
            actions={!isAssignmentEditorOpen ? (
              <button
                type="button"
                onClick={() => {
                  setEditingAssignmentId(null);
                  setIsAssignmentEditorOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                <FilePlus2 size={16} />
                New assignment
              </button>
            ) : null}
          >
            <div className="grid gap-4 xl:grid-cols-2">
              {assignments.length ? assignments.map((assignment) => (
                <div
                  key={assignment._id}
                  className="rounded-[2rem] border border-white/10 bg-white/5 p-5 light:border-slate-200 light:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">
                        {assignment.treeType}
                      </p>
                      <h3 className="mt-2 font-display text-xl font-semibold text-white light:text-slate-900">
                        {assignment.title}
                      </h3>
                    </div>
                    <div className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100 light:text-cyan-700">
                      {assignment.xpReward} Marks
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-300 light:text-slate-700">
                    {assignment.description}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAssignmentId(assignment._id);
                        setIsAssignmentEditorOpen(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 light:text-cyan-700"
                    >
                      <FilePenLine size={16} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteAssignmentId(assignment._id)}
                      disabled={deletingAssignmentId === assignment._id}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-300/20 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20 disabled:opacity-60 light:text-rose-700"
                    >
                      <Trash2 size={16} />
                      {deletingAssignmentId === assignment._id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.5rem] border border-dashed border-white/15 p-6 text-sm text-slate-400 light:border-slate-300 light:text-slate-600">
                  No assignments created yet.
                </div>
              )}
            </div>
          </SectionCard>
          </div>
        ) : noClassroomState
      ) : null}

      {!loading && activeTab === "studio" ? (
        hasActiveClassroom ? <TeacherTreeStudio /> : noClassroomState
      ) : null}

      {!loading && activeTab === "analytics" ? (
        hasActiveClassroom ? (
          <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Users} label="Students" value={overview.totalStudents} helper="Students in the workspace" tone="cyan" />
            <StatCard icon={Brain} label="Assignments" value={overview.activeAssignments} helper="Assignments created by you" tone="emerald" />
            <StatCard icon={Target} label="Average score" value={`${overview.averageScore}%`} helper="Across all submissions" tone="amber" />
            <StatCard icon={Trophy} label="Selected avg" value={`${assignmentAverage}%`} helper="For the selected assignment" tone="rose" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.36fr,0.64fr]">
            <SectionCard title="Assignment results" eyebrow="Choose an assignment">
              <div className="dashboard-scrollbar max-h-[50rem] space-y-3 overflow-y-auto pr-2">
                {assignments.length ? assignments.map((assignment) => (
                  <button
                    key={assignment._id}
                    type="button"
                    onClick={() => setSelectedAssignmentId(assignment._id)}
                    className={`flex min-h-[9rem] w-full flex-col justify-between rounded-[1.5rem] border px-4 py-4 text-left transition ${
                      selectedAssignmentId === assignment._id
                        ? "border-cyan-300/50 bg-cyan-400/10 text-cyan-50"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-700"
                    }`}
                  >
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">
                      {assignment.treeType}
                    </p>
                    <h3 className="mt-2 font-display text-lg font-semibold">{assignment.title}</h3>
                    <p className="mt-2 text-sm leading-6">{assignment.description}</p>
                  </button>
                )) : (
                  <div className="rounded-[1.5rem] border border-dashed border-white/15 p-6 text-sm text-slate-400 light:border-slate-300 light:text-slate-600">
                    Create an assignment to start tracking results.
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard
              title={selectedAssignment ? selectedAssignment.title : "Assignment analytics"}
              eyebrow="Submission results"
              actions={selectedAssignment ? (
                <button
                  type="button"
                  onClick={() => setSelectedAssignmentId(null)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-700"
                  aria-label="Clear assignment selection"
                >
                  <X size={18} />
                </button>
              ) : null}
            >
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">Submitted</p>
                  <div className="mt-2 font-display text-3xl font-bold text-white light:text-slate-900">
                    {assignmentSubmissions.length}
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">Pending</p>
                  <div className="mt-2 font-display text-3xl font-bold text-white light:text-slate-900">
                    {pendingStudents}
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">Top score</p>
                  <div className="mt-2 font-display text-3xl font-bold text-white light:text-slate-900">
                    {topScore}%
                  </div>
                </div>
              </div>

              <div className="mt-5">
                {assignmentSubmissions.length ? (
                  <div className="dashboard-scrollbar max-h-[50rem] space-y-3 overflow-y-auto pr-2">
                    {assignmentSubmissions.map((submission) => (
                      <div
                        key={submission._id}
                        className="flex min-h-[6.75rem] items-center justify-between rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 light:border-slate-200 light:bg-white"
                      >
                        <div>
                          <p className="font-medium text-white light:text-slate-900">
                            {submission.student?.name}
                          </p>
                          <p className="text-sm text-slate-400 light:text-slate-600">
                            {submission.student?.email}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-display text-2xl font-bold text-cyan-200 light:text-cyan-700">
                            {submission.score}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-white/15 p-6 text-sm text-slate-400 light:border-slate-300 light:text-slate-600">
                    No submissions yet for this assignment.
                  </div>
                )}
              </div>
            </SectionCard>
          </div>

          <AnalyticsCharts
            mistakeHeatmap={analytics?.mistakeHeatmap || []}
            treeTypePerformance={analytics?.treeTypePerformance || []}
          />
          </div>
        ) : noClassroomState
      ) : null}

      {!loading && activeTab === "student-performance" ? (
        hasActiveClassroom ? (
          <div className="space-y-6">
            {studentPerformanceSection}
          </div>
        ) : noClassroomState
      ) : null}
    </AppShell>
  );
}
