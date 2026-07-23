"use client";

import { useEffect, useState, useTransition } from "react";
import { toggleGoal, renameGoal, deleteGoal } from "@/app/actions";

type Goal = { id: string; title: string; done: boolean };

export function GoalRow({ goal, locked = false }: { goal: Goal; locked?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [optimisticDone, setOptimisticDone] = useState(goal.done);
  const [, startTransition] = useTransition();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing optimistic state from the server-confirmed prop after revalidation
    setOptimisticDone(goal.done);
  }, [goal.done]);

  function handleToggle() {
    const next = !optimisticDone;
    setOptimisticDone(next); // instant visual feedback
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", goal.id);
      fd.set("done", String(goal.done));
      await toggleGoal(fd);
    });
  }

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await renameGoal(formData);
          setEditing(false);
        }}
        className="flex items-center gap-2"
      >
        <input type="hidden" name="id" value={goal.id} />
        <input
          type="text"
          name="title"
          defaultValue={goal.title}
          autoFocus
          className="flex-1 rounded-md border border-thread bg-ink px-2 py-1 text-sm text-paper outline-none"
        />
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
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={locked ? undefined : handleToggle}
          disabled={locked}
          aria-label={
            locked
              ? "Not editable until this becomes today's goal"
              : optimisticDone
                ? "Mark as not done"
                : "Mark as done"
          }
          className={`h-4 w-4 flex-none rounded-sm border transition-colors ${
            optimisticDone
              ? "border-thread bg-thread"
              : "border-hairline bg-transparent"
          } ${locked ? "cursor-not-allowed opacity-60" : "hover:border-thread"}`}
        />
        <span
          className={`truncate text-sm transition-colors ${
            optimisticDone ? "text-paper-muted line-through" : "text-paper"
          }`}
        >
          {goal.title}
        </span>
      </div>

      <div className="flex w-28 flex-none items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-md px-2 py-1 text-xs text-paper-muted transition-colors hover:bg-surface-raised hover:text-paper"
          aria-label="Edit goal"
        >
          Edit
        </button>
        <form action={deleteGoal}>
          <input type="hidden" name="id" value={goal.id} />
          <button
            type="submit"
            className="rounded-md px-2 py-1 text-xs text-paper-muted transition-colors hover:bg-surface-raised hover:text-rust"
            aria-label="Delete goal"
          >
            Remove
          </button>
        </form>
      </div>
    </div>
  );
}
