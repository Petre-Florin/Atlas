import { TopBar } from "@/components/TopBar";
import { HabitsCard } from "@/components/HabitsCard";
import { getHabitsWithStreaks, getArchivedHabits } from "@/lib/strands";

export default async function HabitsPage() {
  const [habits, archivedHabits] = await Promise.all([
    getHabitsWithStreaks(),
    getArchivedHabits(),
  ]);

  return (
    <>
      <TopBar title="Habits" />
      <main className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-xl">
          <HabitsCard habits={habits} archivedHabits={archivedHabits} />
        </div>
      </main>
    </>
  );
}
