"use client";

import { useEffect, useState, useTransition } from "react";
import { incrementTarget, editTarget, archiveTarget, moveTarget } from "@/app/actions";
import { ProgressBar } from "./ProgressBar";

type Target = {
  id: string;
  title: string;
  unit: string;
  current_count: number;
  target_count: number;
};

export function TargetRow({
  target,
  canMoveUp,
  canMoveDown,
}: {
  target: Target;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [optimisticCount, setOptimisticCount] = useState(target.current_count);
  const [, startTransition] = useTransition();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing optimistic count from the server-confirmed prop after revalidation
    setOptimisticCount(target.current_count);
  }, [target.current_count]);

  function handleIncrement(delta: number) {
    setOptimisticCount((c) => Math.max(0, c + delta)); // instant visual feedback
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", target.id);
      fd.set("delta", String(delta));
      fd.set("currentCount", String(target.current_count));
      await incrementTarget(fd);
    });
  }

  function handleMove(direction: "up" | "down") {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", target.id);
      fd.set("direction", direction);
      await moveTarget(fd);
    });
  }

  const ratio = target.target_count > 0 ? optimisticCount / target.target_count : 0;
  const reached = target.target_count > 0 && optimisticCount >= target.target_count;

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await editTarget(formData);
          setEditing(false);
        }}
        className="space-y-2 rounded-md border border-thread p-3"
      >
        <input type="hidden" name="id" value={target.id} />
        <input
          type="text"
          name="title"
          defaultValue={target.title}
          autoFocus
          placeholder="Title"
          className="w-full rounded-md border border-hairline bg-ink px-2 py-1 text-sm text-paper outline-none focus:border-thread"
        />
        <div className="flex gap-2">
          <input
            type="text"
            name="unit"
            defaultValue={target.unit}
            placeholder="Unit (e.g. questions)"
            className="flex-1 rounded-md border border-hairline bg-ink px-2 py-1 text-sm text-paper outline-none focus:border-thread"
          />
          <input
            type="number"
            name="currentCount"
            defaultValue={target.current_count}
            min={0}
            placeholder="Current"
            className="w-24 rounded-md border border-hairline bg-ink px-2 py-1 text-sm text-paper outline-none focus:border-thread"
          />
          <input
            type="number"
            name="targetCount"
            defaultValue={target.target_count}
            min={0}
            placeholder="Target"
            className="w-24 rounded-md border border-hairline bg-ink px-2 py-1 text-sm text-paper outline-none focus:border-thread"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md px-2 py-1 text-xs text-thread transition-colors hover:bg-thread-soft"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-md px-2 py-1 text-xs text-paper-faint transition-colors hover:text-paper-muted"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-3">
        <div className="flex flex-none items-center gap-0.5">
          <button
            type="button"
            onClick={() => handleMove("up")}
            disabled={!canMoveUp}
            aria-label="Move up"
            className="rounded px-1 text-paper-faint transition-colors hover:text-paper disabled:opacity-20 disabled:hover:text-paper-faint"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => handleMove("down")}
            disabled={!canMoveDown}
            aria-label="Move down"
            className="rounded px-1 text-paper-faint transition-colors hover:text-paper disabled:opacity-20 disabled:hover:text-paper-faint"
          >
            ▼
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <span className="truncate text-sm text-paper">{target.title}</span>
        </div>

        <span className="flex-none font-data text-xs text-paper-muted">
          {optimisticCount}
          {target.target_count > 0 ? ` / ${target.target_count}` : ""} {target.unit}
        </span>

        <div className="flex flex-none items-center gap-1">
          <button
            type="button"
            onClick={() => handleIncrement(-1)}
            aria-label="Decrease by 1"
            className="rounded-md px-2 py-0.5 text-sm text-paper-muted transition-colors hover:bg-surface-raised hover:text-paper"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => handleIncrement(1)}
            aria-label="Increase by 1"
            className="rounded-md px-2 py-0.5 text-sm text-thread transition-colors hover:bg-thread-soft"
          >
            +
          </button>
        </div>

        <div className="flex w-28 flex-none items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md px-2 py-1 text-xs text-paper-muted transition-colors hover:bg-surface-raised hover:text-paper"
            aria-label="Edit target"
          >
            Edit
          </button>
          <form action={archiveTarget}>
            <input type="hidden" name="id" value={target.id} />
            <button
              type="submit"
              className="rounded-md px-2 py-1 text-xs text-paper-muted transition-colors hover:bg-surface-raised hover:text-rust"
              aria-label="Remove target"
            >
              Remove
            </button>
          </form>
        </div>
      </div>
      {target.target_count > 0 && <ProgressBar value={ratio} />}
      {reached && (
        <p className="mt-1 text-xs text-grove">Target reached. Nice work.</p>
      )}
    </div>
  );
}
