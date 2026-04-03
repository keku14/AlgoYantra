import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Activity, Brain, Target, Trophy, Users } from "lucide-react";

import api from "../api/client.js";
import AnalyticsCharts from "../components/AnalyticsCharts.jsx";
import AppShell from "../components/AppShell.jsx";
import AssignmentEditor from "../components/AssignmentEditor.jsx";
import SectionCard from "../components/SectionCard.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import StatCard from "../components/StatCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const tabs = [
  { id: "assignments", label: "Assignments", icon: Brain },
  { id: "analytics", label: "Analytics", icon: Activity },
];

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("assignments");
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);

  async function loadDashboard() {
    try {
      setLoading(true);
      const [assignmentsResponse, analyticsResponse] = await Promise.all([
        api.get("/assignments"),
        api.get("/analytics/teacher/overview"),
      ]);

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

  useEffect(() => {
    if (!selectedAssignmentId && assignments.length) {
      setSelectedAssignmentId(assignments[0]._id);
    }
  }, [assignments, selectedAssignmentId]);

  useEffect(() => {
    async function loadAssignmentSubmissions() {
      if (!selectedAssignmentId) {
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
  }, [selectedAssignmentId]);

  const overview = analytics?.overview || {
    totalStudents: 0,
    activeAssignments: 0,
    averageScore: 0,
  };

  const selectedAssignment =
    assignments.find((assignment) => assignment._id === selectedAssignmentId) || null;
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

  return (
    <AppShell
      title="Teacher dashboard"
      subtitle="Create assignments for students and review results assignment by assignment."
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
        <div className="space-y-6">
          <AssignmentEditor onCreated={loadDashboard} />

          <SectionCard title="Published assignments" eyebrow="Your assignment list">
            <div className="grid gap-4 xl:grid-cols-2">
              {assignments.length ? assignments.map((assignment) => (
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
              )) : (
                <div className="rounded-[1.5rem] border border-dashed border-white/15 p-6 text-sm text-slate-400 light:border-slate-300 light:text-slate-600">
                  No assignments created yet.
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      ) : null}

      {!loading && activeTab === "analytics" ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Users} label="Students" value={overview.totalStudents} helper="Students in the workspace" tone="cyan" />
            <StatCard icon={Brain} label="Assignments" value={overview.activeAssignments} helper="Assignments created by you" tone="emerald" />
            <StatCard icon={Target} label="Average score" value={`${overview.averageScore}%`} helper="Across all submissions" tone="amber" />
            <StatCard icon={Trophy} label="Selected avg" value={`${assignmentAverage}%`} helper="For the selected assignment" tone="rose" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.36fr,0.64fr]">
            <SectionCard title="Assignment results" eyebrow="Choose an assignment">
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
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
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
            >
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Submitted</p>
                  <div className="mt-2 font-display text-3xl font-bold text-white light:text-slate-900">
                    {assignmentSubmissions.length}
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Pending</p>
                  <div className="mt-2 font-display text-3xl font-bold text-white light:text-slate-900">
                    {pendingStudents}
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Top score</p>
                  <div className="mt-2 font-display text-3xl font-bold text-white light:text-slate-900">
                    {topScore}%
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {assignmentSubmissions.length ? assignmentSubmissions.map((submission) => (
                  <div
                    key={submission._id}
                    className="flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 light:border-slate-200 light:bg-white"
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
                      <p className="text-sm text-slate-400 light:text-slate-600">
                        Level {submission.student?.level || 1}
                      </p>
                    </div>
                  </div>
                )) : (
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

          <SectionCard title="Student performance" eyebrow="Class overview">
            <div className="space-y-3">
              {(analytics?.studentPerformance || []).length ? (analytics?.studentPerformance || []).map((student) => (
                <div
                  key={student.studentId}
                  className="flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 light:border-slate-200 light:bg-white"
                >
                  <div>
                    <p className="font-medium text-white light:text-slate-900">{student.name}</p>
                    <p className="text-sm text-slate-400 light:text-slate-600">
                      {student.attempts} attempts | Level {student.level}
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
              )) : (
                <div className="rounded-[1.5rem] border border-dashed border-white/15 p-6 text-sm text-slate-400 light:border-slate-300 light:text-slate-600">
                  Student analytics will appear after submissions come in.
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      ) : null}
    </AppShell>
  );
}
