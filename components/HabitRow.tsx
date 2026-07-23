"use client";

import { useEffect, useState, useTransition } from "react";
import { toggleHabitToday, renameHabit, archiveHabit, moveHabit } from "@/app/actions";
import { HabitHeatmap } from "./HabitHeatmap";

type Habit = {
  id: string;
  name: string;
  streak: number;
  loggedToday: boolean;
  loggedDates: Set<string>;
};

export function HabitRow({
  habit,
  canMoveUp,
  canMoveDown,
}: {
  habit: Habit;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [optimisticLogged, setOptimisticLogged] = useState(habit.loggedToday);
  const [, startTransition] = useTransition();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing optimistic state from the server-confirmed prop after revalidation
    setOptimisticLogged(habit.loggedToday);
  }, [habit.loggedToday]);

  function handleToggle() {
    const next = !optimisticLogged;
    setOptimisticLogged(next); // instant visual feedback
    startTransition(async () => {
      const fd = new FormData();
      fd.set("habitId", habit.id);
      fd.set("loggedToday", String(habit.loggedToday));
      await toggleHabitToday(fd);
    });
  }

  function handleMove(direction: "up" | "down") {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", habit.id);
      fd.set("direction", direction);
      await moveHabit(fd);
    });
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        {editing ? (
          <form
            action={async (formData) => {
              await renameHabit(formData);
              setEditing(false);
            }}
            className="flex flex-1 items-center gap-2"
          >
            <input type="hidden" name="id" value={habit.id} />
            <input
              type="text"
              name="name"
              defaultValue={habit.name}
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
        ) : (
          <>
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

            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button
                type="button"
                onClick={handleToggle}
                aria-label={optimisticLogged ? "Undo today's log" : "Mark done today"}
                className={`h-4 w-4 flex-none rounded-full border transition-colors ${
                  optimisticLogged
                    ? "border-grove bg-grove"
                    : "border-hairline bg-transparent hover:border-grove"
                }`}
              />
              <span className="truncate text-sm text-paper">{habit.name}</span>
            </div>

            <div className="flex w-16 flex-none justify-end">
              <span className="font-data text-xs text-paper-muted">{habit.streak}d</span>
            </div>

            <div className="flex w-28 flex-none items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-md px-2 py-1 text-xs text-paper-muted transition-colors hover:bg-surface-raised hover:text-paper"
                aria-label="Edit habit"
              >
                Edit
              </button>
              <form action={archiveHabit}>
                <input type="hidden" name="id" value={habit.id} />
                <button
                  type="submit"
                  className="rounded-md px-2 py-1 text-xs text-paper-muted transition-colors hover:bg-surface-raised hover:text-rust"
                  aria-label="Remove habit"
                >
                  Remove
                </button>
              </form>
            </div>
          </>
        )}
      </div>
      <HabitHeatmap loggedDates={habit.loggedDates} />
    </div>
  );
}
