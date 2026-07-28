import { uploadCV } from "@/app/actions";
import { SubmitButton } from "./SubmitButton";
import type { CVInfo } from "@/lib/documents";

export function CVCard({ cv }: { cv: CVInfo | null }) {
  return (
    <div className="animate-fade-in-up rounded-2xl border border-hairline bg-surface p-6">
      <h2 className="mb-4 font-display text-xl text-paper">CV</h2>

      {cv ? (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-hairline p-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-paper">{cv.name}</p>
            <p className="text-xs text-paper-muted">
              Updated{" "}
              {new Date(cv.updatedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          {cv.url ? (
            <a
              href={cv.url}
              download
              className="flex-none rounded-md bg-thread px-3 py-1.5 text-sm font-medium text-ink transition hover:opacity-90"
            >
              Download
            </a>
          ) : (
            <span className="flex-none text-xs text-rust">Link expired — reload page</span>
          )}
        </div>
      ) : (
        <p className="mb-4 text-sm text-paper-muted">No CV uploaded yet.</p>
      )}

      <form action={uploadCV} className="flex gap-2">
        <input
          type="file"
          name="file"
          accept=".pdf,.doc,.docx"
          required
          className="flex-1 rounded-md border border-hairline bg-ink px-3 py-1.5 text-xs text-paper-muted file:mr-2 file:rounded file:border-0 file:bg-surface-raised file:px-2 file:py-1 file:text-xs file:text-paper"
        />
        <SubmitButton>{cv ? "Replace" : "Upload"}</SubmitButton>
      </form>
    </div>
  );
}
