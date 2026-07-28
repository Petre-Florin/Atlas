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
