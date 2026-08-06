import { TopBar } from "@/components/TopBar";
import { ImportDataForm } from "@/components/ImportDataForm";

export default function DataPage() {
  return (
    <>
      <TopBar title="Data" />
      <main className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-xl space-y-5">
          <div className="animate-fade-in-up rounded-2xl border border-hairline bg-surface p-6">
            <h2 className="mb-2 font-display text-xl text-paper">Export</h2>
            <p className="mb-4 text-sm text-paper-muted">
              Downloads everything you&apos;ve tracked — goals, habits and their check-ins,
              targets, journal entries, opportunities, and quick-add templates — as a single
              JSON file. CV files aren&apos;t included; download those separately from
              Opportunities if you want a copy.
            </p>
            <a
              href="/api/export"
              className="inline-block rounded-md bg-thread px-3 py-1.5 text-sm font-medium text-ink transition hover:opacity-90"
            >
              Download my data
            </a>
          </div>

          <div
            className="animate-fade-in-up rounded-2xl border border-hairline bg-surface p-6"
            style={{ animationDelay: "80ms" }}
          >
            <h2 className="mb-2 font-display text-xl text-paper">Import</h2>
            <p className="mb-4 text-sm text-paper-muted">
              Restores from a file exported above. Safe to re-run — it never deletes anything,
              only adds new rows or overwrites rows with a matching ID.
            </p>
            <ImportDataForm />
          </div>
        </div>
      </main>
    </>
  );
}
