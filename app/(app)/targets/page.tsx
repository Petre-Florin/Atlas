import { TopBar } from "@/components/TopBar";
import { TargetsCard } from "@/components/TargetsCard";
import { getTargets, getArchivedTargets } from "@/lib/strands";

export default async function TargetsPage() {
  const [targets, archivedTargets] = await Promise.all([
    getTargets(),
    getArchivedTargets(),
  ]);

  return (
    <>
      <TopBar title="Targets" />
      <main className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-xl">
          <TargetsCard targets={targets} archivedTargets={archivedTargets} />
        </div>
      </main>
    </>
  );
}
