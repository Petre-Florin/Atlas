"use client";

import { useActionState, useEffect, useState } from "react";
import { saveJournal, type JournalSaveState } from "@/app/actions";
import { SubmitButton } from "./SubmitButton";

type Entry = { wins: string; mistakes: string; tomorrow: string };
type PastEntry = { for_date: string; wins: string; mistakes: string; tomorrow: string };

export function JournalCard({
  entry,
  recentEntries = [],
  today,
}: {
  entry: Entry;
  recentEntries?: PastEntry[];
  today: string;
}) {
  const past = recentEntries.filter((e) => e.for_date !== today);
  const initialState: JournalSaveState = { ok: false, savedAt: 0 };
  const [state, formAction] = useActionState(saveJournal, initialState);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (state.savedAt === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- showing a temporary confirmation after the server action completes
    setShowSaved(true);
    const timer = setTimeout(() => setShowSaved(false), 3000);
    return () => clearTimeout(timer);
  }, [state.savedAt]);

  return (
    <div className="space-y-5">
      <div className="animate-fade-in-up rounded-2xl border border-hairline bg-surface p-6">
        <h2 className="mb-5 font-display text-xl text-paper">Today</h2>
        <form action={formAction} className="space-y-4">
          <Field name="wins" label="Today's wins" defaultValue={entry.wins} />
          <Field name="mistakes" label="Today's mistakes" defaultValue={entry.mistakes} />
          <Field name="tomorrow" label="Tomorrow" defaultValue={entry.tomorrow} />

          <div className="flex items-center gap-3">
            <SubmitButton variant="primary">Save entry</SubmitButton>
            <span
              className={`text-xs text-grove transition-opacity duration-300 ${
                showSaved && state.ok ? "opacity-100" : "opacity-0"
              }`}
              aria-live="polite"
            >
              ✓ Saved
            </span>
            {showSaved && !state.ok && state.savedAt > 0 && (
              <span className="text-xs text-rust">Couldn&apos;t save — try again</span>
            )}
          </div>
        </form>
      </div>

      {past.length > 0 && (
        <div
          className="animate-fade-in-up rounded-2xl border border-hairline bg-surface p-6"
          style={{ animationDelay: "120ms" }}
        >
          <h2 className="mb-4 font-display text-lg text-paper">Timeline</h2>
          <ul className="space-y-5">
            {past.map((e) => (
              <li key={e.for_date} className="border-l border-hairline pl-4">
                <p className="mb-1.5 font-data text-xs text-paper-muted">
                  {new Date(e.for_date).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                <div className="space-y-1.5">
                  {e.wins && (
                    <p className="text-sm text-paper">
                      <span className="text-paper-faint">Wins: </span>
                      {e.wins}
                    </p>
                  )}
                  {e.mistakes && (
                    <p className="text-sm text-paper">
                      <span className="text-paper-faint">Mistakes: </span>
                      {e.mistakes}
                    </p>
                  )}
                  {e.tomorrow && (
                    <p className="text-sm text-paper">
                      <span className="text-paper-faint">Tomorrow: </span>
                      {e.tomorrow}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Field({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs text-paper-muted">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        defaultValue={defaultValue}
        rows={2}
        className="w-full resize-none rounded-md border border-hairline bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-thread"
      />
    </div>
  );
}
