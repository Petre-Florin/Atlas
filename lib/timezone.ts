import { cookies } from "next/headers";

const TZ_COOKIE = "atlas-tz";

export async function getUserTimezone(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get(TZ_COOKIE)?.value || "UTC";
}

export async function getTodayForUser(): Promise<string> {
  const tz = await getUserTimezone();
  try {
    // en-CA locale formats as YYYY-MM-DD, matching Postgres date format
    return new Date().toLocaleDateString("en-CA", { timeZone: tz });
  } catch {
    // Invalid/unrecognized timezone string — fall back rather than crash
    return new Date().toISOString().slice(0, 10);
  }
}

export async function getTomorrowForUser(): Promise<string> {
  const todayStr = await getTodayForUser();
  const [y, m, d] = todayStr.split("-").map(Number);
  // Constructed in UTC purely to do safe date-part arithmetic (add one day) —
  // we never touch time-of-day or re-apply a timezone offset here, so this
  // can't drift a day off in either direction.
  const tomorrow = new Date(Date.UTC(y, m - 1, d + 1));
  return tomorrow.toISOString().slice(0, 10);
}
