"use client";

import { useTransition } from "react";
import { moveDashboardWidget } from "@/app/actions";
import type { WidgetKey } from "@/lib/strands";

export function WidgetSlot({
  widgetKey,
  canMoveUp,
  canMoveDown,
  children,
}: {
  widgetKey: WidgetKey;
  canMoveUp: boolean;
  canMoveDown: boolean;
  children: React.ReactNode;
}) {
  const [, startTransition] = useTransition();

  function handleMove(direction: "up" | "down") {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("key", widgetKey);
      fd.set("direction", direction);
      await moveDashboardWidget(fd);
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-1 flex justify-end gap-0.5">
        <button
          type="button"
          onClick={() => handleMove("up")}
          disabled={!canMoveUp}
          aria-label="Move widget earlier"
          className="rounded px-1 text-xs text-paper-faint transition-colors hover:text-paper disabled:opacity-20 disabled:hover:text-paper-faint"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={() => handleMove("down")}
          disabled={!canMoveDown}
          aria-label="Move widget later"
          className="rounded px-1 text-xs text-paper-faint transition-colors hover:text-paper disabled:opacity-20 disabled:hover:text-paper-faint"
        >
          ▼
        </button>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
