import { addOpportunity } from "@/app/actions";
import { OpportunityRow } from "./OpportunityRow";
import { TypeSelect } from "./TypeSelect";
import { SubmitButton } from "./SubmitButton";
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

const STATUS_ORDER = ["watching", "applied", "interview", "offer", "rejected"] as const;
const STATUS_LABELS: Record<string, string> = {
  watching: "Watching",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

export function OpportunitiesBoard({
  opportunities,
  filesByOpportunity,
}: {
  opportunities: Opportunity[];
  filesByOpportunity: Record<string, OpportunityFile[]>;
}) {
  return (
    <div
      className="animate-fade-in-up rounded-2xl border border-hairline bg-surface p-6"
      style={{ animationDelay: "160ms" }}
    >
      <h2 className="mb-5 font-display text-xl text-paper">Opportunities</h2>

      <form action={addOpportunity} className="mb-6 space-y-2">
        <input
          type="text"
          name="name"
          placeholder="Name (e.g. OpenAI, a hackathon, a contact)"
          className="w-full rounded-md border border-hairline bg-ink px-3 py-1.5 text-sm text-paper outline-none focus:border-thread"
        />
        <TypeSelect />
        <select
          name="status"
          defaultValue="watching"
          className="w-full rounded-md border border-hairline bg-ink px-3 py-1.5 text-sm text-paper outline-none focus:border-thread"
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="nextAction"
          placeholder="Next action"
          className="w-full rounded-md border border-hairline bg-ink px-3 py-1.5 text-sm text-paper outline-none focus:border-thread"
        />
        <div className="flex gap-2">
          <input
            type="text"
            name="location"
            placeholder="Location (e.g. Remote, London)"
            className="flex-1 rounded-md border border-hairline bg-ink px-3 py-1.5 text-sm text-paper outline-none focus:border-thread"
          />
          <input
            type="date"
            name="deadline"
            className="rounded-md border border-hairline bg-ink px-3 py-1.5 text-sm text-paper outline-none focus:border-thread"
          />
        </div>
        <input
          type="url"
          name="link"
          placeholder="Link (job posting URL)"
          className="w-full rounded-md border border-hairline bg-ink px-3 py-1.5 text-sm text-paper outline-none focus:border-thread"
        />
        <input
          type="text"
          name="contact"
          placeholder="Contact (name, email)"
          className="w-full rounded-md border border-hairline bg-ink px-3 py-1.5 text-sm text-paper outline-none focus:border-thread"
        />
        <textarea
          name="notes"
          placeholder="Notes"
          rows={2}
          className="w-full resize-none rounded-md border border-hairline bg-ink px-3 py-1.5 text-sm text-paper outline-none focus:border-thread"
        />
        <SubmitButton>Add</SubmitButton>
      </form>

      {opportunities.length === 0 ? (
        <p className="text-sm text-paper-muted">
          Nothing tracked yet — add the first one above.
        </p>
      ) : (
        <div className="space-y-6">
          {STATUS_ORDER.map((statusKey) => {
            const group = opportunities.filter((o) => o.status === statusKey);
            if (group.length === 0) return null;
            return (
              <div key={statusKey}>
                <h3 className="mb-2 font-data text-[11px] uppercase tracking-wider text-thread">
                  {STATUS_LABELS[statusKey]} ({group.length})
                </h3>
                <div className="space-y-2">
                  {group.map((o) => (
                    <OpportunityRow key={o.id} opp={o} files={filesByOpportunity[o.id] ?? []} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
