import { TopBar } from "@/components/TopBar";
import { Widget } from "@/components/Widget";
import { ProgressRing } from "@/components/ProgressRing";
import { HabitHeatmap } from "@/components/HabitHeatmap";
import { DailyScoreHero } from "@/components/DailyScoreHero";
import { ActivityFeed } from "@/components/ActivityFeed";
import { MilestoneBanner } from "@/components/MilestoneBanner";
import {
  getGoals,
  getHabitsWithStreaks,
  getTodayJournal,
  getRecentActivity,
  getGeneralActivityDates,
  computeDailyScore,
  reachedMilestoneToday,
} from "@/lib/strands";
import { createClient } from "@/lib/supabase/server";
import { getUserTimezone } from "@/lib/timezone";

function displayName(email: string | undefined) {
  if (!email) return "there";
  const local = email.split("@")[0];
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [goals, habits, journal, activity, generalDates, timeZone] = await Promise.all([
    getGoals(),
    getHabitsWithStreaks(),
    getTodayJournal(),
    getRecentActivity(),
    getGeneralActivityDates(),
    getUserTimezone(),
  ]);

  const doneCount = goals.filter((g) => g.done).length;
  const goalsRatio = goals.length > 0 ? doneCount / goals.length : 0;
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);
  const journalStarted = Boolean(journal.wins || journal.mistakes || journal.tomorrow);
  const score = computeDailyScore(goals, habits, journalStarted);
  const milestoneHabit = habits.find(reachedMilestoneToday);

  return (
    <>
      <TopBar title="Dashboard" />
      <main className="flex-1 px-8 py-8">
        <DailyScoreHero name={displayName(user?.email)} score={score} timeZone={timeZone} />

        {milestoneHabit && (
          <MilestoneBanner habitName={milestoneHabit.name} streak={milestoneHabit.streak} />
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Widget eyebrow="Focus" title="Today's goals" href="/goals" delay={0}>
            <div className="flex items-center gap-4">
              <ProgressRing value={goalsRatio} />
              <div>
                <p className="text-sm text-paper">
                  {doneCount} of {goals.length || 0} done
                </p>
                <p className="mt-0.5 text-xs text-paper-muted">
                  {goals.length === 0 ? "Nothing added yet today" : "Keep going"}
                </p>
              </div>
            </div>
          </Widget>

          <Widget eyebrow="Streaks" title="Habits" href="/habits" delay={80}>
            {habits.length === 0 ? (
              <p className="text-sm text-paper-muted">No habits tracked yet.</p>
            ) : (
              <div>
                <p className="mb-3 text-sm text-paper">
                  Best streak:{" "}
                  <span className="font-data text-thread">{bestStreak}d</span>
                </p>
                <ul className="space-y-1.5">
                  {habits.slice(0, 3).map((h) => (
                    <li
                      key={h.id}
                      className="flex items-center justify-between text-xs text-paper-muted"
                    >
                      <span>{h.name}</span>
                      <span className="font-data">{h.streak}d</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Widget>

          <Widget eyebrow="Today" title="Journal" href="/journal" delay={160}>
            <p className="text-sm text-paper-muted">
              {journalStarted
                ? "Today's entry is in progress."
                : "You haven't written today's entry yet."}
            </p>
          </Widget>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div
            className="animate-fade-in-up rounded-2xl border border-hairline bg-surface p-6"
            style={{ animationDelay: "240ms" }}
          >
            <span className="font-data text-[11px] uppercase tracking-wider text-thread">
              Momentum
            </span>
            <h3 className="mb-4 mt-1 font-display text-lg text-paper">Last 35 days</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="w-28 flex-none truncate text-xs text-paper-muted">
                  Overall
                </span>
                <HabitHeatmap loggedDates={generalDates} />
              </div>
              {habits.length === 0 ? (
                <p className="pt-1 text-xs text-paper-faint">
                  No habits tracked yet — this row reflects any goal, habit, or journal
                  activity. Add a habit to see it broken out individually.
                </p>
              ) : (
                habits.map((h) => (
                  <div key={h.id} className="flex items-center gap-4">
                    <span className="w-28 flex-none truncate text-xs text-paper-muted">
                      {h.name}
                    </span>
                    <HabitHeatmap loggedDates={h.loggedDates} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            className="animate-fade-in-up rounded-2xl border border-hairline bg-surface p-6"
            style={{ animationDelay: "300ms" }}
          >
            <span className="font-data text-[11px] uppercase tracking-wider text-thread">
              Activity
            </span>
            <h3 className="mb-4 mt-1 font-display text-lg text-paper">Recently</h3>
            <ActivityFeed items={activity} />
          </div>
        </div>
      </main>
    </>
  );
}
