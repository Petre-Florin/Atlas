import { addTarget, restoreTarget } from "@/app/actions";
import { TargetRow } from "./TargetRow";
import { SubmitButton } from "./SubmitButton";

type Target = {
  id: string;
  title: string;
  unit: string;
  current_count: number;
  target_count: number;
};

export function TargetsCard({
  targets,
  archivedTargets = [],
}: {
  targets: Target[];
  archivedTargets?: Target[];
}) {
  return (
    <div className="animate-fade-in-up rounded-2xl border border-hairline bg-surface p-6">
      <h2 className="mb-5 font-display text-xl text-paper">Targets</h2>

      <ul className="mb-5 space-y-4">
        {targets.length === 0 && (
          <li className="text-sm text-paper-muted">
            No targets yet — add something you want to build up over time.
          </li>
        )}
        {targets.map((target, index) => (
          <li key={target.id}>
            <TargetRow
              target={target}
              canMoveUp={index > 0}
              canMoveDown={index < targets.length - 1}
            />
          </li>
        ))}
      </ul>

      <form action={addTarget} className="mb-5 space-y-2">
        <input
          type="text"
          name="title"
          placeholder="Title (e.g. LeetCode questions)"
          className="w-full rounded-md border border-hairline bg-ink px-3 py-1.5 text-sm text-paper outline-none focus:border-thread"
        />
        <div className="flex gap-2">
          <input
            type="text"
            name="unit"
            placeholder="Unit (optional, e.g. questions)"
            className="flex-1 rounded-md border border-hairline bg-ink px-3 py-1.5 text-sm text-paper outline-none focus:border-thread"
          />
          <input
            type="number"
            name="targetCount"
            min={0}
            placeholder="Target (optional)"
            className="w-32 rounded-md border border-hairline bg-ink px-3 py-1.5 text-sm text-paper outline-none focus:border-thread"
          />
          <SubmitButton>Add</SubmitButton>
        </div>
      </form>

      {archivedTargets.length > 0 && (
        <details className="group/archive">
          <summary className="cursor-pointer text-xs text-paper-faint transition-colors hover:text-paper-muted">
            Archived ({archivedTargets.length})
          </summary>
          <ul className="mt-3 space-y-2 border-t border-hairline pt-3">
            {archivedTargets.map((target) => (
              <li
                key={target.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="min-w-0 truncate text-paper-muted">
                  {target.title} ({target.current_count}
                  {target.target_count > 0 ? `/${target.target_count}` : ""})
                </span>
                <form action={restoreTarget} className="flex-none">
                  <input type="hidden" name="id" value={target.id} />
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
