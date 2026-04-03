import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Activity,
  BarChart3,
  BookOpen,
  Brain,
  Network,
  Presentation,
  Users,
  WandSparkles,
} from "lucide-react";

import api from "../api/client.js";
import AnalyticsCharts from "../components/AnalyticsCharts.jsx";
import AppShell from "../components/AppShell.jsx";
import AssignmentEditor from "../components/AssignmentEditor.jsx";
import LeaderboardCard from "../components/LeaderboardCard.jsx";
import SectionCard from "../components/SectionCard.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import StatCard from "../components/StatCard.jsx";
import TreeOperationPanel from "../components/TreeOperationPanel.jsx";
import TreeVisualizer from "../components/TreeVisualizer.jsx";
import LiveSessionPanel from "../components/LiveSessionPanel.jsx";
import useHistoryState from "../hooks/useHistoryState.js";
import { useAuth } from "../context/AuthContext.jsx";

const tabs = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "studio", label: "Lesson Studio", icon: WandSparkles },
  { id: "assignments", label: "Assignments", icon: Brain },
  { id: "live", label: "Live Mode", icon: Presentation },
  { id: "analytics", label: "Analytics", icon: Activity },
];

const initialLessonForm = {
  title: "",
  summary: "",
  type: "bst",
  difficulty: "Intermediate",
  durationMinutes: 20,
};

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [lessonForm, setLessonForm] = useState(initialLessonForm);
  const [builderNotes, setBuilderNotes] = useState([]);
  const [builderHighlights, setBuilderHighlights] = useState([]);
  const [latestTraversal, setLatestTraversal] = useState(null);
  const builderHistory = useHistoryState(null);

  async function loadDashboard() {
    try {
      setLoading(true);
      const [lessonsResponse, assignmentsResponse, analyticsResponse] = await Promise.all([
        api.get("/lessons"),
        api.get("/assignments"),
        api.get("/analytics/teacher/overview"),
      ]);

      setLessons(lessonsResponse.data.lessons);
      setAssignments(assignmentsResponse.data.assignments);
      setAnalytics(analyticsResponse.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load teacher dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  function updateLessonField(name, value) {
    setLessonForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleBuilderTreeChange(nextTree) {
    builderHistory.setPresent(nextTree);
    if (!nextTree) {
      setBuilderHighlights([]);
    }
  }

  function toggleHighlight(nodeId) {
    setBuilderHighlights((current) =>
      current.includes(nodeId) ? current.filter((id) => id !== nodeId) : [...current, nodeId],
    );
  }

  async function createLesson(event) {
    event.preventDefault();

    try {
      const payload = {
        title: lessonForm.title,
        summary: lessonForm.summary,
        type: lessonForm.type,
        difficulty: lessonForm.difficulty,
        durationMinutes: Number(lessonForm.durationMinutes),
        content: [
          {
            heading: "Lesson overview",
            body: lessonForm.summary,
          },
          {
            heading: "Teaching focus",
            body:
              "Use the workspace builder to demonstrate insertions, deletions, traversal, highlighting, and live explanation patterns.",
          },
        ],
        visualizationData: {
          tree: builderHistory.present,
          steps: builderNotes.map((note, index) => ({
            id: `${note}-${index}`,
            description: note,
            tree: builderHistory.present,
            highlights: builderHighlights,
          })),
          keyTakeaways: [
            "Lessons can be paired with live classroom walkthroughs.",
            "Tree visuals and textual explanation stay in sync inside the dashboard.",
          ],
        },
      };

      await api.post("/lessons", payload);
      toast.success("Lesson created.");
      setLessonForm(initialLessonForm);
      loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create lesson.");
    }
  }

  const overview = analytics?.overview || {
    totalStudents: 0,
    activeAssignments: 0,
    averageScore: 0,
    liveSessionsEnabled: 0,
  };

  return (
    <AppShell
      title="Teacher dashboard"
      subtitle="Create visual lessons, build tree scenarios, launch live sessions, and monitor how every learner is performing across Binary Tree, BST, AVL, and Red-Black topics."
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

      {!loading && activeTab === "overview" ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Users} label="Students" value={overview.totalStudents} helper="Tracked learners in the workspace" tone="cyan" />
            <StatCard icon={Brain} label="Assignments" value={overview.activeAssignments} helper="Active assessment packs" tone="emerald" />
            <StatCard icon={BarChart3} label="Average score" value={`${overview.averageScore}%`} helper="Across recorded submissions" tone="amber" />
            <StatCard icon={Presentation} label="Live-ready sets" value={overview.liveSessionsEnabled} helper="Assignments supporting live mode" tone="rose" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
            <SectionCard title="Recently authored lessons" eyebrow="Content">
              <div className="space-y-3">
                {lessons.slice(0, 4).map((lesson) => (
                  <div
                    key={lesson._id}
                    className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 light:border-slate-200 light:bg-white"
                  >
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{lesson.type}</p>
                    <h3 className="mt-2 font-display text-lg font-semibold text-white light:text-slate-900">
                      {lesson.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-300 light:text-slate-700">{lesson.summary}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Submission signals" eyebrow="Classroom pulse">
              <div className="space-y-3">
                {(analytics?.recentSubmissions || []).map((submission) => (
                  <div
                    key={submission._id}
                    className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 light:border-slate-200 light:bg-white"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white light:text-slate-900">
                          {submission.student?.name}
                        </p>
                        <p className="text-sm text-slate-400 light:text-slate-600">
                          {submission.assignment?.title}
                        </p>
                      </div>
                      <div className="font-display text-2xl font-bold text-cyan-200 light:text-cyan-700">
                        {submission.score}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      ) : null}

      {!loading && activeTab === "studio" ? (
        <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
          <SectionCard title="Create a lesson" eyebrow="Authoring">
            <form onSubmit={createLesson} className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm text-slate-300 light:text-slate-700">Title</span>
                <input
                  value={lessonForm.title}
                  onChange={(event) => updateLessonField("title", event.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white light:border-slate-200 light:bg-white light:text-slate-900"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm text-slate-300 light:text-slate-700">Summary</span>
                <textarea
                  value={lessonForm.summary}
                  onChange={(event) => updateLessonField("summary", event.target.value)}
                  rows="4"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white light:border-slate-200 light:bg-white light:text-slate-900"
                />
              </label>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-sm text-slate-300 light:text-slate-700">Type</span>
                  <select
                    value={lessonForm.type}
                    onChange={(event) => updateLessonField("type", event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white light:border-slate-200 light:bg-white light:text-slate-900"
                  >
                    <option value="binary-tree">Binary Tree</option>
                    <option value="bst">BST</option>
                    <option value="avl">AVL</option>
                    <option value="red-black">Red-Black</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-slate-300 light:text-slate-700">Difficulty</span>
                  <select
                    value={lessonForm.difficulty}
                    onChange={(event) => updateLessonField("difficulty", event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white light:border-slate-200 light:bg-white light:text-slate-900"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-slate-300 light:text-slate-700">Duration</span>
                  <input
                    type="number"
                    value={lessonForm.durationMinutes}
                    onChange={(event) => updateLessonField("durationMinutes", event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white light:border-slate-200 light:bg-white light:text-slate-900"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 font-semibold text-slate-950"
              >
                Save lesson
              </button>
            </form>
          </SectionCard>

          <SectionCard title="Live tree builder" eyebrow="Interactive preview">
            <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
              <TreeVisualizer
                tree={builderHistory.present}
                highlights={builderHighlights}
                onNodeClick={toggleHighlight}
                height={380}
              />
              <TreeOperationPanel
                treeType={lessonForm.type}
                tree={builderHistory.present}
                onTreeChange={handleBuilderTreeChange}
                onTraversalLogged={setLatestTraversal}
                onResetNotes={setBuilderNotes}
                notes={builderNotes}
                onUndo={builderHistory.undo}
                onRedo={builderHistory.redo}
                canUndo={builderHistory.canUndo}
                canRedo={builderHistory.canRedo}
                title="Build a lesson tree"
              />
            </div>
            {builderHighlights.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {builderHighlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100 light:text-cyan-700"
                  >
                    Highlighted node {highlight.slice(0, 6)}
                  </span>
                ))}
              </div>
            ) : null}
          </SectionCard>
        </div>
      ) : null}

      {!loading && activeTab === "assignments" ? (
        <div className="space-y-6">
          <AssignmentEditor lessons={lessons} initialTree={builderHistory.present} onCreated={loadDashboard} />
          <SectionCard title="Published assignments" eyebrow="Assessment library">
            <div className="grid gap-4 xl:grid-cols-2">
              {assignments.map((assignment) => (
                <div
                  key={assignment._id}
                  className="rounded-[2rem] border border-white/10 bg-white/5 p-5 light:border-slate-200 light:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                        {assignment.treeType}
                      </p>
                      <h3 className="mt-2 font-display text-xl font-semibold text-white light:text-slate-900">
                        {assignment.title}
                      </h3>
                    </div>
                    <div className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100 light:text-cyan-700">
                      {assignment.xpReward} XP
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-300 light:text-slate-700">
                    {assignment.description}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      ) : null}

      {!loading && activeTab === "live" ? (
        <div className="grid gap-6 xl:grid-cols-[1.08fr,0.92fr]">
          <SectionCard title="Broadcast tree canvas" eyebrow="Teacher-controlled">
            <TreeVisualizer
              tree={builderHistory.present}
              highlights={builderHighlights}
              onNodeClick={toggleHighlight}
              height={420}
            />
            <p className="mt-4 text-sm text-slate-300 light:text-slate-700">
              Click nodes to highlight them before broadcasting. Any tree edits from the builder are sent to connected students in real time.
            </p>
          </SectionCard>

          <LiveSessionPanel
            mode="teacher"
            user={user}
            tree={builderHistory.present}
            treeType={lessonForm.type}
            highlights={builderHighlights}
            latestTraversal={latestTraversal}
          />
        </div>
      ) : null}

      {!loading && activeTab === "analytics" ? (
        <div className="space-y-6">
          <AnalyticsCharts
            mistakeHeatmap={analytics?.mistakeHeatmap || []}
            treeTypePerformance={analytics?.treeTypePerformance || []}
          />
          <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
            <SectionCard title="Student leaderboard table" eyebrow="Performance detail">
              <div className="space-y-3">
                {(analytics?.studentPerformance || []).map((student) => (
                  <div
                    key={student.studentId}
                    className="flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 light:border-slate-200 light:bg-white"
                  >
                    <div>
                      <p className="font-medium text-white light:text-slate-900">{student.name}</p>
                      <p className="text-sm text-slate-400 light:text-slate-600">
                        {student.attempts} attempts • Level {student.level}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-xl font-bold text-cyan-200 light:text-cyan-700">
                        {student.averageScore}%
                      </div>
                      <p className="text-sm text-slate-400 light:text-slate-600">
                        {student.xp} XP
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
            <LeaderboardCard leaderboard={analytics?.leaderboard || []} />
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
