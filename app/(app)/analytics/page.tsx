import { TopBar } from "@/components/TopBar";
import { ScoreHistoryChart } from "@/components/ScoreHistoryChart";
import { ProductivityHistoryChart } from "@/components/ProductivityHistoryChart";
import { ProgressBar } from "@/components/ProgressBar";
import { getAnalyticsData, getTargets } from "@/lib/strands";

export default async function AnalyticsPage() {
  const [{ scoreHistory, habitConsistency, journalStats, productivityHistory }, targets] =
    await Promise.all([getAnalyticsData(30), getTargets()]);

  return (
    <>
      <TopBar title="Analytics" />
      <main className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-2xl space-y-5">
          <div className="animate-fade-in-up rounded-2xl border border-hairline bg-surface p-6">
            <h2 className="mb-4 font-display text-xl text-paper">Daily score</h2>
            <ScoreHistoryChart data={scoreHistory} />
          </div>

          <div
            className="animate-fade-in-up rounded-2xl border border-hairline bg-surface p-6"
            style={{ animationDelay: "80ms" }}
          >
            <h2 className="mb-4 font-display text-xl text-paper">Habit consistency</h2>
            {habitConsistency.length === 0 ? (
              <p className="text-sm text-paper-muted">No habits tracked yet.</p>
            ) : (
              <ul className="space-y-3">
                {habitConsistency.map((h) => (
                  <li key={h.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-paper">{h.name}</span>
                      <span className="font-data text-xs text-paper-muted">
                        {Math.round(h.ratio * 100)}% ({h.loggedCount}/{h.expected})
                      </span>
                    </div>
                    <ProgressBar value={h.ratio} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            className="animate-fade-in-up rounded-2xl border border-hairline bg-surface p-6"
            style={{ animationDelay: "160ms" }}
          >
            <h2 className="mb-4 font-display text-xl text-paper">Journal</h2>
            <p className="mb-4 text-sm text-paper">
              <span className="font-data text-thread">{journalStats.entriesInWindow}</span>{" "}
              entries in the last {journalStats.windowDays} days · Current streak:{" "}
              <span className="font-data text-thread">{journalStats.currentStreak}d</span>
            </p>
            <ProductivityHistoryChart data={productivityHistory} />
          </div>

          <div
            className="animate-fade-in-up rounded-2xl border border-hairline bg-surface p-6"
            style={{ animationDelay: "240ms" }}
          >
            <h2 className="mb-1 font-display text-xl text-paper">Targets</h2>
            <p className="mb-4 text-xs text-paper-faint">
              Snapshot only — no history is kept for these yet.
            </p>
            {targets.length === 0 ? (
              <p className="text-sm text-paper-muted">No targets tracked yet.</p>
            ) : (
              <ul className="space-y-3">
                {targets.map((t) => {
                  const ratio = t.target_count > 0 ? t.current_count / t.target_count : 0;
                  return (
                    <li key={t.id}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-paper">{t.title}</span>
                        <span className="font-data text-xs text-paper-muted">
                          {t.current_count}
                          {t.target_count > 0 ? `/${t.target_count}` : ""} {t.unit}
                        </span>
                      </div>
                      {t.target_count > 0 && <ProgressBar value={ratio} />}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
