import { signOut } from "@/app/actions";
import { getUserTimezone } from "@/lib/timezone";

export async function TopBar({ title }: { title: string }) {
  const timeZone = await getUserTimezone();
  const dateLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  });

  return (
    <header className="flex items-center justify-between border-b border-hairline px-8 py-5">
      <div>
        <h2 className="font-display text-xl text-paper">{title}</h2>
        <p className="mt-0.5 text-xs text-paper-muted">{dateLabel}</p>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          className="text-xs text-paper-muted transition hover:text-paper"
        >
          Sign out
        </button>
      </form>
    </header>
  );
}
