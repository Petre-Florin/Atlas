import { addGoal, copyGoalsToTomorrow } from "@/app/actions";
import { ProgressRing } from "./ProgressRing";
import { GoalRow } from "./GoalRow";
import { SubmitButton } from "./SubmitButton";
import { QuickAddGoals } from "./QuickAddGoals";

type Goal = { id: string; title: string; done: boolean };
type Template = { id: string; title: string };

export function GoalsCard({
  goals,
  variant = "today",
  templates = [],
}: {
  goals: Goal[];
  variant?: "today" | "tomorrow";
  templates?: Template[];
}) {
  const doneCount = goals.filter((g) => g.done).length;
  const ratio = goals.length > 0 ? doneCount / goals.length : 0;
  const allDone = goals.length > 0 && doneCount === goals.length;
  const isTomorrow = variant === "tomorrow";

  return (
    <div className="animate-fade-in-up rounded-2xl border border-hairline bg-surface p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {!isTomorrow && <ProgressRing value={ratio} size={64} />}
          <div>
            <h2 className="font-display text-xl text-paper">
              {isTomorrow ? "Tomorrow's goals" : "Today's goals"}
            </h2>
            <p className="mt-0.5 text-xs text-paper-muted">
              {isTomorrow
                ? `${goals.length} planned`
                : allDone
                  ? "Everything's done. Tomorrow starts fresh."
                  : `${doneCount} of ${goals.length || 0} done`}
            </p>
          </div>
        </div>

        {!isTomorrow && goals.length > 0 && (
          <form action={copyGoalsToTomorrow}>
            <button
              type="submit"
              className="whitespace-nowrap rounded-md border border-hairline px-2.5 py-1 text-xs text-paper-muted transition-colors hover:border-thread hover:text-paper"
            >
              Copy to tomorrow →
            </button>
          </form>
        )}
      </div>

      <ul className="mb-5 space-y-2.5">
        {goals.length === 0 && (
          <li className="text-sm text-paper-muted">
            {isTomorrow
              ? "Nothing planned yet — get a head start on tomorrow."
              : "No goals yet — add the first thing you want done today."}
          </li>
        )}
        {goals.map((goal) => (
          <li key={goal.id}>
            <GoalRow goal={goal} locked={isTomorrow} />
          </li>
        ))}
      </ul>

      <form action={addGoal} className="flex gap-2">
        <input type="hidden" name="for" value={variant} />
        <input
          type="text"
          name="title"
          placeholder={isTomorrow ? "Add a goal for tomorrow" : "Add a goal for today"}
          className="field flex-1 text-sm"
        />
        <SubmitButton>Add</SubmitButton>
      </form>

      {!isTomorrow && <div className="mt-5"><QuickAddGoals templates={templates} /></div>}
    </div>
  );
}
