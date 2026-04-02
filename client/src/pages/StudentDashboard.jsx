import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  BookOpen,
  Flame,
  GraduationCap,
  Network,
  Target,
  Trophy,
  WandSparkles,
} from "lucide-react";

import api from "../api/client.js";
import AnalyticsCharts from "../components/AnalyticsCharts.jsx";
import AppShell from "../components/AppShell.jsx";
import LeaderboardCard from "../components/LeaderboardCard.jsx";
import LessonPlayer from "../components/LessonPlayer.jsx";
import LiveSessionPanel from "../components/LiveSessionPanel.jsx";
import ResultExportCard from "../components/ResultExportCard.jsx";
import SectionCard from "../components/SectionCard.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import StatCard from "../components/StatCard.jsx";
import TreeOperationPanel from "../components/TreeOperationPanel.jsx";
import TreeVisualizer from "../components/TreeVisualizer.jsx";
import useHistoryState from "../hooks/useHistoryState.js";
import { useAuth } from "../context/AuthContext.jsx";

const tabs = [
  { id: "learn", label: "Learn", icon: BookOpen },
  { id: "practice", label: "Practice", icon: WandSparkles },
  { id: "assignments", label: "Assignments", icon: GraduationCap },
  { id: "live", label: "Live Class", icon: Network },
  { id: "results", label: "Results", icon: Trophy },
];

export default function StudentDashboard() {
  const { user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("learn");
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [practiceType, setPracticeType] = useState("bst");
  const [practiceNotes, setPracticeNotes] = useState([]);
  const [practiceTraversal, setPracticeTraversal] = useState(null);
  const [solverNotes, setSolverNotes] = useState([]);
  const [solverTraversals, setSolverTraversals] = useState([]);
  const [result, setResult] = useState(null);
  const [liveState, setLiveState] = useState(null);
  const practiceHistory = useHistoryState(null);
  const solverHistory = useHistoryState(null);

  async function loadDashboard() {
    try {
      setLoading(true);
      const [
        lessonsResponse,
        assignmentsResponse,
        analyticsResponse,
        submissionsResponse,
      ] = await Promise.all([
        api.get("/lessons"),
        api.get("/assignments"),
        api.get("/analytics/student/overview"),
        api.get("/submissions/mine"),
      ]);

      setLessons(lessonsResponse.data.lessons);
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
    if (!selectedLessonId && lessons.length) {
      setSelectedLessonId(lessons[0]._id);
    }
  }, [lessons, selectedLessonId]);

  useEffect(() => {
    if (!selectedAssignmentId && assignments.length) {
      setSelectedAssignmentId(assignments[0]._id);
    }
  }, [assignments, selectedAssignmentId]);

  useEffect(() => {
    practiceHistory.reset(null);
    setPracticeNotes([]);
    setPracticeTraversal(null);
  }, [practiceType]);

  const selectedAssignment = assignments.find((assignment) => assignment._id === selectedAssignmentId) || null;
  const selectedLesson = lessons.find((lesson) => lesson._id === selectedLessonId) || null;

  useEffect(() => {
    solverHistory.reset(selectedAssignment?.initialTree || null);
    setSolverNotes([]);
    setSolverTraversals([]);
    setResult(null);
  }, [selectedAssignmentId]);

  async function submitAssignment() {
    if (!selectedAssignment) {
      return;
    }

    try {
      const { data } = await api.post(`/submissions/${selectedAssignment._id}`, {
        tree: solverHistory.present,
        traversals: solverTraversals,
        notes: solverNotes,
      });

      setResult(data.evaluation);
      toast.success(`Submission scored: ${data.evaluation.score}%`);
      await refreshProfile();
      await loadDashboard();
      setActiveTab("results");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit assignment.");
    }
  }

  const overview = analytics?.overview || {
    accuracy: 0,
    totalXp: user?.xp || 0,
    level: user?.level || 1,
    streak: user?.streak || 0,
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
      subtitle="Study lessons, practice algorithms locally, join live teaching sessions, and submit tree assignments with real DSA validation and detailed feedback."
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

      {!loading && activeTab === "learn" ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Target} label="Accuracy" value={`${overview.accuracy}%`} helper="Overall evaluated correctness" tone="cyan" />
            <StatCard icon={Trophy} label="XP" value={overview.totalXp} helper="Earned from assignments" tone="emerald" />
            <StatCard icon={GraduationCap} label="Level" value={overview.level} helper="Gamified progress tier" tone="amber" />
            <StatCard icon={Flame} label="Streak" value={overview.streak} helper="Consecutive active days" tone="rose" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.42fr,0.58fr]">
            <SectionCard title="Lesson library" eyebrow="Choose a topic">
              <div className="space-y-3">
                {lessons.map((lesson) => (
                  <button
                    key={lesson._id}
                    type="button"
                    onClick={() => setSelectedLessonId(lesson._id)}
                    className={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition ${
                      selectedLessonId === lesson._id
                        ? "border-cyan-300/50 bg-cyan-400/10 text-cyan-50"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-700"
                    }`}
                  >
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{lesson.type}</p>
                    <h3 className="mt-2 font-display text-lg font-semibold">{lesson.title}</h3>
                    <p className="mt-2 text-sm leading-6">{lesson.summary}</p>
                  </button>
                ))}
              </div>
            </SectionCard>
            <LessonPlayer lesson={selectedLesson} />
          </div>
        </div>
      ) : null}

      {!loading && activeTab === "practice" ? (
        <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <SectionCard
            title="Practice workspace"
            eyebrow="Build manually"
            actions={
              <select
                value={practiceType}
                onChange={(event) => setPracticeType(event.target.value)}
                className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white light:border-slate-200 light:bg-white light:text-slate-900"
              >
                <option value="binary-tree">Binary Tree</option>
                <option value="bst">BST</option>
                <option value="avl">AVL</option>
                <option value="red-black">Red-Black</option>
              </select>
            }
          >
            <TreeVisualizer tree={practiceHistory.present} height={420} />
          </SectionCard>

          <TreeOperationPanel
            treeType={practiceType}
            tree={practiceHistory.present}
            onTreeChange={practiceHistory.setPresent}
            onTraversalLogged={setPracticeTraversal}
            notes={practiceNotes}
            onResetNotes={setPracticeNotes}
            onUndo={practiceHistory.undo}
            onRedo={practiceHistory.redo}
            canUndo={practiceHistory.canUndo}
            canRedo={practiceHistory.canRedo}
            title="Practice operations"
          />

          {practiceTraversal ? (
            <SectionCard title="Traversal playback" eyebrow="Latest run" className="xl:col-span-2">
              <div className="rounded-[2rem] border border-emerald-300/15 bg-emerald-500/10 p-4 text-sm text-emerald-50 light:text-emerald-700">
                {practiceTraversal.order}: {practiceTraversal.values.join(" -> ") || "empty tree"}
              </div>
            </SectionCard>
          ) : null}
        </div>
      ) : null}

      {!loading && activeTab === "assignments" ? (
        <div className="grid gap-6 xl:grid-cols-[0.42fr,0.58fr]">
          <SectionCard title="Assigned work" eyebrow="Select a challenge">
            <div className="space-y-3">
              {assignments.map((assignment) => (
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
              ))}
            </div>
          </SectionCard>

          <div className="space-y-6">
            <SectionCard title={selectedAssignment?.title || "Assignment solver"} eyebrow="Interactive editor">
              <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
                <TreeVisualizer tree={solverHistory.present} height={400} />
                <TreeOperationPanel
                  treeType={selectedAssignment?.treeType || "bst"}
                  tree={solverHistory.present}
                  onTreeChange={solverHistory.setPresent}
                  onTraversalLogged={(entry) =>
                    setSolverTraversals((current) => [...current, entry])
                  }
                  notes={solverNotes}
                  onResetNotes={setSolverNotes}
                  onUndo={solverHistory.undo}
                  onRedo={solverHistory.redo}
                  canUndo={solverHistory.canUndo}
                  canRedo={solverHistory.canRedo}
                  title="Solver controls"
                />
              </div>

              {selectedAssignment ? (
                <div className="mt-4 rounded-[2rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
                  <p className="text-sm text-slate-300 light:text-slate-700">
                    <span className="font-semibold text-white light:text-slate-900">Constraints:</span>{" "}
                    {selectedAssignment.constraints?.minValue} to {selectedAssignment.constraints?.maxValue},{" "}
                    duplicates {selectedAssignment.constraints?.allowDuplicates === false ? "not allowed" : "allowed"}
                  </p>
                  <button
                    type="button"
                    onClick={submitAssignment}
                    className="mt-4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 font-semibold text-slate-950"
                  >
                    Submit assignment
                  </button>
                </div>
              ) : null}
            </SectionCard>
          </div>
        </div>
      ) : null}

      {!loading && activeTab === "live" ? (
        <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <SectionCard title="Classroom stream" eyebrow="Teacher broadcast">
            <TreeVisualizer
              tree={liveState?.tree}
              highlights={liveState?.highlights || []}
              height={420}
            />
            {liveState?.traversal?.order ? (
              <div className="mt-4 rounded-[2rem] border border-emerald-300/15 bg-emerald-500/10 p-4 text-sm text-emerald-50 light:text-emerald-700">
                Live traversal {liveState.traversal.order}: {liveState.traversal.values.join(" -> ")}
              </div>
            ) : null}
          </SectionCard>
          <LiveSessionPanel
            mode="student"
            user={user}
            tree={null}
            treeType="bst"
            highlights={[]}
            latestTraversal={null}
            onRemoteState={setLiveState}
          />
        </div>
      ) : null}

      {!loading && activeTab === "results" ? (
        <div className="space-y-6">
          <AnalyticsCharts
            progress={analytics?.progress || []}
            assignmentBreakdown={analytics?.assignmentBreakdown || []}
          />
          <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
            <SectionCard title="Performance history" eyebrow="Recent submissions">
              <div className="space-y-3">
                {submissions.map((submission) => (
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
                      {submission.score}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
            <LeaderboardCard leaderboard={analytics?.leaderboard || []} />
          </div>
          <ResultExportCard assignment={selectedAssignment} evaluation={latestSubmissionEvaluation} />
        </div>
      ) : null}
    </AppShell>
  );
}
