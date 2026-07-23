import Link from "next/link";

export function Widget({
  eyebrow,
  title,
  href,
  delay = 0,
  children,
}: {
  eyebrow: string;
  title: string;
  href?: string;
  delay?: number;
  children: React.ReactNode;
}) {
  const content = (
    <div
      className="card-lift animate-fade-in-up h-full rounded-2xl border border-hairline bg-surface p-6"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-4 flex items-baseline justify-between">
        <span className="font-data text-[11px] uppercase tracking-wider text-thread">
          {eyebrow}
        </span>
        {href && (
          <span className="text-xs text-paper-faint transition-colors group-hover:text-paper-muted">
            View →
          </span>
        )}
      </div>
      <h3 className="mb-4 font-display text-lg text-paper">{title}</h3>
      {children}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block h-full">
        {content}
      </Link>
    );
  }

  return content;
}
