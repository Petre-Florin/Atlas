"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeStrands, futureStrands } from "@/lib/nav";
import { ThemeToggle } from "./ThemeToggle";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-none flex-col border-b border-hairline bg-sidebar md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="font-display text-lg italic text-paper">Atlas</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-md text-paper-muted transition-colors hover:bg-surface hover:text-paper"
        >
          <span aria-hidden className="text-lg">
            ☰
          </span>
        </button>
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <nav className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-hairline bg-sidebar px-4 py-6">
            <div className="mb-6 flex items-center justify-between px-2">
              <span className="font-display text-xl italic text-paper">Atlas</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="flex h-8 w-8 items-center justify-center rounded-md text-paper-muted transition-colors hover:bg-surface hover:text-paper"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-0.5">
              {activeStrands.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-sm transition-colors ${
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
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-sm text-paper-faint"
                >
                  <span className="w-4 text-center text-xs" aria-hidden>
                    ·
                  </span>
                  {item.label}
                </div>
              ))}
            </div>

            <div className="border-t border-hairline pt-3">
              <Link
                href="/data"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-sm transition-colors ${
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
          </nav>
        </>
      )}
    </div>
  );
}
