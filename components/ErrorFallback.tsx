"use client";

import { useEffect } from "react";
import Link from "next/link";

export function ErrorFallback({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Atlas error boundary:", error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="mb-2 font-data text-[11px] uppercase tracking-wider text-thread">
        Something went wrong
      </p>
      <h1 className="mb-3 font-display text-2xl text-paper">That didn&apos;t load right.</h1>
      <p className="mb-6 max-w-sm text-sm text-paper-muted">
        Nothing you entered was lost — this page just hit an error while rendering. Try again, or
        head back to the dashboard.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-thread px-4 py-2 text-sm font-medium text-ink transition hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border border-hairline px-4 py-2 text-sm text-paper-muted transition hover:border-thread hover:text-paper"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}
