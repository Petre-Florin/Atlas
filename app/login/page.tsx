import { signIn, signUp } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 h-px w-10 bg-thread" aria-hidden />
          <h1 className="font-display text-3xl italic text-paper">Atlas</h1>
          <p className="mt-2 text-sm text-paper-muted">
            A modular operating system for your own life.
          </p>
        </div>

        <form className="space-y-4 rounded-lg border border-hairline bg-surface p-6">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs text-paper-muted">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-md border border-hairline bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-thread"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs text-paper-muted">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              className="w-full rounded-md border border-hairline bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-thread"
            />
          </div>

          {params.error && (
            <p className="text-sm text-rust">{params.error}</p>
          )}
          {params.message && (
            <p className="text-sm text-grove">{params.message}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              formAction={signIn}
              className="flex-1 rounded-md bg-thread px-3 py-2 text-sm font-medium text-ink transition hover:opacity-90"
            >
              Sign in
            </button>
            <button
              formAction={signUp}
              className="flex-1 rounded-md border border-hairline px-3 py-2 text-sm text-paper-muted transition hover:border-thread hover:text-paper"
            >
              Create account
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
