import type { DayProductivity } from "@/lib/strands";

export function ProductivityHistoryChart({ data }: { data: DayProductivity[] }) {
  const rated = data.filter((d) => d.productivity !== null) as {
    date: string;
    productivity: number;
  }[];
  const average =
    rated.length > 0 ? rated.reduce((sum, d) => sum + d.productivity, 0) / rated.length : null;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-xs text-paper-muted">
          {rated.length > 0 ? `Average: ${average!.toFixed(1)}/10` : "No ratings yet"}
        </span>
        <span className="text-xs text-paper-faint">Last {data.length} days</span>
      </div>
      <div className="flex h-24 items-end gap-[3px]">
        {data.map((d) => (
          <div
            key={d.date}
            title={`${d.date}${d.productivity !== null ? `: ${d.productivity}/10` : ": no rating"}`}
            className="flex-1 rounded-t-sm"
            style={{
              height: d.productivity !== null ? `${Math.max(4, (d.productivity / 10) * 100)}%` : "4px",
              backgroundColor: d.productivity !== null ? "var(--grove)" : "var(--hairline)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
