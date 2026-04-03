import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

import SectionCard from "./SectionCard.jsx";

const colors = ["#22d3ee", "#34d399", "#f59e0b", "#f43f5e", "#818cf8"];

export default function AnalyticsCharts({
  mistakeHeatmap = [],
  treeTypePerformance = [],
  progress = [],
  assignmentBreakdown = [],
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <SectionCard title="Performance by tree type" eyebrow="Analytics">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={treeTypePerformance.length ? treeTypePerformance : assignmentBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="treeType" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey={treeTypePerformance.length ? "averageScore" : "attempts"} fill="#22d3ee" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard title="Mistakes and mastery" eyebrow="Signals">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mistakeHeatmap.length ? mistakeHeatmap : progress}
                  dataKey={mistakeHeatmap.length ? "value" : "mastery"}
                  nameKey={mistakeHeatmap.length ? "category" : "title"}
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={4}
                >
                  {(mistakeHeatmap.length ? mistakeHeatmap : progress).map((entry, index) => (
                    <Cell key={entry.category || entry.treeType || index} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progress.length ? progress : treeTypePerformance}>
                <defs>
                  <linearGradient id="algoyantraArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey={progress.length ? "title" : "treeType"} stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey={progress.length ? "mastery" : "averageScore"}
                  stroke="#34d399"
                  fill="url(#algoyantraArea)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
