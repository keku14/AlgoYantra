import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowRightLeft,
  BookOpenCheck,
  CheckCircle2,
  CircleAlert,
  Eye,
  GraduationCap,
  LineChart,
  PanelLeftClose,
  PanelLeftOpen,
  School,
  Target,
  Trophy,
  X,
} from "lucide-react";
import { collectValues, countNodes, treeHeight, traverseTree } from "@algoyantra/shared";

import api from "../api/client.js";
import AnalyticsCharts from "../components/AnalyticsCharts.jsx";
import AppShell from "../components/AppShell.jsx";
import ClassroomHub from "../components/ClassroomHub.jsx";
import ClassroomSwitcher from "../components/ClassroomSwitcher.jsx";
import SectionCard from "../components/SectionCard.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import StatCard from "../components/StatCard.jsx";
import StudentAssignmentWorkspace from "../components/StudentAssignmentWorkspace.jsx";
import TreeVisualizer from "../components/TreeVisualizer.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import useHistoryState from "../hooks/useHistoryState.js";

const tabs = [
  { id: "classrooms", label: "Classrooms", icon: School },
  { id: "assignments", label: "Assignments", icon: GraduationCap },
  { id: "analytics", label: "Analytics", icon: LineChart },
];
const TAB_STORAGE_KEY = "algoyantra_student_active_tab";

export default function StudentDashboard() {
  const {
    user,
    refreshProfile,
    classrooms,
    activeClassroom,
    joinClassroom,
    switchClassroom,
  } = useAuth();
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem(TAB_STORAGE_KEY) || "assignments");
  const [loading, setLoading] = useState(true);
  const [joiningClassroom, setJoiningClassroom] = useState(false);
  const [switchingClassroom, setSwitchingClassroom] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [result, setResult] = useState(null);
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  const [isAssignmentRailOpen, setIsAssignmentRailOpen] = useState(true);
  const [assignmentFilter, setAssignmentFilter] = useState("pending");
  const [selectedAnalyticsTreeType, setSelectedAnalyticsTreeType] = useState(null);
  const [selectedAnalyticsAssignmentId, setSelectedAnalyticsAssignmentId] = useState(null);
  const [analyticsTreePreview, setAnalyticsTreePreview] = useState(null);
  const solverHistory = useHistoryState(null);
  const hasActiveClassroom = Boolean(activeClassroom?._id);

  async function loadDashboard() {
    if (!hasActiveClassroom) {
      setAssignments([]);
      setAnalytics(null);
      setSubmissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [assignmentsResponse, analyticsResponse, submissionsResponse] = await Promise.all([
        api.get("/assignments"),
        api.get("/analytics/student/overview"),
        api.get("/submissions/mine"),
      ]);

      setAssignments(assignmentsResponse.data.assignments);
      setAnalytics(analyticsResponse.data);
      setSubmissions(submissionsResponse.data.submissions);
    } catch (error) {
      if (error.response?.data?.code !== "ACTIVE_CLASSROOM_REQUIRED") {
        toast.error(error.response?.data?.message || "Failed to load student dashboard.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!hasActiveClassroom) {
      setActiveTab("classrooms");
      return;
    }

    loadDashboard();
  }, [activeClassroom?._id]);

  useEffect(() => {
    localStorage.setItem(TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  const selectedAssignment =
    assignments.find((assignment) => assignment._id === selectedAssignmentId) || null;

  const filteredAssignments = useMemo(() => (
    assignments.filter((assignment) => (
      assignmentFilter === "attempted" ? Boolean(assignment.submission) : !assignment.submission
    ))
  ), [assignmentFilter, assignments]);

  useEffect(() => {
    if (selectedAssignmentId && !selectedAssignment) {
      setSelectedAssignmentId(null);
      setIsAssignmentRailOpen(true);
    }
  }, [selectedAssignment, selectedAssignmentId]);

  useEffect(() => {
    solverHistory.reset(null);
    setResult(null);
  }, [selectedAssignmentId]);

  useEffect(() => {
    if (assignmentFilter === "attempted") {
      setSelectedAssignmentId(null);
    }
  }, [assignmentFilter]);

  useEffect(() => {
    setSelectedAssignmentId(null);
    setSelectedAnalyticsTreeType(null);
    setSelectedAnalyticsAssignmentId(null);
    setIsAssignmentRailOpen(true);
    setAssignmentFilter("pending");
  }, [activeClassroom?._id]);

  async function submitAssignment() {
    if (!selectedAssignment) {
      return;
    }

    try {
      setSubmittingAssignment(true);
      const { data } = await api.post(`/submissions/${selectedAssignment._id}`, {
        tree: solverHistory.present,
        traversals: [],
        notes: [],
      });

      setResult(data.evaluation);
      toast.success(`Submission scored: ${data.evaluation.score}%`);
      await refreshProfile();
      await loadDashboard();
      setActiveTab("analytics");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit assignment.");
    } finally {
      setSubmittingAssignment(false);
    }
  }

  async function handleJoinClassroom(payload) {
    try {
      setJoiningClassroom(true);
      await joinClassroom(payload);
      toast.success("Joined classroom.");
      setActiveTab("classrooms");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to join classroom.");
    } finally {
      setJoiningClassroom(false);
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

  const overview = analytics?.overview || {
    accuracy: 0,
    totalXp: user?.xp || 0,
  };

  const totalAvailableMarks = assignments.reduce(
    (sum, assignment) => sum + Number(assignment.xpReward || 0),
    0,
  );
  const totalScoredMarks = assignments.reduce((sum, assignment) => {
    const score = Number(assignment.submission?.score || 0);
    const marks = Number(assignment.xpReward || 0);
    return sum + Math.round((score / 100) * marks);
  }, 0);
  const marksPercentage = totalAvailableMarks
    ? Math.round((totalScoredMarks / totalAvailableMarks) * 100)
    : 0;

  const treeTypePerformanceGroups = useMemo(() => {
    const grouped = submissions.reduce((accumulator, submission) => {
      const treeType = submission.assignment?.treeType || "unknown";
      const currentGroup = accumulator.get(treeType) || {
        treeType,
        attempts: 0,
        averageScore: 0,
        totalMarksEarned: 0,
        totalMarksPossible: 0,
        assignments: [],
      };

      const possibleMarks = Number(submission.assignment?.xpReward || 0);
      const earnedMarks = Math.round((Number(submission.score || 0) / 100) * possibleMarks);

      currentGroup.attempts += 1;
      currentGroup.averageScore += Number(submission.score || 0);
      currentGroup.totalMarksEarned += earnedMarks;
      currentGroup.totalMarksPossible += possibleMarks;
      currentGroup.assignments.push({
        id: submission._id,
        title: submission.assignment?.title || "Assignment",
        score: Number(submission.score || 0),
        earnedMarks,
        possibleMarks,
        mistakes: submission.mistakes || [],
        suggestions: submission.suggestions || [],
        submittedAt: submission.submittedAt,
        submittedTree: submission.answers?.tree || null,
        correctTree: submission.correctTree || null,
      });

      accumulator.set(treeType, currentGroup);
      return accumulator;
    }, new Map());

    return [...grouped.values()]
      .map((group) => ({
        ...group,
        averageScore: Math.round(group.averageScore / group.attempts),
        assignments: group.assignments.sort(
          (left, right) => new Date(right.submittedAt) - new Date(left.submittedAt),
        ),
      }))
      .sort((left, right) => right.averageScore - left.averageScore);
  }, [submissions]);

  useEffect(() => {
    if (!treeTypePerformanceGroups.length) {
      setSelectedAnalyticsTreeType(null);
      return;
    }

    const stillExists = treeTypePerformanceGroups.some(
      (group) => group.treeType === selectedAnalyticsTreeType,
    );

    if (!stillExists) {
      setSelectedAnalyticsTreeType(null);
    }
  }, [selectedAnalyticsTreeType, treeTypePerformanceGroups]);

  const selectedTreeTypeGroup = treeTypePerformanceGroups.find(
    (group) => group.treeType === selectedAnalyticsTreeType,
  ) || null;

  useEffect(() => {
    if (!selectedTreeTypeGroup?.assignments?.length) {
      setSelectedAnalyticsAssignmentId(null);
      return;
    }

    const stillExists = selectedTreeTypeGroup.assignments.some(
      (assignmentEntry) => assignmentEntry.id === selectedAnalyticsAssignmentId,
    );

    if (!stillExists) {
      setSelectedAnalyticsAssignmentId(null);
    }
  }, [selectedAnalyticsAssignmentId, selectedTreeTypeGroup]);

  const selectedAnalyticsAssignment = selectedTreeTypeGroup?.assignments.find(
    (assignmentEntry) => assignmentEntry.id === selectedAnalyticsAssignmentId,
  ) || null;

  function formatTreeTypeLabel(treeType) {
    return String(treeType || "")
      .split("-")
      .map((part) => part.toUpperCase() === "BST" ? "BST" : part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function formatDate(dateValue) {
    if (!dateValue) {
      return "No submission date";
    }

    return new Date(dateValue).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function buildTreeComparison(assignmentEntry) {
    const submittedTree = assignmentEntry?.submittedTree || null;
    const correctTree = assignmentEntry?.correctTree || null;
    const submittedValues = collectValues(submittedTree);
    const correctValues = collectValues(correctTree);
    const missingValues = correctValues.filter((value) => !submittedValues.includes(value));
    const extraValues = submittedValues.filter((value) => !correctValues.includes(value));

    return {
      submittedNodeCount: countNodes(submittedTree),
      correctNodeCount: countNodes(correctTree),
      submittedHeight: treeHeight(submittedTree),
      correctHeight: treeHeight(correctTree),
      submittedTraversal: traverseTree(submittedTree, "inorder"),
      correctTraversal: traverseTree(correctTree, "inorder"),
      missingValues,
      extraValues,
    };
  }

  function handleAssignmentSelect(assignmentId) {
    setSelectedAssignmentId(assignmentId);
    setIsAssignmentRailOpen(false);
  }

  function handleAssignmentClose() {
    setSelectedAssignmentId(null);
    setAssignmentFilter("pending");
    setIsAssignmentRailOpen(true);
  }

  const noClassroomState = (
    <SectionCard title="No classroom selected" eyebrow="Join the right cohort first">
      <div className="rounded-[1.5rem] border border-dashed border-white/15 p-6 text-sm leading-7 text-slate-400 light:border-slate-300 light:text-slate-600">
        Join a classroom with your professor&apos;s code. Once a classroom is active, your assignments, submissions, and analytics stay inside that class instead of mixing with students from other sections or colleges.
      </div>
    </SectionCard>
  );

  return (
    <AppShell
      title="Student dashboard"
      subtitle="Start each assignment with an empty workspace, build the tree from scratch, and track your progress."
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
      {loading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : null}

      {!loading && activeTab === "classrooms" ? (
        <ClassroomHub
          role="student"
          classrooms={classrooms}
          activeClassroom={activeClassroom}
          onSwitchClassroom={handleSwitchClassroom}
          onJoinClassroom={handleJoinClassroom}
          switchingClassroom={switchingClassroom}
          mutatingClassroom={joiningClassroom}
        />
      ) : null}

      {!loading && activeTab === "assignments" ? (
        hasActiveClassroom ? (
          <div className="space-y-6">
          {isAssignmentRailOpen ? (
            <SectionCard
              title="Assigned work"
              eyebrow="Select an assignment"
              actions={
                assignments.length ? (
                  <button
                    type="button"
                    onClick={() => setIsAssignmentRailOpen(false)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-700"
                    aria-label="Collapse assignments panel"
                  >
                    <PanelLeftClose size={18} />
                  </button>
                ) : null
              }
            >
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 p-1 light:border-slate-200 light:bg-white/90">
                {[
                  { id: "pending", label: "Pending" },
                  { id: "attempted", label: "Attempted" },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setAssignmentFilter(option.id)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      assignmentFilter === option.id
                        ? "bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 text-white shadow-glow"
                        : "text-slate-300 hover:bg-white/10 hover:text-white light:text-slate-700 light:hover:bg-slate-100"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {filteredAssignments.length ? filteredAssignments.map((assignment) => (
                  <button
                    key={assignment._id}
                    type="button"
                    onClick={() => {
                      if (!assignment.submission) {
                        handleAssignmentSelect(assignment._id);
                      }
                    }}
                    disabled={Boolean(assignment.submission)}
                    className={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition ${
                      selectedAssignmentId === assignment._id
                        ? "border-cyan-300/50 bg-cyan-400/10 text-cyan-50"
                        : assignment.submission
                          ? "border-white/10 bg-white/5 text-slate-300 opacity-70 light:border-slate-200 light:bg-white light:text-slate-600"
                          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">
                          {assignment.treeType}
                        </p>
                        <h3 className="mt-2 font-display text-lg font-semibold">{assignment.title}</h3>
                      </div>
                      <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold">
                        {assignment.xpReward} Marks
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6">{assignment.description}</p>
                    {assignment.submission ? (
                      <p className="mt-3 text-xs text-emerald-300 light:text-emerald-700">
                        Submitted: {assignment.submission.score}%
                      </p>
                    ) : null}
                  </button>
                )) : (
                  <div className="rounded-[1.5rem] border border-dashed border-white/15 p-6 text-sm text-slate-400 light:border-slate-300 light:text-slate-600">
                    {assignmentFilter === "attempted"
                      ? "No attempted assignments yet."
                      : "No pending assignments right now."}
                  </div>
                )}
              </div>
            </SectionCard>
          ) : (
            <div className="flex">
              <button
                type="button"
                onClick={() => setIsAssignmentRailOpen(true)}
                className="flex h-[88px] items-center justify-center gap-3 rounded-[2rem] border border-white/10 bg-white/5 px-6 text-slate-100 transition hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-800"
                aria-label="Expand assignments panel"
              >
                <PanelLeftOpen size={22} />
                <GraduationCap size={22} />
                <span className="text-xs font-semibold uppercase tracking-[0.24em]">
                  Assignments
                </span>
              </button>
            </div>
          )}

          {assignmentFilter === "pending" ? (
            <StudentAssignmentWorkspace
              assignment={selectedAssignment}
              tree={solverHistory.present}
              onTreeChange={solverHistory.setPresent}
              onUndo={solverHistory.undo}
              onRedo={solverHistory.redo}
              canUndo={solverHistory.canUndo}
              canRedo={solverHistory.canRedo}
              onSubmit={submitAssignment}
              onClose={handleAssignmentClose}
              submitting={submittingAssignment}
            />
          ) : null}
          </div>
        ) : noClassroomState
      ) : null}

      {!loading && activeTab === "analytics" ? (
        hasActiveClassroom ? (
          <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <StatCard icon={Target} label="Accuracy" value={`${overview.accuracy}%`} helper="Overall assignment accuracy" tone="cyan" />
            <StatCard
              icon={Trophy}
              label="Marks scored"
              value={`${totalScoredMarks}/${totalAvailableMarks} (${marksPercentage}%)`}
              helper="Across all assigned assignments"
              tone="emerald"
            />
          </div>

          <AnalyticsCharts
            progress={analytics?.progress || []}
            assignmentBreakdown={analytics?.assignmentBreakdown || []}
          />

          <SectionCard title="Recent submissions" eyebrow="Browse by tree concept">
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              {treeTypePerformanceGroups.length ? treeTypePerformanceGroups.map((group) => (
                <button
                  key={group.treeType}
                  type="button"
                  onClick={() => setSelectedAnalyticsTreeType(group.treeType)}
                  className={`rounded-[1.75rem] border px-5 py-5 text-left transition ${
                    selectedAnalyticsTreeType === group.treeType
                      ? "border-cyan-300/60 bg-cyan-400/10 text-cyan-50"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">
                      {formatTreeTypeLabel(group.treeType)}
                    </p>
                    <BookOpenCheck size={18} />
                  </div>
                  <div className="mt-4 font-display text-3xl font-bold">
                    {group.totalMarksEarned}/{group.totalMarksPossible}
                  </div>
                  <p className="mt-2 text-sm text-slate-300 light:text-slate-600">
                    {group.attempts} assignment{group.attempts === 1 ? "" : "s"} completed
                  </p>
                  <p className="mt-1 text-sm text-slate-300 light:text-slate-600">
                    Average score: {group.averageScore}%
                  </p>
                </button>
              )) : (
                <div className="rounded-[1.5rem] border border-dashed border-white/15 p-6 text-sm text-slate-400 light:border-slate-300 light:text-slate-600">
                  Submit an assignment to start seeing your results here.
                </div>
              )}
            </div>
          </SectionCard>

          {selectedTreeTypeGroup ? (
            <SectionCard
              title={`${formatTreeTypeLabel(selectedTreeTypeGroup.treeType)} performance`}
              eyebrow="Assignment-by-assignment breakdown"
              actions={(
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAnalyticsTreeType(null);
                    setSelectedAnalyticsAssignmentId(null);
                  }}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-700"
                  aria-label="Clear analytics selection"
                >
                  <X size={18} />
                </button>
              )}
            >
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">Assignments</p>
                  <div className="mt-2 font-display text-3xl font-bold text-white light:text-slate-900">
                    {selectedTreeTypeGroup.attempts}
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">Marks</p>
                  <div className="mt-2 font-display text-3xl font-bold text-white light:text-slate-900">
                    {selectedTreeTypeGroup.totalMarksEarned}/{selectedTreeTypeGroup.totalMarksPossible}
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">Average score</p>
                  <div className="mt-2 font-display text-3xl font-bold text-white light:text-slate-900">
                    {selectedTreeTypeGroup.averageScore}%
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[320px,minmax(0,1fr)]">
                <div className="space-y-3">
                  {selectedTreeTypeGroup.assignments.map((assignmentEntry) => (
                    <button
                      key={assignmentEntry.id}
                      type="button"
                      onClick={() => setSelectedAnalyticsAssignmentId(assignmentEntry.id)}
                      className={`w-full rounded-[1.75rem] border p-4 text-left transition ${
                        selectedAnalyticsAssignmentId === assignmentEntry.id
                          ? "border-cyan-300/60 bg-cyan-400/10 text-cyan-50"
                          : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display text-lg font-semibold">{assignmentEntry.title}</h3>
                          <p className="mt-2 text-sm text-slate-300 light:text-slate-600">
                            {formatDate(assignmentEntry.submittedAt)}
                          </p>
                        </div>
                        <div className="rounded-full bg-slate-950/30 px-3 py-1 text-sm font-semibold light:bg-slate-100">
                          {assignmentEntry.score}%
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-slate-300 light:text-slate-600">
                        {assignmentEntry.earnedMarks}/{assignmentEntry.possibleMarks} marks
                      </p>
                    </button>
                  ))}
                </div>

                {selectedAnalyticsAssignment ? (
                  <div className="space-y-6">
                    <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 light:border-slate-200 light:bg-white">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">
                            Interactive assignment review
                          </p>
                          <h3 className="mt-2 font-display text-2xl font-semibold text-white light:text-slate-900">
                            {selectedAnalyticsAssignment.title}
                          </h3>
                          <p className="mt-2 text-sm text-slate-300 light:text-slate-600">
                            Submitted on {formatDate(selectedAnalyticsAssignment.submittedAt)}
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="rounded-[1.25rem] border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-right text-cyan-50 light:text-cyan-700">
                            <div className="font-display text-3xl font-bold">
                              {selectedAnalyticsAssignment.score}%
                            </div>
                            <p className="text-sm">
                              {selectedAnalyticsAssignment.earnedMarks}/{selectedAnalyticsAssignment.possibleMarks} marks
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedAnalyticsAssignmentId(null)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 light:border-slate-200 light:bg-slate-50 light:text-slate-700"
                            aria-label="Clear assignment review"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const comparison = buildTreeComparison(selectedAnalyticsAssignment);

                      return (
                        <>
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
                              <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">Submitted nodes</p>
                              <div className="mt-2 font-display text-3xl font-bold text-white light:text-slate-900">
                                {comparison.submittedNodeCount}
                              </div>
                            </div>
                            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
                              <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">Correct nodes</p>
                              <div className="mt-2 font-display text-3xl font-bold text-white light:text-slate-900">
                                {comparison.correctNodeCount}
                              </div>
                            </div>
                            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
                              <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">Submitted height</p>
                              <div className="mt-2 font-display text-3xl font-bold text-white light:text-slate-900">
                                {comparison.submittedHeight}
                              </div>
                            </div>
                            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
                              <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">Correct height</p>
                              <div className="mt-2 font-display text-3xl font-bold text-white light:text-slate-900">
                                {comparison.correctHeight}
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-6 xl:grid-cols-2">
                            <div className="rounded-[1.75rem] border border-cyan-300/15 bg-cyan-500/10 p-5">
                              <div className="mb-4 flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70 light:text-cyan-700">
                                    Your answer
                                  </p>
                                  <h4 className="mt-2 font-display text-xl font-semibold text-white light:text-slate-900">
                                    Submitted tree
                                  </h4>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setAnalyticsTreePreview({
                                      title: "Submitted tree",
                                      eyebrow: "Your answer",
                                      tree: selectedAnalyticsAssignment.submittedTree,
                                    })}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-700"
                                  >
                                    <Eye size={16} />
                                    View tree
                                  </button>
                                  <ArrowRightLeft className="text-cyan-200" size={18} />
                                </div>
                              </div>
                              <TreeVisualizer tree={selectedAnalyticsAssignment.submittedTree} height={360} />
                            </div>

                            <div className="rounded-[1.75rem] border border-emerald-300/15 bg-emerald-500/10 p-5">
                              <div className="mb-4 flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/70 light:text-emerald-700">
                                    Expected answer
                                  </p>
                                  <h4 className="mt-2 font-display text-xl font-semibold text-white light:text-slate-900">
                                    Correct tree
                                  </h4>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setAnalyticsTreePreview({
                                      title: "Correct tree",
                                      eyebrow: "Expected answer",
                                      tree: selectedAnalyticsAssignment.correctTree,
                                    })}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-700"
                                  >
                                    <Eye size={16} />
                                    View tree
                                  </button>
                                  <CheckCircle2 className="text-emerald-200" size={18} />
                                </div>
                              </div>
                              <TreeVisualizer tree={selectedAnalyticsAssignment.correctTree} height={360} />
                            </div>
                          </div>

                          <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
                            <div className="space-y-4">
                              <div className="rounded-[1.5rem] border border-amber-300/15 bg-amber-500/10 p-4">
                                <p className="text-sm font-semibold text-amber-100 light:text-amber-700">
                                  Comparison analysis
                                </p>
                                <div className="mt-3 space-y-2 text-sm text-slate-200 light:text-slate-700">
                                  <div className="rounded-2xl bg-slate-950/25 px-3 py-2 light:bg-white">
                                    Missing values: {comparison.missingValues.length ? comparison.missingValues.join(", ") : "None"}
                                  </div>
                                  <div className="rounded-2xl bg-slate-950/25 px-3 py-2 light:bg-white">
                                    Extra values: {comparison.extraValues.length ? comparison.extraValues.join(", ") : "None"}
                                  </div>
                                  <div className="rounded-2xl bg-slate-950/25 px-3 py-2 light:bg-white">
                                    Your inorder: {comparison.submittedTraversal.length ? comparison.submittedTraversal.join(" -> ") : "Empty"}
                                  </div>
                                  <div className="rounded-2xl bg-slate-950/25 px-3 py-2 light:bg-white">
                                    Correct inorder: {comparison.correctTraversal.length ? comparison.correctTraversal.join(" -> ") : "Empty"}
                                  </div>
                                </div>
                              </div>

                              <div className="rounded-[1.5rem] border border-rose-300/15 bg-rose-500/10 p-4">
                                <div className="flex items-center gap-2">
                                  <CircleAlert className="text-rose-200" size={18} />
                                  <p className="text-sm font-semibold text-rose-100 light:text-rose-700">
                                    Mistakes
                                  </p>
                                </div>
                                <div className="mt-3 space-y-2">
                                  {selectedAnalyticsAssignment.mistakes.length ? selectedAnalyticsAssignment.mistakes.map((mistake) => (
                                    <div
                                      key={mistake}
                                      className="rounded-2xl bg-slate-950/25 px-3 py-2 text-sm text-slate-200 light:bg-white light:text-slate-700"
                                    >
                                      {mistake}
                                    </div>
                                  )) : (
                                    <div className="rounded-2xl bg-slate-950/25 px-3 py-2 text-sm text-slate-200 light:bg-white light:text-slate-700">
                                      No mistakes recorded.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="rounded-[1.5rem] border border-emerald-300/15 bg-emerald-500/10 p-4">
                              <p className="text-sm font-semibold text-emerald-100 light:text-emerald-700">
                                Suggestions and improvements
                              </p>
                              <div className="mt-3 space-y-3">
                                {selectedAnalyticsAssignment.suggestions.length ? selectedAnalyticsAssignment.suggestions.map((suggestion, index) => (
                                  <div
                                    key={`${selectedAnalyticsAssignment.id}-${index}`}
                                    className="rounded-[1.25rem] bg-slate-950/25 px-4 py-3 text-sm text-slate-200 light:bg-white light:text-slate-700"
                                  >
                                    {suggestion}
                                  </div>
                                )) : (
                                  <div className="rounded-[1.25rem] bg-slate-950/25 px-4 py-3 text-sm text-slate-200 light:bg-white light:text-slate-700">
                                    No improvement suggestions recorded.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : null}
              </div>
            </SectionCard>
          ) : null}
          </div>
        ) : noClassroomState
      ) : null}

      {analyticsTreePreview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 py-8">
          <div className="glass-panel section-gradient flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden p-5">
            <div className="flex items-center justify-between gap-3 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300/80 light:text-indigo-600">
                  {analyticsTreePreview.eyebrow}
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-white light:text-slate-900">
                  {analyticsTreePreview.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAnalyticsTreePreview(null)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 light:border-slate-200 light:bg-slate-50 light:text-slate-700"
                aria-label="Close tree preview"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-2">
              <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/25 p-4 light:border-slate-200 light:bg-slate-50">
                <TreeVisualizer tree={analyticsTreePreview.tree} height={520} showStats />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
