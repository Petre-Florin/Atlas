"use client";

import { useTransition } from "react";
import { addGoalTemplate, deleteGoalTemplate, addGoalFromTemplate } from "@/app/actions";
import { SubmitButton } from "./SubmitButton";

type Template = { id: string; title: string };

export function QuickAddGoals({ templates }: { templates: Template[] }) {
  const [, startTransition] = useTransition();

  function handleAdd(title: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("title", title);
      await addGoalFromTemplate(fd);
    });
  }

  return (
    <div className="mb-5">
      {templates.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleAdd(t.title)}
              className="rounded-full border border-hairline px-3 py-1 text-xs text-paper-muted transition-colors hover:border-thread hover:text-paper"
            >
              + {t.title}
            </button>
          ))}
        </div>
      )}

      <details className="group/manage">
        <summary className="cursor-pointer text-xs text-paper-faint transition-colors hover:text-paper-muted">
          Manage quick-add
        </summary>
        <div className="mt-3 space-y-2 border-t border-hairline pt-3">
          {templates.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-paper-muted">{t.title}</span>
              <form action={deleteGoalTemplate} className="flex-none">
                <input type="hidden" name="id" value={t.id} />
                <button
                  type="submit"
                  className="text-action rounded-md px-2 py-0.5 text-xs text-paper-faint transition-colors hover:text-rust"
                >
                  Remove
                </button>
              </form>
            </div>
          ))}
          <form action={addGoalTemplate} className="flex gap-2 pt-1">
            <input
              type="text"
              name="title"
              placeholder="Save a new quick-add goal"
              className="field flex-1 text-sm"
            />
            <SubmitButton>Save</SubmitButton>
          </form>
        </div>
      </details>
    </div>
  );
}
