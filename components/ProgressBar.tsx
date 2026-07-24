export function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(Math.max(value, 0), 1) * 100;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-hairline">
      <div
        className="h-full rounded-full bg-thread transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
