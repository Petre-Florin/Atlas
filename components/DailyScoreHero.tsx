import { ProgressRing } from "./ProgressRing";
import type { DailyScore } from "@/lib/strands";

function greetingWord(timeZone: string) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone,
    }).format(new Date())
  );
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DailyScoreHero({
  name,
  score,
  timeZone,
}: {
  name: string;
  score: DailyScore;
  timeZone: string;
}) {
  return (
    <div className="animate-fade-in-up mb-6 flex flex-col gap-6 rounded-2xl border border-hairline bg-surface p-6 sm:flex-row sm:items-center">
      <div className="flex items-center gap-4">
        {score.value !== null ? (
          <ProgressRing value={score.value} size={72} strokeWidth={6} />
        ) : (
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-hairline">
            <span className="font-data text-xs text-paper-faint">—</span>
          </div>
        )}
        <div>
          <h1 className="font-display text-2xl text-paper">
            {greetingWord(timeZone)}, {name}.
          </h1>
          <p className="mt-1 text-sm text-paper-muted">
            {score.value === null
              ? "Nothing tracked yet today — add a goal or a habit to get started."
              : "Here's where today stands."}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-wrap gap-x-6 gap-y-2 sm:justify-end">
        {score.parts.map((part) => (
          <div key={part.label} className="text-right">
            <p className="font-data text-sm text-paper">
              {part.ratio === null ? "—" : `${Math.round(part.ratio * 100)}%`}
            </p>
            <p className="text-[11px] uppercase tracking-wide text-paper-faint">
              {part.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
