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

export async function addGoalTemplate(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  if (!title) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("goal_templates")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;

  const { error } = await supabase
    .from("goal_templates")
    .insert({ user_id: user.id, title, sort_order: nextOrder });
  logIfError("addGoalTemplate", error);

  revalidatePath("/goals");
}

export async function deleteGoalTemplate(formData: FormData) {
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const { error } = await supabase.from("goal_templates").delete().eq("id", id);
  logIfError("deleteGoalTemplate", error);

  revalidatePath("/goals");
}

export async function addGoalFromTemplate(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  if (!title) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const todayDate = await today();

  const { data: existingToday } = await supabase
    .from("goals")
    .select("title")
    .eq("user_id", user.id)
    .eq("for_date", todayDate);

  const alreadyThere = (existingToday ?? []).some(
    (g) => g.title.trim().toLowerCase() === title.toLowerCase()
  );
  if (alreadyThere) return;

  const { error } = await supabase.from("goals").insert({
    user_id: user.id,
    title,
    for_date: todayDate,
  });
  logIfError("addGoalFromTemplate", error);

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

// ---------- Targets ----------

export async function addTarget(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const unit = String(formData.get("unit") || "").trim();
  const targetCount = Math.max(0, Number(formData.get("targetCount")) || 0);
  if (!title) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("targets")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;

  const { error } = await supabase.from("targets").insert({
    user_id: user.id,
    title,
    unit,
    target_count: targetCount,
    sort_order: nextOrder,
  });
  logIfError("addTarget", error);

  revalidatePath("/");
  revalidatePath("/targets");
}

export async function incrementTarget(formData: FormData) {
  const id = String(formData.get("id"));
  const delta = Number(formData.get("delta")) || 0;

  const supabase = await createClient();
  const { error } = await supabase.rpc("increment_target", {
    target_id: id,
    delta,
  });
  logIfError("incrementTarget", error);

  revalidatePath("/");
  revalidatePath("/targets");
}

export async function editTarget(formData: FormData) {
  const id = String(formData.get("id"));
  const title = String(formData.get("title") || "").trim();
  const unit = String(formData.get("unit") || "").trim();
  const targetCount = Math.max(0, Number(formData.get("targetCount")) || 0);
  const currentCount = Math.max(0, Number(formData.get("currentCount")) || 0);
  if (!title) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("targets")
    .update({
      title,
      unit,
      target_count: targetCount,
      current_count: currentCount,
    })
    .eq("id", id);
  logIfError("editTarget", error);

  revalidatePath("/");
  revalidatePath("/targets");
}

export async function archiveTarget(formData: FormData) {
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const { error } = await supabase.from("targets").update({ archived: true }).eq("id", id);
  logIfError("archiveTarget", error);

  revalidatePath("/");
  revalidatePath("/targets");
}

export async function restoreTarget(formData: FormData) {
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const { error } = await supabase.from("targets").update({ archived: false }).eq("id", id);
  logIfError("restoreTarget", error);

  revalidatePath("/");
  revalidatePath("/targets");
}

export async function moveTarget(formData: FormData) {
  const id = String(formData.get("id"));
  const direction = String(formData.get("direction")); // "up" | "down"

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: targets, error: listError } = await supabase
    .from("targets")
    .select("id, sort_order")
    .eq("user_id", user.id)
    .eq("archived", false)
    .order("sort_order", { ascending: true });
  logIfError("moveTarget (list)", listError);
  if (!targets) return;

  const index = targets.findIndex((t) => t.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= targets.length) return;

  const current = targets[index];
  const swap = targets[swapIndex];

  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from("targets").update({ sort_order: swap.sort_order }).eq("id", current.id),
    supabase.from("targets").update({ sort_order: current.sort_order }).eq("id", swap.id),
  ]);
  logIfError("moveTarget (swap 1)", e1);
  logIfError("moveTarget (swap 2)", e2);

  revalidatePath("/");
  revalidatePath("/targets");
}

export async function reorderDashboardWidgets(orderedKeys: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const results = await Promise.all(
    orderedKeys.map((key, index) =>
      supabase
        .from("strands")
        .update({ sort_order: index })
        .eq("user_id", user.id)
        .eq("key", key)
    )
  );
  results.forEach((r, i) => logIfError(`reorderDashboardWidgets (${orderedKeys[i]})`, r.error));

  revalidatePath("/");
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
  const productivityRaw = formData.get("productivity");
  const productivity =
    productivityRaw !== null && String(productivityRaw).trim() !== ""
      ? Number(productivityRaw)
      : null;

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
      productivity,
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
