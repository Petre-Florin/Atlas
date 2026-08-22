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
          className="field field-sm w-full text-sm"
        />
        <div className="flex gap-2">
          <input
            type="text"
            name="unit"
            defaultValue={target.unit}
            placeholder="Unit (e.g. questions)"
            className="field field-sm flex-1 text-sm"
          />
          <input
            type="number"
            name="currentCount"
            defaultValue={target.current_count}
            min={0}
            placeholder="Current"
            className="field field-sm w-24 text-sm"
          />
          <input
            type="number"
            name="targetCount"
            defaultValue={target.target_count}
            min={0}
            placeholder="Target"
            className="field field-sm w-24 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="text-action rounded-md px-2 py-1 text-xs text-thread transition-colors"
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

        <span className="min-w-0 flex-1 truncate text-sm text-paper">{target.title}</span>

        <div className="flex w-28 flex-none items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-action rounded-md px-2 py-1 text-xs text-paper-muted transition-colors hover:text-paper"
            aria-label="Edit target"
          >
            Edit
          </button>
          <form action={archiveTarget}>
            <input type="hidden" name="id" value={target.id} />
            <button
              type="submit"
              className="text-action rounded-md px-2 py-1 text-xs text-paper-muted transition-colors hover:text-rust"
              aria-label="Remove target"
            >
              Remove
            </button>
          </form>
        </div>
      </div>

      <div className="mb-1.5 flex flex-wrap items-center gap-2 pl-7">
        <div className="flex flex-none items-center gap-1">
          <button
            type="button"
            onClick={() => handleIncrement(-1)}
            aria-label="Decrease by 1"
            className="text-action rounded-md px-2 py-0.5 text-sm text-paper-muted transition-colors hover:text-paper"
          >
            −
          </button>
          <span className="min-w-[3ch] text-center font-data text-xs text-paper-muted">
            {optimisticCount}
          </span>
          <button
            type="button"
            onClick={() => handleIncrement(1)}
            aria-label="Increase by 1"
            className="text-action rounded-md px-2 py-0.5 text-sm text-thread transition-colors"
          >
            +
          </button>
        </div>

        <span className="truncate font-data text-xs text-paper-faint">
          {target.target_count > 0 ? `of ${target.target_count} ` : ""}
          {target.unit}
        </span>
      </div>

      {target.target_count > 0 && (
        <div className="pl-7">
          <ProgressBar value={ratio} />
        </div>
      )}
      {reached && (
        <p className="mt-1 pl-7 text-xs text-grove">Target reached. Nice work.</p>
      )}
    </div>
  );
}
