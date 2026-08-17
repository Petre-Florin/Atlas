import { createClient } from "@/lib/supabase/server";

export type CVInfo = { name: string; updatedAt: string; url: string | null };

export async function getCurrentCV(): Promise<CVInfo | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: files, error } = await supabase.storage.from("documents").list(user.id);
  if (error) {
    console.error("getCurrentCV (list) failed:", error.message);
    return null;
  }

  const cvFile = (files ?? []).find((f) => f.name.startsWith("cv."));
  if (!cvFile) return null;

  const path = `${user.id}/${cvFile.name}`;
  const { data: signed, error: signError } = await supabase.storage
    .from("documents")
    .createSignedUrl(path, 300); // 5 minutes — regenerated fresh on every page load
  if (signError) {
    console.error("getCurrentCV (sign) failed:", signError.message);
  }

  return {
    name: cvFile.name,
    updatedAt: cvFile.updated_at ?? cvFile.created_at ?? new Date().toISOString(),
    url: signed?.signedUrl ?? null,
  };
}

export type OpportunityFile = {
  id: string;
  label: string;
  fileName: string;
  createdAt: string;
  url: string | null;
};

// Replaces the old getOpportunityCVs, which found files by scanning
// Storage and pattern-matching filenames like "{id}-cv.ext". Files are
// now tracked properly in the opportunity_files table, so this just
// reads that table and signs a fresh download URL per file.
export async function getOpportunityFilesGrouped(): Promise<Record<string, OpportunityFile[]>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data: rows, error } = await supabase
    .from("opportunity_files")
    .select("id, opportunity_id, label, file_name, storage_path, created_at")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("getOpportunityFilesGrouped (list) failed:", error.message);
    return {};
  }

  const result: Record<string, OpportunityFile[]> = {};

  await Promise.all(
    (rows ?? []).map(async (row) => {
      const { data: signed, error: signError } = await supabase.storage
        .from("documents")
        .createSignedUrl(row.storage_path, 300); // 5 minutes, regenerated on every page load
      if (signError) {
        console.error("getOpportunityFilesGrouped (sign) failed:", signError.message);
      }
      const entry: OpportunityFile = {
        id: row.id,
        label: row.label,
        fileName: row.file_name,
        createdAt: row.created_at,
        url: signed?.signedUrl ?? null,
      };
      (result[row.opportunity_id] ??= []).push(entry);
    })
  );

  return result;
}
