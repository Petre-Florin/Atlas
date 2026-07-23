export function ProgressRing({
  value,
  size = 56,
  strokeWidth = 5,
  label,
}: {
  value: number; // 0–1
  size?: number;
  strokeWidth?: number;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(value, 0), 1));

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--hairline)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--thread)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="animate-ring"
          style={
            {
              "--ring-circumference": circumference,
            } as React.CSSProperties
          }
        />
      </svg>
      <span className="absolute font-data text-xs text-paper">
        {label ?? `${Math.round(value * 100)}%`}
      </span>
    </div>
  );
}
