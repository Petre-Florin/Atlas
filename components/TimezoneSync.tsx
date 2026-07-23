"use client";

import { useEffect } from "react";

export function TimezoneSync() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const existing = document.cookie
      .split("; ")
      .find((c) => c.startsWith("atlas-tz="))
      ?.split("=")[1];

    if (existing !== tz) {
      document.cookie = `atlas-tz=${tz}; path=/; max-age=31536000; SameSite=Lax`;
      // Reload so server components pick up the correct local date immediately.
      // Only happens on first visit or if you travel to a new timezone.
      window.location.reload();
    }
  }, []);

  return null;
}
