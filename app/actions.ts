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

function parseFrequency(formData: FormData) {
  let frequencyType = String(formData.get("frequencyType") || "daily");
  const frequencyDays = formData
    .getAll("frequencyDays")
    .map((d) => Number(d))
    .filter((n) => !Number.isNaN(n));
  const frequencyCountRaw = formData.get("frequencyCount");
  let frequencyCount = frequencyCountRaw ? Math.max(1, Number(frequencyCountRaw)) : null;

  // Safety net: a "specific days" habit with no days selected, or a
  // "times per week" habit with no valid count, can never be satisfied —
  // fall back to daily rather than let a permanently-stuck habit get saved.
  if (frequencyType === "weekly_days" && frequencyDays.length === 0) {
    frequencyType = "daily";
  }
  if (frequencyType === "weekly_count" && (!frequencyCount || frequencyCount < 1)) {
    frequencyType = "daily";
    frequencyCount = null;
  }

  return { frequencyType, frequencyDays, frequencyCount };
}

export async function addHabit(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const { frequencyType, frequencyDays, frequencyCount } = parseFrequency(formData);

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

  const { error } = await supabase.from("habits").insert({
    user_id: user.id,
    name,
    sort_order: nextOrder,
    frequency_type: frequencyType,
    frequency_days: frequencyDays,
    frequency_count: frequencyCount,
  });
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

export async function editHabit(formData: FormData) {
  const id = String(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const { frequencyType, frequencyDays, frequencyCount } = parseFrequency(formData);

  const supabase = await createClient();
  const { error } = await supabase
    .from("habits")
    .update({
      name,
      frequency_type: frequencyType,
      frequency_days: frequencyDays,
      frequency_count: frequencyCount,
    })
    .eq("id", id);
  logIfError("editHabit", error);

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

// ---------- Opportunities ----------

export async function addOpportunity(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "").trim();
  if (!name) return;

  const status = String(formData.get("status") || "watching").trim();
  const nextAction = String(formData.get("nextAction") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const link = String(formData.get("link") || "").trim();
  const contact = String(formData.get("contact") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const deadlineRaw = String(formData.get("deadline") || "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("opportunities").insert({
    user_id: user.id,
    name,
    type,
    status,
    next_action: nextAction,
    notes,
    link,
    contact,
    location,
    deadline: deadlineRaw || null,
  });
  logIfError("addOpportunity", error);

  revalidatePath("/opportunities");
}

export async function updateOpportunityStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));

  const supabase = await createClient();
  const { error } = await supabase
    .from("opportunities")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  logIfError("updateOpportunityStatus", error);

  revalidatePath("/opportunities");
}

export async function editOpportunity(formData: FormData) {
  const id = String(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "").trim();
  const nextAction = String(formData.get("nextAction") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const link = String(formData.get("link") || "").trim();
  const contact = String(formData.get("contact") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const deadlineRaw = String(formData.get("deadline") || "").trim();
  if (!name) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("opportunities")
    .update({
      name,
      type,
      next_action: nextAction,
      notes,
      link,
      contact,
      location,
      deadline: deadlineRaw || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  logIfError("editOpportunity", error);

  revalidatePath("/opportunities");
}

export async function deleteOpportunity(formData: FormData) {
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Clean up any attached files first — opportunity_files rows cascade-
  // delete automatically via the FK, but the actual Storage objects don't,
  // so they'd otherwise be left behind as orphans with nothing pointing
  // to them.
  const { data: files, error: filesError } = await supabase
    .from("opportunity_files")
    .select("storage_path")
    .eq("opportunity_id", id);
  logIfError("deleteOpportunity (list files)", filesError);

  if (files && files.length > 0) {
    const { error: removeError } = await supabase.storage
      .from("documents")
      .remove(files.map((f) => f.storage_path));
    logIfError("deleteOpportunity (remove files)", removeError);
  }

  const { error } = await supabase.from("opportunities").delete().eq("id", id);
  logIfError("deleteOpportunity", error);

  revalidatePath("/opportunities");
}

// ---------- CV storage ----------

export async function uploadCV(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Clear out any existing CV file(s) first, since a replacement might
  // have a different extension than what's currently stored.
  const { data: existing } = await supabase.storage.from("documents").list(user.id);
  const toRemove = (existing ?? [])
    .filter((f) => f.name.startsWith("cv."))
    .map((f) => `${user.id}/${f.name}`);
  if (toRemove.length > 0) {
    const { error: removeError } = await supabase.storage.from("documents").remove(toRemove);
    logIfError("uploadCV (remove old)", removeError);
  }

  const ext = file.name.split(".").pop() || "pdf";
  const path = `${user.id}/cv.${ext}`;

  const { error } = await supabase.storage
    .from("documents")
    .upload(path, file, { upsert: true });
  logIfError("uploadCV", error);

  revalidatePath("/opportunities");
}

// Generalized file attachments (CV, cover letter, certificate, etc.) —
// replaces the old single-hardcoded-CV-slot pattern. Multiple files per
// opportunity, each tracked as its own row in opportunity_files rather
// than encoded into a filename.
export async function uploadOpportunityFile(formData: FormData) {
  const opportunityId = String(formData.get("id"));
  const label = String(formData.get("label") || "").trim() || "File";
  const file = formData.get("file") as File | null;
  if (!opportunityId || !file || file.size === 0) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const ext = file.name.split(".").pop() || "pdf";
  const fileId = crypto.randomUUID();
  const path = `${user.id}/opportunities/${opportunityId}/${fileId}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("documents").upload(path, file);
  logIfError("uploadOpportunityFile (storage)", uploadError);
  if (uploadError) return;

  const { error } = await supabase.from("opportunity_files").insert({
    id: fileId,
    opportunity_id: opportunityId,
    user_id: user.id,
    label,
    file_name: file.name,
    storage_path: path,
  });
  logIfError("uploadOpportunityFile (db)", error);

  revalidatePath("/opportunities");
}

export async function deleteOpportunityFile(formData: FormData) {
  const fileId = String(formData.get("fileId"));
  if (!fileId) return;

  const supabase = await createClient();

  const { data: row, error: fetchError } = await supabase
    .from("opportunity_files")
    .select("storage_path")
    .eq("id", fileId)
    .maybeSingle();
  logIfError("deleteOpportunityFile (fetch)", fetchError);
  if (!row) return;

  const { error: removeError } = await supabase.storage
    .from("documents")
    .remove([row.storage_path]);
  logIfError("deleteOpportunityFile (storage)", removeError);

  const { error } = await supabase.from("opportunity_files").delete().eq("id", fileId);
  logIfError("deleteOpportunityFile (db)", error);

  revalidatePath("/opportunities");
}

// ---------- Data import ----------

export type ImportState = {
  status: "idle" | "success" | "error";
  message: string;
  counts?: Record<string, number>;
};

type ImportTableSpec = {
  key: string; // key in the uploaded JSON
  table: string; // actual Supabase table name
};

// Order matters: habits must be upserted before habit_logs, since
// habit_logs.habit_id references habits.id.
const IMPORT_TABLES: ImportTableSpec[] = [
  { key: "goals", table: "goals" },
  { key: "habits", table: "habits" },
  { key: "targets", table: "targets" },
  { key: "goalTemplates", table: "goal_templates" },
  { key: "journalEntries", table: "journal_entries" },
  { key: "opportunities", table: "opportunities" },
  { key: "habitLogs", table: "habit_logs" },
];

export async function importData(
  _prevState: ImportState,
  formData: FormData
): Promise<ImportState> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { status: "error", message: "No file selected." };
  }

  let parsed: unknown;
  try {
    const text = await file.text();
    parsed = JSON.parse(text);
  } catch {
    return { status: "error", message: "That file isn't valid JSON." };
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("version" in parsed) ||
    (parsed as { version: unknown }).version !== 1
  ) {
    return {
      status: "error",
      message: "This doesn't look like an Atlas export (missing or unrecognized version).",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "Not signed in." };
  }

  const source = parsed as Record<string, unknown>;
  const counts: Record<string, number> = {};

  for (const { key, table } of IMPORT_TABLES) {
    const rows = source[key];
    if (!Array.isArray(rows)) {
      counts[key] = 0;
      continue;
    }

    const validRows = rows
      .filter((r): r is Record<string, unknown> => typeof r === "object" && r !== null && "id" in r)
      .map((r) => ({ ...r, user_id: user.id }));

    if (validRows.length === 0) {
      counts[key] = 0;
      continue;
    }

    const { error } = await supabase.from(table).upsert(validRows, { onConflict: "id" });
    if (error) {
      logIfError(`importData (${table})`, error);
      return {
        status: "error",
        message: `Failed while importing ${key}: ${error.message}. Nothing after this point was imported — earlier tables in the list may have already been written.`,
        counts,
      };
    }
    counts[key] = validRows.length;
  }

  revalidatePath("/");
  revalidatePath("/goals");
  revalidatePath("/habits");
  revalidatePath("/targets");
  revalidatePath("/journal");
  revalidatePath("/opportunities");

  return { status: "success", message: "Import complete.", counts };
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
