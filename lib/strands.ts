import { createClient } from "@/lib/supabase/server";
import { getTodayForUser, getTomorrowForUser } from "@/lib/timezone";

function logIfError(label: string, error: { message: string } | null) {
  if (error) {
    console.error(`${label} failed:`, error.message);
  }
}

async function getGoalsForDate(dateStr: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("id, title, done")
    .eq("for_date", dateStr)
    .order("created_at", { ascending: true });
  logIfError(`getGoalsForDate(${dateStr})`, error);
  return data ?? [];
}

export function computeStreak(dates: string[], today: string): number {
  if (dates.length === 0) return 0;

  const set = new Set(dates);
  let streak = 0;
  const cursor = new Date(today);

  if (!set.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export async function getGoals() {
  const today = await getTodayForUser();
  return getGoalsForDate(today);
}

export async function getTomorrowGoals() {
  const tomorrow = await getTomorrowForUser();
  return getGoalsForDate(tomorrow);
}

export async function getHabitsWithStreaks() {
  const today = await getTodayForUser();
  const supabase = await createClient();
  const [habitsRes, logsRes] = await Promise.all([
    supabase
      .from("habits")
      .select("id, name")
      .eq("archived", false)
      .order("sort_order", { ascending: true }),
    supabase
      .from("habit_logs")
      .select("habit_id, for_date")
      .order("for_date", { ascending: false }),
  ]);
  logIfError("getHabitsWithStreaks (habits)", habitsRes.error);
  logIfError("getHabitsWithStreaks (logs)", logsRes.error);

  const habitsRaw = habitsRes.data ?? [];
  const logs = logsRes.data ?? [];

  return habitsRaw.map((h) => {
    const habitDates = logs.filter((l) => l.habit_id === h.id).map((l) => l.for_date);
    return {
      id: h.id,
      name: h.name,
      streak: computeStreak(habitDates, today),
      loggedToday: habitDates.includes(today),
      loggedDates: new Set(habitDates),
    };
  });
}

export async function getTodayJournal() {
  const today = await getTodayForUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .select("wins, mistakes, tomorrow")
    .eq("for_date", today)
    .maybeSingle();
  logIfError("getTodayJournal", error);
  return data ?? { wins: "", mistakes: "", tomorrow: "" };
}

export async function getRecentJournalEntries(limit = 7) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .select("for_date, wins, mistakes, tomorrow")
    .order("for_date", { ascending: false })
    .limit(limit);
  logIfError("getRecentJournalEntries", error);
  return data ?? [];
}

export type DailyScore = {
  value: number | null; // null when there's nothing to score yet
  parts: { label: string; ratio: number | null }[];
};

export function computeDailyScore(
  goals: { done: boolean }[],
  habits: { loggedToday: boolean }[],
  journalStarted: boolean
): DailyScore {
  const parts: { label: string; ratio: number | null }[] = [];

  parts.push({
    label: "Goals",
    ratio: goals.length > 0 ? goals.filter((g) => g.done).length / goals.length : null,
  });
  parts.push({
    label: "Habits",
    ratio:
      habits.length > 0 ? habits.filter((h) => h.loggedToday).length / habits.length : null,
  });
  parts.push({ label: "Journal", ratio: journalStarted ? 1 : 0 });

  const scored = parts.filter((p) => p.ratio !== null) as { label: string; ratio: number }[];
  const value =
    scored.length > 0 ? scored.reduce((sum, p) => sum + p.ratio, 0) / scored.length : null;

  return { value, parts };
}

type ActivityItem = { date: string; label: string };

export async function getRecentActivity(limit = 6): Promise<ActivityItem[]> {
  const supabase = await createClient();

  const [goalsRes, logsRes, journalRes, habitsRes] = await Promise.all([
    supabase
      .from("goals")
      .select("title, completed_at")
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(limit),
    supabase
      .from("habit_logs")
      .select("habit_id, for_date, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("journal_entries")
      .select("for_date, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase.from("habits").select("id, name"),
  ]);
  logIfError("getRecentActivity (goals)", goalsRes.error);
  logIfError("getRecentActivity (logs)", logsRes.error);
  logIfError("getRecentActivity (journal)", journalRes.error);
  logIfError("getRecentActivity (habits)", habitsRes.error);

  const habitNames = new Map((habitsRes.data ?? []).map((h) => [h.id, h.name]));

  const items: ActivityItem[] = [
    ...(goalsRes.data ?? []).map((g) => ({
      date: g.completed_at as string,
      label: `Completed "${g.title}"`,
    })),
    ...(logsRes.data ?? []).map((l) => ({
      date: l.created_at,
      label: `Logged ${habitNames.get(l.habit_id) ?? "a habit"}`,
    })),
    ...(journalRes.data ?? []).map((j) => ({
      date: j.updated_at,
      label: "Wrote in journal",
    })),
  ];

  return items
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

export async function getArchivedHabits() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("habits")
    .select("id, name")
    .eq("archived", true)
    .order("created_at", { ascending: true });
  logIfError("getArchivedHabits", error);
  return data ?? [];
}

export async function getGeneralActivityDates(): Promise<Set<string>> {
  const supabase = await createClient();

  const [goalsRes, logsRes, journalRes] = await Promise.all([
    supabase.from("goals").select("for_date").eq("done", true),
    supabase.from("habit_logs").select("for_date"),
    supabase.from("journal_entries").select("for_date"),
  ]);
  logIfError("getGeneralActivityDates (goals)", goalsRes.error);
  logIfError("getGeneralActivityDates (logs)", logsRes.error);
  logIfError("getGeneralActivityDates (journal)", journalRes.error);

  const dates = new Set<string>();
  (goalsRes.data ?? []).forEach((g) => dates.add(g.for_date));
  (logsRes.data ?? []).forEach((l) => dates.add(l.for_date));
  (journalRes.data ?? []).forEach((j) => dates.add(j.for_date));

  return dates;
}

const MILESTONE_STREAKS = [7, 14, 30, 60, 100, 150, 200, 365];

export function reachedMilestoneToday(habit: { streak: number; loggedToday: boolean }) {
  return habit.loggedToday && MILESTONE_STREAKS.includes(habit.streak);
}
