import { TopBar } from "@/components/TopBar";
import { OpportunitiesBoard } from "@/components/OpportunitiesBoard";
import { CVCard } from "@/components/CVCard";
import { getOpportunities } from "@/lib/strands";
import { getCurrentCV } from "@/lib/documents";

export default async function OpportunitiesPage() {
  const [opportunities, cv] = await Promise.all([getOpportunities(), getCurrentCV()]);

  return (
    <>
      <TopBar title="Opportunities" />
      <main className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-xl space-y-5">
          <CVCard cv={cv} />
          <OpportunitiesBoard opportunities={opportunities} />
        </div>
      </main>
    </>
  );
}
