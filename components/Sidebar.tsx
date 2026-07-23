"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const activeStrands = [
  { href: "/", label: "Dashboard", icon: "◆" },
  { href: "/goals", label: "Goals", icon: "◎" },
  { href: "/habits", label: "Habits", icon: "≋" },
  { href: "/journal", label: "Journal", icon: "✎" },
];

const futureStrands = [
  { label: "Learning" },
  { label: "Projects" },
  { label: "Career" },
  { label: "Finance" },
  { label: "Knowledge" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 flex-none flex-col border-r border-hairline bg-sidebar px-4 py-6">
      <div className="mb-8 px-2">
        <h1 className="font-display text-xl italic text-paper">Atlas</h1>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {activeStrands.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-surface text-paper"
                  : "text-paper-muted hover:bg-surface hover:text-paper"
              }`}
            >
              <span
                className={`w-4 text-center text-xs ${isActive ? "text-thread" : "text-paper-faint"}`}
                aria-hidden
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}

        <div className="mt-6 px-2.5">
          <span className="font-data text-[10px] uppercase tracking-wider text-paper-faint">
            Not yet built
          </span>
        </div>
        {futureStrands.map((item) => (
          <div
            key={item.label}
            className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-paper-faint"
            title="Added once the current strands earn it through daily use"
          >
            <span className="w-4 text-center text-xs" aria-hidden>
              ·
            </span>
            {item.label}
          </div>
        ))}
      </nav>

      <div className="border-t border-hairline pt-3">
        <ThemeToggle />
      </div>
    </aside>
  );
}
