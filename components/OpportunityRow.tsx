"use client";

import { useState, useTransition } from "react";
import { updateOpportunityStatus, editOpportunity, deleteOpportunity } from "@/app/actions";
import { TypeSelect } from "./TypeSelect";
import { OpportunityFiles } from "./OpportunityFiles";
import type { OpportunityFile } from "@/lib/documents";

type Opportunity = {
  id: string;
  name: string;
  type: string;
  status: string;
  next_action: string;
  notes: string;
  link: string;
  contact: string;
  location: string;
  deadline: string | null;
};

const STATUSES = ["watching", "applied", "interview", "offer", "rejected"] as const;
const STATUS_LABELS: Record<string, string> = {
  watching: "Watching",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

function DeadlineBadge({ date }: { date: string }) {
  const d = new Date(date);
  // eslint-disable-next-line react-hooks/purity -- display-only comparison, no correctness/hydration stakes worth threading a server date through three layers for
  const isPast = d.getTime() < Date.now() - 86400000;
  const label = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return (
    <span
      className={`flex-none rounded-full border px-1.5 py-0.5 text-[10px] ${
        isPast ? "border-rust text-rust" : "border-hairline text-paper-faint"
      }`}
    >
      Due {label}
    </span>
  );
}

export function OpportunityRow({ opp, files }: { opp: Opportunity; files: OpportunityFile[] }) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(opp.status);
  const [, startTransition] = useTransition();

  function handleStatusChange(newStatus: string) {
    setStatus(newStatus); // instant visual feedback
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", opp.id);
      fd.set("status", newStatus);
      await updateOpportunityStatus(fd);
    });
  }

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await editOpportunity(formData);
          setEditing(false);
        }}
        className="space-y-2 rounded-md border border-thread p-3"
      >
        <input type="hidden" name="id" value={opp.id} />
        <input
          type="text"
          name="name"
          defaultValue={opp.name}
          placeholder="Name"
          autoFocus
          className="w-full rounded-md border border-hairline bg-ink px-2 py-1 text-sm text-paper outline-none focus:border-thread"
        />
        <TypeSelect defaultValue={opp.type} />
        <input
          type="text"
          name="nextAction"
          defaultValue={opp.next_action}
          placeholder="Next action"
          className="w-full rounded-md border border-hairline bg-ink px-2 py-1 text-sm text-paper outline-none focus:border-thread"
        />
        <div className="flex gap-2">
          <input
            type="text"
            name="location"
            defaultValue={opp.location}
            placeholder="Location (e.g. Remote, London)"
            className="flex-1 rounded-md border border-hairline bg-ink px-2 py-1 text-sm text-paper outline-none focus:border-thread"
          />
          <input
            type="date"
            name="deadline"
            defaultValue={opp.deadline ?? ""}
            className="rounded-md border border-hairline bg-ink px-2 py-1 text-sm text-paper outline-none focus:border-thread"
          />
        </div>
        <input
          type="url"
          name="link"
          defaultValue={opp.link}
          placeholder="Link (job posting URL)"
          className="w-full rounded-md border border-hairline bg-ink px-2 py-1 text-sm text-paper outline-none focus:border-thread"
        />
        <input
          type="text"
          name="contact"
          defaultValue={opp.contact}
          placeholder="Contact (name, email)"
          className="w-full rounded-md border border-hairline bg-ink px-2 py-1 text-sm text-paper outline-none focus:border-thread"
        />
        <textarea
          name="notes"
          defaultValue={opp.notes}
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
    <div className="rounded-md border border-hairline p-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="min-w-0 truncate text-sm text-paper">{opp.name}</span>
            {opp.type && (
              <span className="flex-none rounded-full border border-hairline px-1.5 py-0.5 text-[10px] text-paper-faint">
                {opp.type}
              </span>
            )}
            {opp.deadline && <DeadlineBadge date={opp.deadline} />}
            {opp.link && (
              <a
                href={opp.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-thread hover:underline"
              >
                Link ↗
              </a>
            )}
          </div>
          {(opp.next_action || opp.location) && (
            <p className="mt-1 text-xs text-paper-muted">
              {opp.next_action && <>Next: {opp.next_action}</>}
              {opp.next_action && opp.location && " · "}
              {opp.location}
            </p>
          )}
        </div>
        <div className="flex flex-none items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md px-2 py-1 text-xs text-paper-muted transition-colors hover:bg-surface-raised hover:text-paper"
            aria-label="Edit opportunity"
          >
            Edit
          </button>
          <form action={deleteOpportunity}>
            <input type="hidden" name="id" value={opp.id} />
            <button
              type="submit"
              className="rounded-md px-2 py-1 text-xs text-paper-muted transition-colors hover:bg-surface-raised hover:text-rust"
              aria-label="Remove opportunity"
            >
              Remove
            </button>
          </form>
        </div>
      </div>
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
      <OpportunityFiles opportunityId={opp.id} files={files} />
    </div>
  );
}
