"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTodayForUser, getTomorrowForUser } from "@/lib/timezone";

async function today() {
  return getTodayForUser();
}

async function tomorrow() {
  return getTomorrowForUser();
}

function logIfError(action: string, error: { message: string } | null) {
  if (error) {
    console.error(`${action} failed:`, error.message);
  }
}

// ---------- Goals ----------

export async function addGoal(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  const forDay = String(formData.get("for") || "today"); // "today" | "tomorrow"

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("goals").insert({
    user_id: user.id,
    title,
    for_date: forDay === "tomorrow" ? await tomorrow() : await today(),
  });
  logIfError("addGoal", error);

  revalidatePath("/");
  revalidatePath("/goals");
}

export async function toggleGoal(formData: FormData) {
  const id = String(formData.get("id"));
  const done = formData.get("done") === "true";
  const nowDone = !done;

  const supabase = await createClient();
  const { error } = await supabase
    .from("goals")
    .update({ done: nowDone, completed_at: nowDone ? new Date().toISOString() : null })
    .eq("id", id);
  logIfError("toggleGoal", error);

  revalidatePath("/");
  revalidatePath("/goals");
}

export async function renameGoal(formData: FormData) {
  const id = String(formData.get("id"));
  const title = String(formData.get("title") || "").trim();
  if (!title) return;

  const supabase = await createClient();
  const { error } = await supabase.from("goals").update({ title }).eq("id", id);
  logIfError("renameGoal", error);

  revalidatePath("/");
  revalidatePath("/goals");
}

export async function deleteGoal(formData: FormData) {
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const { error } = await supabase.from("goals").delete().eq("id", id);
  logIfError("deleteGoal", error);

  revalidatePath("/");
  revalidatePath("/goals");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- required signature for use as a form action
export async function copyGoalsToTomorrow(_formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const [todayDate, tomorrowDate] = await Promise.all([today(), tomorrow()]);

  const [todayRes, tomorrowRes] = await Promise.all([
    supabase
      .from("goals")
      .select("title")
      .eq("user_id", user.id)
      .eq("for_date", todayDate),
    supabase
      .from("goals")
      .select("title")
      .eq("user_id", user.id)
      .eq("for_date", tomorrowDate),
  ]);
  logIfError("copyGoalsToTomorrow (today)", todayRes.error);
  logIfError("copyGoalsToTomorrow (tomorrow)", tomorrowRes.error);

  const existingTomorrowTitles = new Set(
    (tomorrowRes.data ?? []).map((g) => g.title.trim().toLowerCase())
  );

  const toInsert = (todayRes.data ?? [])
    .filter((g) => !existingTomorrowTitles.has(g.title.trim().toLowerCase()))
    .map((g) => ({ user_id: user.id, title: g.title, for_date: tomorrowDate }));

  if (toInsert.length > 0) {
    const { error } = await supabase.from("goals").insert(toInsert);
    logIfError("copyGoalsToTomorrow (insert)", error);
  }

  revalidatePath("/");
  revalidatePath("/goals");
}

// ---------- Habits ----------

export async function addHabit(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("habits")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;

  const { error } = await supabase
    .from("habits")
    .insert({ user_id: user.id, name, sort_order: nextOrder });
  logIfError("addHabit", error);

  revalidatePath("/");
  revalidatePath("/habits");
}

export async function toggleHabitToday(formData: FormData) {
  const habitId = String(formData.get("habitId"));
  const loggedToday = formData.get("loggedToday") === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  if (loggedToday) {
    const { error } = await supabase
      .from("habit_logs")
      .delete()
      .eq("habit_id", habitId)
      .eq("for_date", await today());
    logIfError("toggleHabitToday (delete)", error);
  } else {
    const { error } = await supabase.from("habit_logs").insert({
      habit_id: habitId,
      user_id: user.id,
      for_date: await today(),
    });
    logIfError("toggleHabitToday (insert)", error);
  }

  revalidatePath("/");
  revalidatePath("/habits");
}

export async function renameHabit(formData: FormData) {
  const id = String(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const supabase = await createClient();
  const { error } = await supabase.from("habits").update({ name }).eq("id", id);
  logIfError("renameHabit", error);

  revalidatePath("/");
  revalidatePath("/habits");
}

export async function archiveHabit(formData: FormData) {
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const { error } = await supabase.from("habits").update({ archived: true }).eq("id", id);
  logIfError("archiveHabit", error);

  revalidatePath("/");
  revalidatePath("/habits");
}

export async function restoreHabit(formData: FormData) {
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const { error } = await supabase.from("habits").update({ archived: false }).eq("id", id);
  logIfError("restoreHabit", error);

  revalidatePath("/");
  revalidatePath("/habits");
}

export async function moveHabit(formData: FormData) {
  const id = String(formData.get("id"));
  const direction = String(formData.get("direction")); // "up" | "down"

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: habits, error: listError } = await supabase
    .from("habits")
    .select("id, sort_order")
    .eq("user_id", user.id)
    .eq("archived", false)
    .order("sort_order", { ascending: true });
  logIfError("moveHabit (list)", listError);
  if (!habits) return;

  const index = habits.findIndex((h) => h.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= habits.length) return;

  const current = habits[index];
  const swap = habits[swapIndex];

  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from("habits").update({ sort_order: swap.sort_order }).eq("id", current.id),
    supabase.from("habits").update({ sort_order: current.sort_order }).eq("id", swap.id),
  ]);
  logIfError("moveHabit (swap 1)", e1);
  logIfError("moveHabit (swap 2)", e2);

  revalidatePath("/");
  revalidatePath("/habits");
}

// ---------- Journal ----------

export type JournalSaveState = { ok: boolean; savedAt: number };

export async function saveJournal(
  _prevState: JournalSaveState,
  formData: FormData
): Promise<JournalSaveState> {
  const wins = String(formData.get("wins") || "");
  const mistakes = String(formData.get("mistakes") || "");
  const tomorrow = String(formData.get("tomorrow") || "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, savedAt: Date.now() };

  const { error } = await supabase.from("journal_entries").upsert(
    {
      user_id: user.id,
      for_date: await today(),
      wins,
      mistakes,
      tomorrow,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,for_date" }
  );
  logIfError("saveJournal", error);

  revalidatePath("/");
  revalidatePath("/journal");

  return { ok: !error, savedAt: Date.now() };
}

// ---------- Auth ----------

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
