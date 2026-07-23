"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "primary";
}) {
  const { pending } = useFormStatus();

  const base = "rounded-md px-3 py-1.5 text-sm transition-colors disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-thread font-medium text-ink hover:opacity-90"
      : "border border-hairline text-paper-muted hover:border-thread hover:text-paper";

  return (
    <button type="submit" disabled={pending} className={`${base} ${styles}`}>
      {pending ? "…" : children}
    </button>
  );
}
