import SectionCard from "./SectionCard.jsx";

export default function LeaderboardCard({ leaderboard = [] }) {
  return (
    <SectionCard title="Leaderboard" eyebrow="Gamification">
      <div className="space-y-3">
        {leaderboard.map((entry, index) => (
          <div
            key={`${entry.name}-${index}`}
            className="flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 light:border-slate-200 light:bg-white"
          >
            <div>
              <p className="font-medium text-white light:text-slate-900">
                #{index + 1} {entry.name}
              </p>
              <p className="text-sm text-slate-400 light:text-slate-600">
                Level {entry.level} • Accuracy {entry.accuracy}%
              </p>
            </div>
            <div className="text-right">
              <div className="font-display text-xl font-bold text-cyan-200 light:text-cyan-700">
                {entry.totalXp} XP
              </div>
              {entry.streak ? (
                <p className="text-sm text-slate-400 light:text-slate-600">{entry.streak}-day streak</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
