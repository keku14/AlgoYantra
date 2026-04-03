import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { GraduationCap, LineChart, Target, Trophy } from "lucide-react";

import { createBlankTreeFromTemplate, simulateOperations } from "@algoyantra/shared";

import api from "../api/client.js";
import AnalyticsCharts from "../components/AnalyticsCharts.jsx";
import AppShell from "../components/AppShell.jsx";
import ResultExportCard from "../components/ResultExportCard.jsx";
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

function getAssignmentSolutionTree(assignment) {
  if (!assignment) {
    return null;
  }

  if (assignment.solutionTree) {
    return assignment.solutionTree;
  }

  return simulateOperations({
    treeType: assignment.treeType,
    initialTree: assignment.initialTree || null,
    operations: assignment.operations || [],
    recordSteps: false,
  }).tree;
}

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
  const selectedAssignmentTemplate = useMemo(
    () => createBlankTreeFromTemplate(getAssignmentSolutionTree(selectedAssignment)),
    [selectedAssignment],
  );

  useEffect(() => {
    solverHistory.reset(selectedAssignmentTemplate);
    setResult(null);
  }, [selectedAssignmentId, selectedAssignmentTemplate]);

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
    level: user?.level || 1,
  };

  const latestSubmissionEvaluation = result
    ? result
    : submissions[0]
      ? {
          score: submissions[0].score,
          mistakes: submissions[0].mistakes,
          suggestions: submissions[0].suggestions,
          correctTree: submissions[0].correctTree,
        }
      : null;

  return (
    <AppShell
      title="Student dashboard"
      subtitle="Solve your assignments directly in the tree workspace and keep track of your performance."
      user={user}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {loading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : null}

      {!loading && activeTab === "assignments" ? (
        <div className="grid gap-6 xl:grid-cols-[0.35fr,0.65fr]">
          <SectionCard title="Assigned work" eyebrow="Select an assignment">
            <div className="space-y-3">
              {assignments.length ? assignments.map((assignment) => (
                <button
                  key={assignment._id}
                  type="button"
                  onClick={() => setSelectedAssignmentId(assignment._id)}
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
                      {assignment.xpReward} XP
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <StatCard icon={Target} label="Accuracy" value={`${overview.accuracy}%`} helper="Overall assignment accuracy" tone="cyan" />
            <StatCard icon={Trophy} label="XP" value={overview.totalXp} helper="Earned from assignments" tone="emerald" />
            <StatCard icon={GraduationCap} label="Level" value={overview.level} helper="Current student level" tone="amber" />
          </div>

          <AnalyticsCharts
            progress={analytics?.progress || []}
            assignmentBreakdown={analytics?.assignmentBreakdown || []}
          />

          <SectionCard title="Performance history" eyebrow="Recent submissions">
            <div className="space-y-3">
              {submissions.length ? submissions.map((submission) => (
                <div
                  key={submission._id}
                  className="flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 light:border-slate-200 light:bg-white"
                >
                  <div>
                    <p className="font-medium text-white light:text-slate-900">
                      {submission.assignment?.title}
                    </p>
                    <p className="text-sm text-slate-400 light:text-slate-600">
                      {submission.assignment?.treeType}
                    </p>
                  </div>
                  <div className="font-display text-2xl font-bold text-cyan-200 light:text-cyan-700">
                    {submission.score}%
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.5rem] border border-dashed border-white/15 p-6 text-sm text-slate-400 light:border-slate-300 light:text-slate-600">
                  Submit an assignment to start seeing your results here.
                </div>
              )}
            </div>
          </SectionCard>

          <ResultExportCard assignment={selectedAssignment} evaluation={latestSubmissionEvaluation} />
        </div>
      ) : null}
    </AppShell>
  );
}
