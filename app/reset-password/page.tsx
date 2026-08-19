import { updatePassword } from "./actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 h-px w-10 bg-thread" aria-hidden />
          <h1 className="font-display text-3xl italic text-paper">Atlas</h1>
          <p className="mt-2 text-sm text-paper-muted">Set a new password.</p>
        </div>

        <form
          action={updatePassword}
          className="space-y-4 rounded-lg border border-hairline bg-surface p-6"
        >
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs text-paper-muted">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-md border border-hairline bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-thread"
            />
          </div>

          {params.error && <p className="text-sm text-rust">{params.error}</p>}

          <button
            type="submit"
            className="w-full rounded-md bg-thread px-3 py-2 text-sm font-medium text-ink transition hover:opacity-90"
          >
            Update password
          </button>
        </form>
      </div>
    </main>
  );
}
