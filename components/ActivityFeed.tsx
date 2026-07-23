function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export function ActivityFeed({ items }: { items: { date: string; label: string }[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-paper-muted">
        Nothing logged yet — complete a goal or check off a habit and it&apos;ll show up here.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-center justify-between gap-4 text-sm">
          <span className="text-paper">{item.label}</span>
          <span className="flex-none font-data text-xs text-paper-muted">
            {timeAgo(item.date)}
          </span>
        </li>
      ))}
    </ul>
  );
}
