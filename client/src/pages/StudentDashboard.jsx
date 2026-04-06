import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { BookOpenCheck, GraduationCap, LineChart, PanelLeftClose, PanelLeftOpen, Target, Trophy } from "lucide-react";

import api from "../api/client.js";
import AnalyticsCharts from "../components/AnalyticsCharts.jsx";
import AppShell from "../components/AppShell.jsx";
import SectionCard from "../components/SectionCard.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import StatCard from "../components/StatCard.jsx";
import StudentAssignmentWorkspace from "../components/StudentAssignmentWorkspace.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import useHistoryState from "../hooks/useHistoryState.js";

const tabs = [
  { id: "assignments", label: "Assignments", icon: GraduationCap },
  { id: "analytics", label: "Analytics", icon: LineChart },
];

export default function StudentDashboard() {
  const { user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("assignments");
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [result, setResult] = useState(null);
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  const [isAssignmentRailOpen, setIsAssignmentRailOpen] = useState(true);
  const [selectedAnalyticsTreeType, setSelectedAnalyticsTreeType] = useState(null);
  const solverHistory = useHistoryState(null);

  async function loadDashboard() {
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
      toast.error(error.response?.data?.message || "Failed to load student dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!selectedAssignmentId && assignments.length) {
      setSelectedAssignmentId(assignments[0]._id);
    }
  }, [assignments, selectedAssignmentId]);

  const selectedAssignment =
    assignments.find((assignment) => assignment._id === selectedAssignmentId) || null;

  useEffect(() => {
    solverHistory.reset(null);
    setResult(null);
  }, [selectedAssignmentId]);

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

    if (!selectedAnalyticsTreeType) {
      setSelectedAnalyticsTreeType(treeTypePerformanceGroups[0].treeType);
      return;
    }

    const stillExists = treeTypePerformanceGroups.some(
      (group) => group.treeType === selectedAnalyticsTreeType,
    );

    if (!stillExists) {
      setSelectedAnalyticsTreeType(treeTypePerformanceGroups[0].treeType);
    }
  }, [selectedAnalyticsTreeType, treeTypePerformanceGroups]);

  const selectedTreeTypeGroup = treeTypePerformanceGroups.find(
    (group) => group.treeType === selectedAnalyticsTreeType,
  ) || null;

  function formatTreeTypeLabel(treeType) {
    return String(treeType || "")
      .split("-")
      .map((part) => part.toUpperCase() === "BST" ? "BST" : part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function handleAssignmentSelect(assignmentId) {
    setSelectedAssignmentId(assignmentId);
    setIsAssignmentRailOpen(false);
  }

  return (
    <AppShell
      title="Student dashboard"
      subtitle="Start each assignment with an empty workspace, build the tree from scratch, and track your progress."
      user={user}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      hideHeader
    >
      {loading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : null}

      {!loading && activeTab === "assignments" ? (
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
              <div className="space-y-3">
                {assignments.length ? assignments.map((assignment) => (
                  <button
                    key={assignment._id}
                    type="button"
                    onClick={() => handleAssignmentSelect(assignment._id)}
                    className={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition ${
                      selectedAssignmentId === assignment._id
                        ? "border-cyan-300/50 bg-cyan-400/10 text-cyan-50"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
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
                    No assignments available yet.
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

          <StudentAssignmentWorkspace
            assignment={selectedAssignment}
            tree={solverHistory.present}
            onTreeChange={solverHistory.setPresent}
            onUndo={solverHistory.undo}
            onRedo={solverHistory.redo}
            canUndo={solverHistory.canUndo}
            canRedo={solverHistory.canRedo}
            onSubmit={submitAssignment}
            submitting={submittingAssignment}
          />
        </div>
      ) : null}

      {!loading && activeTab === "analytics" ? (
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
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
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
            >
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Assignments</p>
                  <div className="mt-2 font-display text-3xl font-bold text-white light:text-slate-900">
                    {selectedTreeTypeGroup.attempts}
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Marks</p>
                  <div className="mt-2 font-display text-3xl font-bold text-white light:text-slate-900">
                    {selectedTreeTypeGroup.totalMarksEarned}/{selectedTreeTypeGroup.totalMarksPossible}
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Average score</p>
                  <div className="mt-2 font-display text-3xl font-bold text-white light:text-slate-900">
                    {selectedTreeTypeGroup.averageScore}%
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {selectedTreeTypeGroup.assignments.map((assignmentEntry) => (
                  <div
                    key={assignmentEntry.id}
                    className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 light:border-slate-200 light:bg-white"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="font-display text-xl font-semibold text-white light:text-slate-900">
                          {assignmentEntry.title}
                        </h3>
                        <p className="mt-2 text-sm text-slate-300 light:text-slate-600">
                          Marks: {assignmentEntry.earnedMarks}/{assignmentEntry.possibleMarks}
                        </p>
                      </div>
                      <div className="rounded-full bg-cyan-400/10 px-4 py-2 font-semibold text-cyan-100 light:text-cyan-700">
                        {assignmentEntry.score}%
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-[1.5rem] border border-rose-300/15 bg-rose-500/10 p-4">
                        <p className="text-sm font-semibold text-rose-100 light:text-rose-700">
                          Mistakes
                        </p>
                        <div className="mt-3 space-y-2">
                          {assignmentEntry.mistakes.length ? assignmentEntry.mistakes.map((mistake) => (
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

                      <div className="rounded-[1.5rem] border border-emerald-300/15 bg-emerald-500/10 p-4">
                        <p className="text-sm font-semibold text-emerald-100 light:text-emerald-700">
                          Correction suggestions
                        </p>
                        <div className="mt-3 space-y-2">
                          {assignmentEntry.suggestions.length ? assignmentEntry.suggestions.map((suggestion) => (
                            <div
                              key={suggestion}
                              className="rounded-2xl bg-slate-950/25 px-3 py-2 text-sm text-slate-200 light:bg-white light:text-slate-700"
                            >
                              {suggestion}
                            </div>
                          )) : (
                            <div className="rounded-2xl bg-slate-950/25 px-3 py-2 text-sm text-slate-200 light:bg-white light:text-slate-700">
                              No correction suggestions recorded.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}
