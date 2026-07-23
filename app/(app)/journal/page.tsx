import { TopBar } from "@/components/TopBar";
import { JournalCard } from "@/components/JournalCard";
import { getTodayJournal, getRecentJournalEntries } from "@/lib/strands";
import { getTodayForUser } from "@/lib/timezone";

export default async function JournalPage() {
  const [entry, recentEntries, today] = await Promise.all([
    getTodayJournal(),
    getRecentJournalEntries(),
    getTodayForUser(),
  ]);

  return (
    <>
      <TopBar title="Journal" />
      <main className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-xl">
          <JournalCard entry={entry} recentEntries={recentEntries} today={today} />
        </div>
      </main>
    </>
  );
}
