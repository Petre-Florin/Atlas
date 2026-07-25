import { TopBar } from "@/components/TopBar";
import { GoalsCard } from "@/components/GoalsCard";
import { getGoals, getTomorrowGoals, getGoalTemplates } from "@/lib/strands";

export default async function GoalsPage() {
  const [goals, tomorrowGoals, templates] = await Promise.all([
    getGoals(),
    getTomorrowGoals(),
    getGoalTemplates(),
  ]);

  return (
    <>
      <TopBar title="Goals" />
      <main className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-xl space-y-5">
          <GoalsCard goals={goals} templates={templates} />
          <GoalsCard goals={tomorrowGoals} variant="tomorrow" />
        </div>
      </main>
    </>
  );
}
