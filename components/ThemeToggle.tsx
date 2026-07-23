"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("atlas-theme");
    if (stored === "light" || stored === "dark") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage on mount is the correct pattern here
      setTheme(stored);
    }
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("atlas-theme", next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-paper-muted transition-colors hover:bg-surface hover:text-paper"
    >
      <span className="w-4 text-center text-xs" aria-hidden>
        {theme === "dark" ? "☾" : "☀"}
      </span>
      {theme === "dark" ? "Dark" : "Light"} mode
    </button>
  );
}
