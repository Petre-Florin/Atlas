export function MilestoneBanner({
  habitName,
  streak,
  unit = "days",
}: {
  habitName: string;
  streak: number;
  unit?: "days" | "weeks";
}) {
  return (
    <div className="animate-fade-in-up mb-6 rounded-2xl border border-thread-soft bg-surface px-6 py-4">
      <p className="text-sm text-paper">
        <span className="text-thread">
          {streak} {unit}
        </span>{" "}
        on {habitName}. Steady work.
      </p>
    </div>
  );
}
