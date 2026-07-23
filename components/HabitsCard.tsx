import { addHabit, restoreHabit } from "@/app/actions";
import { HabitRow } from "./HabitRow";
import { SubmitButton } from "./SubmitButton";

type Habit = {
  id: string;
  name: string;
  streak: number;
  loggedToday: boolean;
  loggedDates: Set<string>;
};

type ArchivedHabit = { id: string; name: string };

export function HabitsCard({
  habits,
  archivedHabits = [],
}: {
  habits: Habit[];
  archivedHabits?: ArchivedHabit[];
}) {
  return (
    <div className="animate-fade-in-up rounded-2xl border border-hairline bg-surface p-6">
      <h2 className="mb-5 font-display text-xl text-paper">Habits</h2>

      <ul className="mb-5 space-y-4">
        {habits.length === 0 && (
          <li className="text-sm text-paper-muted">
            No habits yet — add one you want to build a streak on.
          </li>
        )}
        {habits.map((habit, index) => (
          <li key={habit.id}>
            <HabitRow
              habit={habit}
              canMoveUp={index > 0}
              canMoveDown={index < habits.length - 1}
            />
          </li>
        ))}
      </ul>

      <form action={addHabit} className="mb-5 flex gap-2">
        <input
          type="text"
          name="name"
          placeholder="Add a habit"
          className="flex-1 rounded-md border border-hairline bg-ink px-3 py-1.5 text-sm text-paper outline-none focus:border-thread"
        />
        <SubmitButton>Add</SubmitButton>
      </form>

      {archivedHabits.length > 0 && (
        <details className="group/archive">
          <summary className="cursor-pointer text-xs text-paper-faint transition-colors hover:text-paper-muted">
            Archived ({archivedHabits.length})
          </summary>
          <ul className="mt-3 space-y-2 border-t border-hairline pt-3">
            {archivedHabits.map((habit) => (
              <li
                key={habit.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-paper-muted">{habit.name}</span>
                <form action={restoreHabit}>
                  <input type="hidden" name="id" value={habit.id} />
                  <button
                    type="submit"
                    className="rounded-md px-2 py-0.5 text-xs text-thread transition-colors hover:bg-thread-soft"
                  >
                    Restore
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
