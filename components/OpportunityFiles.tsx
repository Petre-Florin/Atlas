"use client";

import { uploadOpportunityFile, deleteOpportunityFile } from "@/app/actions";
import { FileLabelSelect } from "./FileLabelSelect";
import { SubmitButton } from "./SubmitButton";
import type { OpportunityFile } from "@/lib/documents";

export function OpportunityFiles({
  opportunityId,
  files,
}: {
  opportunityId: string;
  files: OpportunityFile[];
}) {
  return (
    <div className="mt-2 space-y-1.5">
      {files.map((f) => (
        <div key={f.id} className="flex flex-wrap items-center gap-2">
          <span className="flex-none rounded-full border border-hairline px-1.5 py-0.5 text-[10px] text-paper-faint">
            {f.label}
          </span>
          <span className="min-w-0 truncate text-xs text-paper-muted">{f.fileName}</span>
          {f.url && (
            <a href={f.url} download className="text-xs text-thread hover:underline">
              Download
            </a>
          )}
          <form action={deleteOpportunityFile}>
            <input type="hidden" name="fileId" value={f.id} />
            <button
              type="submit"
              className="text-xs text-paper-faint transition-colors hover:text-rust"
            >
              Remove
            </button>
          </form>
        </div>
      ))}

      <form action={uploadOpportunityFile} className="flex flex-wrap items-center gap-2 pt-1">
        <input type="hidden" name="id" value={opportunityId} />
        <FileLabelSelect />
        <input
          type="file"
          name="file"
          accept=".pdf,.doc,.docx"
          required
          className="text-xs text-paper-faint file:mr-2 file:rounded file:border-0 file:bg-surface-raised file:px-2 file:py-0.5 file:text-xs file:text-paper"
        />
        <SubmitButton>Attach</SubmitButton>
      </form>
    </div>
  );
}
