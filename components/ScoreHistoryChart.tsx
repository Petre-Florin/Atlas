import type { DayScore } from "@/lib/strands";

export function ScoreHistoryChart({ data }: { data: DayScore[] }) {
  const scored = data.filter((d) => d.score !== null) as { date: string; score: number }[];
  const average =
    scored.length > 0 ? scored.reduce((sum, d) => sum + d.score, 0) / scored.length : null;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-xs text-paper-muted">
          {scored.length > 0
            ? `Average: ${Math.round((average ?? 0) * 100)}%`
            : "No scored days yet"}
        </span>
        <span className="text-xs text-paper-faint">Last {data.length} days</span>
      </div>
      <div className="flex h-24 items-end gap-[3px]">
        {data.map((d) => (
          <div
            key={d.date}
            title={`${d.date}${d.score !== null ? `: ${Math.round(d.score * 100)}%` : ": no data"}`}
            className="flex-1 rounded-t-sm bg-hairline"
            style={{
              height: d.score !== null ? `${Math.max(4, d.score * 100)}%` : "4px",
              backgroundColor: d.score !== null ? "var(--thread)" : "var(--hairline)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
