import { createClient } from "@/lib/supabase/server";
import { getTodayForUser, getTomorrowForUser } from "@/lib/timezone";

function logIfError(label: string, error: { message: string } | null) {
  if (error) {
    console.error(`${label} failed:`, error.message);
  }
}

// RLS already scopes every table to the signed-in user, but every read
// here also filters on user_id explicitly as a second, independent
// layer — so a single misconfigured policy can't silently turn into a
// data leak. Mirrors the same principle already applied to writes and
// to the JSON import path.
async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function getGoalsForDate(dateStr: string) {
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) return [];
  const { data, error } = await supabase
    .from("goals")
    .select("id, title, done")
    .eq("user_id", userId)
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

export type HabitFrequency = {
  type: "daily" | "weekly_days" | "weekly_count";
  days: number[]; // weekday numbers due, 0=Sun..6=Sat — only for weekly_days
  count: number | null; // target logs per week — only for weekly_count
};

function computeWeeklyDaysStreak(dates: string[], today: string, dueDays: number[]): number {
  if (dueDays.length === 0) return 0;
  const set = new Set(dates);
  const cursor = new Date(today);
  const todayWeekday = cursor.getUTCDay();

  if (!dueDays.includes(todayWeekday) || !set.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  let guard = 0;
  while (guard < 3660) {
    const weekday = cursor.getUTCDay();
    if (dueDays.includes(weekday)) {
      const dateStr = cursor.toISOString().slice(0, 10);
      if (set.has(dateStr)) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    } else {
      cursor.setDate(cursor.getDate() - 1);
    }
    guard += 1;
  }
  return streak;
}

function startOfWeek(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function shiftWeek(weekStart: string, weeks: number): string {
  const d = new Date(weekStart);
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

function computeWeeklyCountStreak(dates: string[], today: string, target: number): number {
  if (!target || target <= 0) return 0;

  const counts = new Map<string, number>();
  for (const d of dates) {
    const wk = startOfWeek(d);
    counts.set(wk, (counts.get(wk) ?? 0) + 1);
  }

  let cursorWeek = startOfWeek(today);
  const currentWeekMet = (counts.get(cursorWeek) ?? 0) >= target;

  // An in-progress week that hasn't hit target yet doesn't break the streak —
  // only fully-elapsed past weeks count as broken.
  if (!currentWeekMet) {
    cursorWeek = shiftWeek(cursorWeek, -1);
  }

  let streak = 0;
  let guard = 0;
  while (guard < 520) {
    const count = counts.get(cursorWeek) ?? 0;
    if (count >= target) {
      streak += 1;
      cursorWeek = shiftWeek(cursorWeek, -1);
    } else {
      break;
    }
    guard += 1;
  }
  return streak;
}

function isDueToday(freq: HabitFrequency, today: string): boolean {
  if (freq.type === "weekly_days") {
    return freq.days.includes(new Date(today).getUTCDay());
  }
  return true; // daily and weekly_count have no fixed "due" restriction
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
  const userId = await getUserId(supabase);
  if (!userId) return [];
  const { data, error } = await supabase
    .from("goal_templates")
    .select("id, title")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });
  logIfError("getGoalTemplates", error);
  return data ?? [];
}

export async function getHabitsWithStreaks() {
  const today = await getTodayForUser();
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) return [];
  const [habitsRes, logsRes] = await Promise.all([
    supabase
      .from("habits")
      .select("id, name, frequency_type, frequency_days, frequency_count")
      .eq("user_id", userId)
      .eq("archived", false)
      .order("sort_order", { ascending: true }),
    supabase
      .from("habit_logs")
      .select("habit_id, for_date")
      .eq("user_id", userId)
      .order("for_date", { ascending: false }),
  ]);
  logIfError("getHabitsWithStreaks (habits)", habitsRes.error);
  logIfError("getHabitsWithStreaks (logs)", logsRes.error);

  const habitsRaw = habitsRes.data ?? [];
  const logs = logsRes.data ?? [];
  const currentWeek = startOfWeek(today);

  return habitsRaw.map((h) => {
    const habitDates = logs.filter((l) => l.habit_id === h.id).map((l) => l.for_date);
    const freq: HabitFrequency = {
      type: (h.frequency_type as HabitFrequency["type"]) || "daily",
      days: h.frequency_days ?? [],
      count: h.frequency_count,
    };

    let streak: number;
    let streakUnit: "days" | "weeks";
    if (freq.type === "weekly_days") {
      streak = computeWeeklyDaysStreak(habitDates, today, freq.days);
      streakUnit = "days";
    } else if (freq.type === "weekly_count") {
      streak = computeWeeklyCountStreak(habitDates, today, freq.count ?? 0);
      streakUnit = "weeks";
    } else {
      streak = computeStreak(habitDates, today);
      streakUnit = "days";
    }

    const weekProgress =
      freq.type === "weekly_count"
        ? {
            count: habitDates.filter((d) => startOfWeek(d) === currentWeek).length,
            target: freq.count ?? 0,
          }
        : undefined;

    return {
      id: h.id,
      name: h.name,
      streak,
      streakUnit,
      loggedToday: habitDates.includes(today),
      loggedDates: new Set(habitDates),
      frequency: freq,
      dueToday: isDueToday(freq, today),
      weekProgress,
    };
  });
}

export async function getTodayJournal() {
  const today = await getTodayForUser();
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) return { wins: "", mistakes: "", tomorrow: "", productivity: null };
  const { data, error } = await supabase
    .from("journal_entries")
    .select("wins, mistakes, tomorrow, productivity")
    .eq("user_id", userId)
    .eq("for_date", today)
    .maybeSingle();
  logIfError("getTodayJournal", error);
  return data ?? { wins: "", mistakes: "", tomorrow: "", productivity: null };
}

export async function getRecentJournalEntries(limit = 7) {
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) return [];
  const { data, error } = await supabase
    .from("journal_entries")
    .select("for_date, wins, mistakes, tomorrow, productivity")
    .eq("user_id", userId)
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

export async function getArchivedHabits() {
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) return [];
  const { data, error } = await supabase
    .from("habits")
    .select("id, name")
    .eq("user_id", userId)
    .eq("archived", true)
    .order("created_at", { ascending: true });
  logIfError("getArchivedHabits", error);
  return data ?? [];
}

export async function getOpportunities() {
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) return [];
  const { data, error } = await supabase
    .from("opportunities")
    .select("id, name, type, status, next_action, notes, link, contact, location, deadline")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  logIfError("getOpportunities", error);
  return data ?? [];
}

export async function getTargets() {
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) return [];
  const { data, error } = await supabase
    .from("targets")
    .select("id, title, unit, current_count, target_count")
    .eq("user_id", userId)
    .eq("archived", false)
    .order("sort_order", { ascending: true });
  logIfError("getTargets", error);
  return data ?? [];
}

export async function getArchivedTargets() {
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) return [];
  const { data, error } = await supabase
    .from("targets")
    .select("id, title, unit, current_count, target_count")
    .eq("user_id", userId)
    .eq("archived", true)
    .order("created_at", { ascending: true });
  logIfError("getArchivedTargets", error);
  return data ?? [];
}

export async function getProjects() {
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) return [];
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, status, next_action, notes, link, last_touched_at")
    .eq("user_id", userId)
    .eq("archived", false)
    .order("sort_order", { ascending: true });
  logIfError("getProjects", error);
  return data ?? [];
}

export async function getArchivedProjects() {
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) return [];
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, status, last_touched_at")
    .eq("user_id", userId)
    .eq("archived", true)
    .order("created_at", { ascending: true });
  logIfError("getArchivedProjects", error);
  return data ?? [];
}

const MILESTONE_STREAKS = [7, 14, 30, 60, 100, 150, 200, 365];
const MILESTONE_WEEKS = [4, 8, 12, 26, 52, 104];

export function reachedMilestoneToday(habit: {
  streak: number;
  loggedToday: boolean;
  streakUnit?: "days" | "weeks";
}) {
  if (!habit.loggedToday) return false;
  const list = habit.streakUnit === "weeks" ? MILESTONE_WEEKS : MILESTONE_STREAKS;
  return list.includes(habit.streak);
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

function expectedOccurrencesInWindow(
  freq: HabitFrequency,
  windowDays: number,
  today: string
): number {
  if (freq.type === "daily") return windowDays;
  if (freq.type === "weekly_count") return (windowDays / 7) * (freq.count ?? 0);

  if (freq.days.length === 0) return windowDays; // fallback safety
  let count = 0;
  const cursor = new Date(today);
  for (let i = 0; i < windowDays; i++) {
    if (freq.days.includes(cursor.getUTCDay())) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return count;
}

export type HabitConsistency = {
  id: string;
  name: string;
  ratio: number;
  loggedCount: number;
  windowDays: number;
  expected: number;
};

export type JournalStats = { entriesInWindow: number; currentStreak: number; windowDays: number };

export type DayProductivity = { date: string; productivity: number | null };

// ============================================================
// Page-level aggregators — Dashboard and Analytics each render
// several widgets that used to call separate functions above,
// several of which independently re-queried the same tables
// (goals, habits, habit_logs, journal_entries) over overlapping
// windows. These two functions fetch each table exactly once per
// page load and derive every widget's data from that shared
// result, using the same calculation logic as the individual
// functions above (which remain in place for the standalone
// Goals/Habits/Targets/Journal pages, which don't have this
// redundancy problem since each only calls one fetcher).
// ============================================================

export type DashboardData = {
  goals: { id: string; title: string; done: boolean }[];
  habits: Awaited<ReturnType<typeof getHabitsWithStreaks>>;
  journal: { wins: string; mistakes: string; tomorrow: string; productivity: number | null };
  activity: ActivityItem[];
  generalDates: Set<string>;
  targets: { id: string; title: string; unit: string; current_count: number; target_count: number }[];
};

export async function getDashboardData(): Promise<DashboardData> {
  const today = await getTodayForUser();
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) {
    return {
      goals: [],
      habits: [],
      journal: { wins: "", mistakes: "", tomorrow: "", productivity: null },
      activity: [],
      generalDates: new Set(),
      targets: [],
    };
  }

  // A 60-day buffer comfortably covers the 35-day heatmap and the
  // recent-activity feed without re-fetching a user's entire goal/journal
  // history on every dashboard load. Habit logs stay unbounded, since
  // streak length has no fixed ceiling and correctness there matters more
  // than shaving a bit more off the payload.
  const windowStart = (() => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - 60);
    return d.toISOString().slice(0, 10);
  })();

  const [habitsRes, logsRes, goalsRes, journalRes, targetsRes] = await Promise.all([
    supabase
      .from("habits")
      .select("id, name, frequency_type, frequency_days, frequency_count")
      .eq("user_id", userId)
      .eq("archived", false)
      .order("sort_order", { ascending: true }),
    supabase
      .from("habit_logs")
      .select("habit_id, for_date, created_at")
      .eq("user_id", userId)
      .order("for_date", { ascending: false }),
    supabase
      .from("goals")
      .select("id, title, done, completed_at, for_date")
      .eq("user_id", userId)
      .gte("for_date", windowStart)
      .order("created_at", { ascending: true }),
    supabase
      .from("journal_entries")
      .select("for_date, wins, mistakes, tomorrow, productivity, updated_at")
      .eq("user_id", userId)
      .gte("for_date", windowStart),
    supabase
      .from("targets")
      .select("id, title, unit, current_count, target_count")
      .eq("user_id", userId)
      .eq("archived", false)
      .order("sort_order", { ascending: true }),
  ]);

  logIfError("getDashboardData (habits)", habitsRes.error);
  logIfError("getDashboardData (logs)", logsRes.error);
  logIfError("getDashboardData (goals)", goalsRes.error);
  logIfError("getDashboardData (journal)", journalRes.error);
  logIfError("getDashboardData (targets)", targetsRes.error);

  const habitsRaw = habitsRes.data ?? [];
  const logs = logsRes.data ?? [];
  const goalsWindow = goalsRes.data ?? [];
  const journalWindow = journalRes.data ?? [];
  const targets = targetsRes.data ?? [];

  // ---- Habits with streaks (same logic as getHabitsWithStreaks) ----
  const currentWeek = startOfWeek(today);
  const habits = habitsRaw.map((h) => {
    const habitDates = logs.filter((l) => l.habit_id === h.id).map((l) => l.for_date);
    const freq: HabitFrequency = {
      type: (h.frequency_type as HabitFrequency["type"]) || "daily",
      days: h.frequency_days ?? [],
      count: h.frequency_count,
    };

    let streak: number;
    let streakUnit: "days" | "weeks";
    if (freq.type === "weekly_days") {
      streak = computeWeeklyDaysStreak(habitDates, today, freq.days);
      streakUnit = "days";
    } else if (freq.type === "weekly_count") {
      streak = computeWeeklyCountStreak(habitDates, today, freq.count ?? 0);
      streakUnit = "weeks";
    } else {
      streak = computeStreak(habitDates, today);
      streakUnit = "days";
    }

    const weekProgress =
      freq.type === "weekly_count"
        ? {
            count: habitDates.filter((d) => startOfWeek(d) === currentWeek).length,
            target: freq.count ?? 0,
          }
        : undefined;

    return {
      id: h.id,
      name: h.name,
      streak,
      streakUnit,
      loggedToday: habitDates.includes(today),
      loggedDates: new Set(habitDates),
      frequency: freq,
      dueToday: isDueToday(freq, today),
      weekProgress,
    };
  });

  // ---- Today's goals ----
  const goals = goalsWindow
    .filter((g) => g.for_date === today)
    .map((g) => ({ id: g.id, title: g.title, done: g.done }));

  // ---- Today's journal ----
  const journalToday = journalWindow.find((j) => j.for_date === today);
  const journal = journalToday
    ? {
        wins: journalToday.wins,
        mistakes: journalToday.mistakes,
        tomorrow: journalToday.tomorrow,
        productivity: journalToday.productivity,
      }
    : { wins: "", mistakes: "", tomorrow: "", productivity: null };

  // ---- Recent activity feed ----
  // Note: unlike the original getRecentActivity, this only looks within the
  // 60-day goals/journal window for candidates before taking the most recent
  // 6 — a real but minor behavior difference: if nothing's been completed or
  // written in 60+ days, this shows fewer items instead of reaching further
  // back. Habit logs are unaffected since that fetch stays unbounded.
  const habitNames = new Map(habitsRaw.map((h) => [h.id, h.name]));
  const activityLimit = 6;
  const activityItems: ActivityItem[] = [
    ...goalsWindow
      .filter((g) => g.completed_at !== null)
      .sort((a, b) => new Date(b.completed_at as string).getTime() - new Date(a.completed_at as string).getTime())
      .slice(0, activityLimit)
      .map((g) => ({ date: g.completed_at as string, label: `Completed "${g.title}"` })),
    ...[...logs]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, activityLimit)
      .map((l) => ({ date: l.created_at, label: `Logged ${habitNames.get(l.habit_id) ?? "a habit"}` })),
    ...[...journalWindow]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, activityLimit)
      .map((j) => ({ date: j.updated_at, label: "Wrote in journal" })),
  ];
  const activity = activityItems
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, activityLimit);

  // ---- General activity dates (heatmap only ever reads the last 35 days,
  // so the 60-day goals/journal window and the unbounded habit-log fetch
  // both cover it with room to spare) ----
  const generalDates = new Set<string>();
  goalsWindow.filter((g) => g.done).forEach((g) => generalDates.add(g.for_date));
  logs.forEach((l) => generalDates.add(l.for_date));
  journalWindow.forEach((j) => generalDates.add(j.for_date));

  return { goals, habits, journal, activity, generalDates, targets };
}

export type AnalyticsData = {
  scoreHistory: DayScore[];
  habitConsistency: HabitConsistency[];
  journalStats: JournalStats;
  productivityHistory: DayProductivity[];
};

export async function getAnalyticsData(days = 30): Promise<AnalyticsData> {
  const today = await getTodayForUser();
  const dates = datesBack(today, days);
  const startDate = dates[0];

  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) {
    return {
      scoreHistory: dates.map((date) => ({ date, score: null })),
      habitConsistency: [],
      journalStats: { entriesInWindow: 0, currentStreak: 0, windowDays: days },
      productivityHistory: dates.map((date) => ({ date, productivity: null })),
    };
  }
  const [goalsRes, habitsRes, logsRes, journalRes] = await Promise.all([
    supabase
      .from("goals")
      .select("for_date, done")
      .eq("user_id", userId)
      .gte("for_date", startDate),
    supabase
      .from("habits")
      .select("id, name, created_at, frequency_type, frequency_days, frequency_count")
      .eq("user_id", userId)
      .eq("archived", false),
    supabase
      .from("habit_logs")
      .select("habit_id, for_date")
      .eq("user_id", userId)
      .gte("for_date", startDate),
    supabase
      .from("journal_entries")
      .select("for_date, wins, mistakes, tomorrow, productivity")
      .eq("user_id", userId)
      .gte("for_date", startDate),
  ]);
  logIfError("getAnalyticsData (goals)", goalsRes.error);
  logIfError("getAnalyticsData (habits)", habitsRes.error);
  logIfError("getAnalyticsData (logs)", logsRes.error);
  logIfError("getAnalyticsData (journal)", journalRes.error);

  const goals = goalsRes.data ?? [];
  const habitsRaw = habitsRes.data ?? [];
  const logs = logsRes.data ?? [];
  const journalEntries = journalRes.data ?? [];
  const activeHabitCount = habitsRaw.length;

  // ---- Daily score history (same logic as getScoreHistory) ----
  const scoreHistory: DayScore[] = dates.map((date) => {
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

    return {
      date,
      score: parts.length > 0 ? parts.reduce((a, b) => a + b, 0) / parts.length : null,
    };
  });

  // ---- Habit consistency (same logic as getHabitConsistency) ----
  const todayMs = new Date(today).getTime();
  const habitConsistency: HabitConsistency[] = habitsRaw
    .map((h) => {
      const createdDate = h.created_at.slice(0, 10);
      const daysSinceCreated =
        Math.floor((todayMs - new Date(createdDate).getTime()) / 86400000) + 1;
      const windowDays = Math.min(days, Math.max(1, daysSinceCreated));
      const loggedCount = logs.filter((l) => l.habit_id === h.id).length;
      const freq: HabitFrequency = {
        type: (h.frequency_type as HabitFrequency["type"]) || "daily",
        days: h.frequency_days ?? [],
        count: h.frequency_count,
      };
      const expected = Math.max(1, expectedOccurrencesInWindow(freq, windowDays, today));
      return {
        id: h.id,
        name: h.name,
        ratio: Math.min(1, loggedCount / expected),
        loggedCount,
        windowDays,
        expected: Math.round(expected),
      };
    })
    .sort((a, b) => b.ratio - a.ratio);

  // ---- Journal stats (same logic as getJournalStats, including its
  // existing limitation: currentStreak is only ever as accurate as this
  // `days`-day window — unchanged from before this consolidation) ----
  const journalEntriesFiltered = journalEntries.filter((j) => j.wins || j.mistakes || j.tomorrow);
  const journalDates = journalEntriesFiltered.map((j) => j.for_date);
  const journalStats: JournalStats = {
    entriesInWindow: journalEntriesFiltered.length,
    currentStreak: computeStreak(journalDates, today),
    windowDays: days,
  };

  // ---- Productivity history (same logic as getProductivityHistory) ----
  const productivityByDate = new Map(
    journalEntries.map((j) => [j.for_date, j.productivity as number | null])
  );
  const productivityHistory: DayProductivity[] = dates.map((date) => ({
    date,
    productivity: productivityByDate.get(date) ?? null,
  }));

  return { scoreHistory, habitConsistency, journalStats, productivityHistory };
}
