import { addOpportunity } from "@/app/actions";
import { OpportunityRow } from "./OpportunityRow";
import { SubmitButton } from "./SubmitButton";

type Opportunity = {
  id: string;
  name: string;
  type: string;
  status: string;
  next_action: string;
  notes: string;
};

const STATUS_ORDER = ["watching", "applied", "interview", "offer", "rejected"] as const;
const STATUS_LABELS: Record<string, string> = {
  watching: "Watching",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

export function OpportunitiesBoard({ opportunities }: { opportunities: Opportunity[] }) {
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
        <div className="flex gap-2">
          <input
            type="text"
            name="type"
            placeholder="Type (optional)"
            className="flex-1 rounded-md border border-hairline bg-ink px-3 py-1.5 text-sm text-paper outline-none focus:border-thread"
          />
          <SubmitButton>Add</SubmitButton>
        </div>
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
                    <OpportunityRow key={o.id} opp={o} />
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
