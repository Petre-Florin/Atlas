import { createClient } from "@/lib/supabase/server";

export const EXPORT_VERSION = 1;

export type FullExport = {
  version: number;
  exportedAt: string;
  goals: Record<string, unknown>[];
  habits: Record<string, unknown>[];
  habitLogs: Record<string, unknown>[];
  journalEntries: Record<string, unknown>[];
  targets: Record<string, unknown>[];
  goalTemplates: Record<string, unknown>[];
  opportunities: Record<string, unknown>[];
};

function stripUserId(rows: Record<string, unknown>[] | null): Record<string, unknown>[] {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructured only to exclude it from the rest
  return (rows ?? []).map(({ user_id: _userId, ...rest }) => rest);
}

export async function getFullExport(): Promise<FullExport | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [goals, habits, habitLogs, journalEntries, targets, goalTemplates, opportunities] =
    await Promise.all([
      supabase.from("goals").select("*").eq("user_id", user.id),
      supabase.from("habits").select("*").eq("user_id", user.id),
      supabase.from("habit_logs").select("*").eq("user_id", user.id),
      supabase.from("journal_entries").select("*").eq("user_id", user.id),
      supabase.from("targets").select("*").eq("user_id", user.id),
      supabase.from("goal_templates").select("*").eq("user_id", user.id),
      supabase.from("opportunities").select("*").eq("user_id", user.id),
    ]);

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    goals: stripUserId(goals.data),
    habits: stripUserId(habits.data),
    habitLogs: stripUserId(habitLogs.data),
    journalEntries: stripUserId(journalEntries.data),
    targets: stripUserId(targets.data),
    goalTemplates: stripUserId(goalTemplates.data),
    opportunities: stripUserId(opportunities.data),
  };
}
