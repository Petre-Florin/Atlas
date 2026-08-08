"use client";

import { useEffect, useState, useTransition } from "react";
import { toggleHabitToday, editHabit, archiveHabit, moveHabit } from "@/app/actions";
import { HabitHeatmap } from "./HabitHeatmap";
import { FrequencyPicker } from "./FrequencyPicker";

type Frequency = { type: "daily" | "weekly_days" | "weekly_count"; days: number[]; count: number | null };

type Habit = {
  id: string;
  name: string;
  streak: number;
  streakUnit: "days" | "weeks";
  loggedToday: boolean;
  loggedDates: Set<string>;
  frequency: Frequency;
  dueToday: boolean;
  weekProgress?: { count: number; target: number };
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function frequencyLabel(freq: Frequency): string | null {
  if (freq.type === "weekly_days") {
    if (freq.days.length === 0) return null;
    return [...freq.days].sort().map((d) => WEEKDAY_LABELS[d]).join(", ");
  }
  if (freq.type === "weekly_count") {
    return `${freq.count ?? 0}x/week`;
  }
  return null; // daily needs no label
}

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
    setOptimisticLogged(next);
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

  const label = frequencyLabel(habit.frequency);

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await editHabit(formData);
          setEditing(false);
        }}
        className="space-y-2 rounded-md border border-thread p-3"
      >
        <input type="hidden" name="id" value={habit.id} />
        <input
          type="text"
          name="name"
          defaultValue={habit.name}
          autoFocus
          className="w-full rounded-md border border-hairline bg-ink px-2 py-1 text-sm text-paper outline-none focus:border-thread"
        />
        <FrequencyPicker
          defaultType={habit.frequency.type}
          defaultDays={habit.frequency.days}
          defaultCount={habit.frequency.count ?? 3}
        />
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
      <div className="mb-1 flex items-center gap-3">
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
                : habit.dueToday
                  ? "border-hairline bg-transparent hover:border-grove"
                  : "border-hairline bg-transparent opacity-50 hover:border-grove hover:opacity-100"
            }`}
          />
          <span className="min-w-0 truncate text-sm text-paper">{habit.name}</span>
          {label && (
            <span className="flex-none rounded-full border border-hairline px-1.5 py-0.5 text-[10px] text-paper-faint">
              {label}
            </span>
          )}
        </div>

        <div className="flex w-16 flex-none justify-end">
          <span className="font-data text-xs text-paper-muted">
            {habit.streak}
            {habit.streakUnit === "weeks" ? "w" : "d"}
          </span>
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
      </div>

      {habit.weekProgress && (
        <p className="mb-1 pl-7 text-xs text-paper-faint">
          {habit.weekProgress.count} of {habit.weekProgress.target} this week
        </p>
      )}
      {habit.frequency.type === "weekly_days" && !habit.dueToday && (
        <p className="mb-1 pl-7 text-xs text-paper-faint">Not scheduled today</p>
      )}

      <HabitHeatmap loggedDates={habit.loggedDates} />
    </div>
  );
}
