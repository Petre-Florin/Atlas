"use client";

import { useState, useTransition } from "react";
import {
  updateProjectStatus,
  touchProject,
  editProject,
  archiveProject,
  moveProject,
} from "@/app/actions";

type Project = {
  id: string;
  name: string;
  status: string;
  next_action: string;
  notes: string;
  link: string;
  last_touched_at: string;
};

const STATUSES = ["active", "paused", "done"];
const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  done: "Done",
};

// A project is flagged stale once it's gone two full weeks without being
// touched — long enough that "I'm just between sessions on it" stops being
// a fair read, short enough to catch something quietly dying before it's
// been forgotten for months.
const STALE_DAYS = 14;

function daysSince(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function touchedLabel(iso: string) {
  const days = daysSince(iso);
  if (days <= 0) return "Touched today";
  if (days === 1) return "Touched yesterday";
  return `Touched ${days}d ago`;
}

export function ProjectRow({
  project,
  canMoveUp,
  canMoveDown,
}: {
  project: Project;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(project.status);
  const [, startTransition] = useTransition();

  function handleStatusChange(next: string) {
    setStatus(next); // optimistic — feels instant, corrected on revalidation if it ever fails
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", project.id);
      fd.set("status", next);
      await updateProjectStatus(fd);
    });
  }

  function handleMove(direction: "up" | "down") {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", project.id);
      fd.set("direction", direction);
      await moveProject(fd);
    });
  }

  const stale = daysSince(project.last_touched_at) >= STALE_DAYS && status === "active";

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await editProject(formData);
          setEditing(false);
        }}
        className="space-y-2 rounded-md border border-thread p-3"
      >
        <input type="hidden" name="id" value={project.id} />
        <input
          type="text"
          name="name"
          defaultValue={project.name}
          autoFocus
          placeholder="Name"
          className="w-full rounded-md border border-hairline bg-ink px-2 py-1 text-sm text-paper outline-none focus:border-thread"
        />
        <select
          name="status"
          defaultValue={project.status}
          className="w-full rounded-md border border-hairline bg-ink px-2 py-1 text-sm text-paper outline-none focus:border-thread"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="nextAction"
          defaultValue={project.next_action}
          placeholder="Next action"
          className="w-full rounded-md border border-hairline bg-ink px-2 py-1 text-sm text-paper outline-none focus:border-thread"
        />
        <input
          type="url"
          name="link"
          defaultValue={project.link}
          placeholder="Link (repo, doc, etc.)"
          className="w-full rounded-md border border-hairline bg-ink px-2 py-1 text-sm text-paper outline-none focus:border-thread"
        />
        <textarea
          name="notes"
          defaultValue={project.notes}
          placeholder="Notes"
          rows={2}
          className="w-full resize-none rounded-md border border-hairline bg-ink px-2 py-1 text-sm text-paper outline-none focus:border-thread"
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

        <span className="min-w-0 flex-1 truncate text-sm text-paper">{project.name}</span>

        <div className="flex flex-none items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md px-2 py-1 text-xs text-paper-muted transition-colors hover:bg-surface-raised hover:text-paper"
            aria-label="Edit project"
          >
            Edit
          </button>
          <form action={archiveProject}>
            <input type="hidden" name="id" value={project.id} />
            <button
              type="submit"
              className="rounded-md px-2 py-1 text-xs text-paper-muted transition-colors hover:bg-surface-raised hover:text-rust"
              aria-label="Remove project"
            >
              Remove
            </button>
          </form>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pl-7">
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="rounded-md border border-hairline bg-ink px-2 py-1 text-xs text-paper outline-none focus:border-thread"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <form action={touchProject}>
          <input type="hidden" name="id" value={project.id} />
          <button
            type="submit"
            className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
              stale
                ? "border-rust text-rust hover:bg-rust/10"
                : "border-hairline text-paper-faint hover:border-thread hover:text-thread"
            }`}
          >
            {touchedLabel(project.last_touched_at)}
          </button>
        </form>

        {project.link && (
          <a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-thread hover:underline"
          >
            Link
          </a>
        )}
      </div>

      {project.next_action && (
        <p className="mt-1.5 truncate pl-7 text-xs text-paper-muted">
          Next: {project.next_action}
        </p>
      )}
    </div>
  );
}
