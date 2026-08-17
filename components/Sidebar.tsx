"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { activeStrands, futureStrands } from "@/lib/nav";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 flex-none flex-col border-r border-hairline bg-sidebar px-4 py-6 md:flex">
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
        <Link
          href="/data"
          className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
            pathname === "/data"
              ? "bg-surface text-paper"
              : "text-paper-muted hover:bg-surface hover:text-paper"
          }`}
        >
          <span className="w-4 text-center text-xs" aria-hidden>
            ⇅
          </span>
          Data
        </Link>
        <ThemeToggle />
      </div>
    </aside>
  );
}
