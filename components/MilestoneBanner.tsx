export function MilestoneBanner({ habitName, streak }: { habitName: string; streak: number }) {
  return (
    <div className="animate-fade-in-up mb-6 rounded-2xl border border-thread-soft bg-surface px-6 py-4">
      <p className="text-sm text-paper">
        <span className="text-thread">{streak} days</span> on {habitName}. Steady work.
      </p>
    </div>
  );
}
