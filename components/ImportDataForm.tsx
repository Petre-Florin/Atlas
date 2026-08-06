"use client";

import { useActionState } from "react";
import { importData, type ImportState } from "@/app/actions";

const TABLE_LABELS: Record<string, string> = {
  goals: "Goals",
  habits: "Habits",
  targets: "Targets",
  goalTemplates: "Quick-add goal templates",
  journalEntries: "Journal entries",
  opportunities: "Opportunities",
  habitLogs: "Habit check-ins",
};

export function ImportDataForm() {
  const initialState: ImportState = { status: "idle", message: "" };
  const [state, formAction] = useActionState(importData, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        const confirmed = window.confirm(
          "This adds or updates data from the file into your account. Rows with an ID matching something you already have will be overwritten with the file's version — nothing is ever deleted. Continue?"
        );
        if (!confirmed) e.preventDefault();
      }}
      className="space-y-3"
    >
      <input
        type="file"
        name="file"
        accept="application/json"
        required
        className="w-full rounded-md border border-hairline bg-ink px-3 py-1.5 text-xs text-paper-muted file:mr-2 file:rounded file:border-0 file:bg-surface-raised file:px-2 file:py-1 file:text-xs file:text-paper"
      />
      <button
        type="submit"
        className="rounded-md border border-hairline px-3 py-1.5 text-sm text-paper-muted transition-colors hover:border-thread hover:text-paper"
      >
        Import
      </button>

      {state.status === "success" && (
        <div className="rounded-md border border-grove/40 bg-surface-raised p-3">
          <p className="mb-2 text-sm text-grove">Import complete.</p>
          <ul className="space-y-0.5 text-xs text-paper-muted">
            {Object.entries(state.counts ?? {}).map(([key, count]) => (
              <li key={key}>
                {TABLE_LABELS[key] ?? key}: {count}
              </li>
            ))}
          </ul>
        </div>
      )}

      {state.status === "error" && (
        <p className="text-sm text-rust">{state.message}</p>
      )}
    </form>
  );
}
