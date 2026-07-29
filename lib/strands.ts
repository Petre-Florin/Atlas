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

export async function getGoalTemplates() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goal_templates")
    .select("id, title")
    .order("sort_order", { ascending: true });
  logIfError("getGoalTemplates", error);
  return data ?? [];
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
    .select("wins, mistakes, tomorrow, productivity")
    .eq("for_date", today)
    .maybeSingle();
  logIfError("getTodayJournal", error);
  return data ?? { wins: "", mistakes: "", tomorrow: "", productivity: null };
}

export async function getRecentJournalEntries(limit = 7) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .select("for_date, wins, mistakes, tomorrow, productivity")
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

export async function getOpportunities() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select("id, name, type, status, next_action, notes, link, contact, location, deadline")
    .order("created_at", { ascending: true });
  logIfError("getOpportunities", error);
  return data ?? [];
}

export async function getTargets() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("targets")
    .select("id, title, unit, current_count, target_count")
    .eq("archived", false)
    .order("sort_order", { ascending: true });
  logIfError("getTargets", error);
  return data ?? [];
}

export async function getArchivedTargets() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("targets")
    .select("id, title, unit, current_count, target_count")
    .eq("archived", true)
    .order("created_at", { ascending: true });
  logIfError("getArchivedTargets", error);
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

// ============================================================
// Analytics — all derived from data you already have. Nothing
// here is stored separately; it's recomputed from goals, habit
// logs, and journal entries for each past date.
// ============================================================

function datesBack(today: string, days: number): string[] {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export type DayScore = { date: string; score: number | null };

export async function getScoreHistory(days = 30): Promise<DayScore[]> {
  const today = await getTodayForUser();
  const dates = datesBack(today, days);
  const startDate = dates[0];

  const supabase = await createClient();
  const [goalsRes, habitsRes, logsRes, journalRes] = await Promise.all([
    supabase.from("goals").select("for_date, done").gte("for_date", startDate),
    supabase.from("habits").select("id").eq("archived", false),
    supabase.from("habit_logs").select("habit_id, for_date").gte("for_date", startDate),
    supabase
      .from("journal_entries")
      .select("for_date, wins, mistakes, tomorrow")
      .gte("for_date", startDate),
  ]);
  logIfError("getScoreHistory (goals)", goalsRes.error);
  logIfError("getScoreHistory (habits)", habitsRes.error);
  logIfError("getScoreHistory (logs)", logsRes.error);
  logIfError("getScoreHistory (journal)", journalRes.error);

  const goals = goalsRes.data ?? [];
  const activeHabitCount = (habitsRes.data ?? []).length;
  const logs = logsRes.data ?? [];
  const journalEntries = journalRes.data ?? [];

  return dates.map((date) => {
    const goalsForDate = goals.filter((g) => g.for_date === date);
    const loggedHabitIds = new Set(
      logs.filter((l) => l.for_date === date).map((l) => l.habit_id)
    );
    const journalEntry = journalEntries.find((j) => j.for_date === date);
    const journalStarted = Boolean(
      journalEntry && (journalEntry.wins || journalEntry.mistakes || journalEntry.tomorrow)
    );

    const parts: number[] = [];
    if (goalsForDate.length > 0) {
      parts.push(goalsForDate.filter((g) => g.done).length / goalsForDate.length);
    }
    if (activeHabitCount > 0) {
      parts.push(loggedHabitIds.size / activeHabitCount);
    }
    parts.push(journalStarted ? 1 : 0);

    return { date, score: parts.length > 0 ? parts.reduce((a, b) => a + b, 0) / parts.length : null };
  });
}

export type HabitConsistency = {
  id: string;
  name: string;
  ratio: number;
  loggedCount: number;
  windowDays: number;
};

export async function getHabitConsistency(days = 30): Promise<HabitConsistency[]> {
  const today = await getTodayForUser();
  const startDate = datesBack(today, days)[0];

  const supabase = await createClient();
  const [habitsRes, logsRes] = await Promise.all([
    supabase.from("habits").select("id, name, created_at").eq("archived", false),
    supabase.from("habit_logs").select("habit_id, for_date").gte("for_date", startDate),
  ]);
  logIfError("getHabitConsistency (habits)", habitsRes.error);
  logIfError("getHabitConsistency (logs)", logsRes.error);

  const logs = logsRes.data ?? [];
  const todayMs = new Date(today).getTime();

  return (habitsRes.data ?? [])
    .map((h) => {
      const createdDate = h.created_at.slice(0, 10);
      const daysSinceCreated =
        Math.floor((todayMs - new Date(createdDate).getTime()) / 86400000) + 1;
      const windowDays = Math.min(days, Math.max(1, daysSinceCreated));
      const loggedCount = logs.filter((l) => l.habit_id === h.id).length;
      return {
        id: h.id,
        name: h.name,
        ratio: loggedCount / windowDays,
        loggedCount,
        windowDays,
      };
    })
    .sort((a, b) => b.ratio - a.ratio);
}

export type JournalStats = { entriesInWindow: number; currentStreak: number; windowDays: number };

export async function getJournalStats(days = 30): Promise<JournalStats> {
  const today = await getTodayForUser();
  const startDate = datesBack(today, days)[0];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .select("for_date, wins, mistakes, tomorrow")
    .gte("for_date", startDate);
  logIfError("getJournalStats", error);

  const entries = (data ?? []).filter((j) => j.wins || j.mistakes || j.tomorrow);
  const dates = entries.map((j) => j.for_date);

  return {
    entriesInWindow: entries.length,
    currentStreak: computeStreak(dates, today),
    windowDays: days,
  };
}
