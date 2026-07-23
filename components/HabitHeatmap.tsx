export function HabitHeatmap({
  loggedDates,
  days = 35,
}: {
  loggedDates: Set<string>;
  days?: number;
}) {
  const cells: { date: string; active: boolean; isToday: boolean }[] = [];
  const cursor = new Date();
  const todayStr = cursor.toISOString().slice(0, 10);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    cells.push({
      date: dateStr,
      active: loggedDates.has(dateStr),
      isToday: dateStr === todayStr,
    });
  }

  return (
    <div className="flex flex-wrap gap-1" role="img" aria-label={`Last ${days} days of activity`}>
      {cells.map((cell) => (
        <div
          key={cell.date}
          title={cell.date}
          className={`h-2.5 w-2.5 rounded-[2px] transition-colors ${
            cell.active
              ? "bg-grove"
              : cell.isToday
                ? "border border-thread bg-transparent"
                : "bg-hairline"
          }`}
        />
      ))}
    </div>
  );
}
