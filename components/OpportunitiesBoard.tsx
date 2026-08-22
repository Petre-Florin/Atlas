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
          className="field w-full text-sm"
        />
        <TypeSelect />
        <select
          name="status"
          defaultValue="watching"
          className="field field-select w-full text-sm"
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
          className="field w-full text-sm"
        />
        <div className="flex gap-2">
          <input
            type="text"
            name="location"
            placeholder="Location (e.g. Remote, London)"
            className="field flex-1 text-sm"
          />
          <input
            type="date"
            name="deadline"
            className="field text-sm"
          />
        </div>
        <input
          type="url"
          name="link"
          placeholder="Link (job posting URL)"
          className="field w-full text-sm"
        />
        <input
          type="text"
          name="contact"
          placeholder="Contact (name, email)"
          className="field w-full text-sm"
        />
        <textarea
          name="notes"
          placeholder="Notes"
          rows={2}
          className="field resize-none w-full text-sm"
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
