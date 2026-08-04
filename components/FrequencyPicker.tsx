"use client";

import { useState } from "react";

const WEEKDAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

const TYPE_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly_days", label: "Specific days" },
  { value: "weekly_count", label: "X times/week" },
];

export function FrequencyPicker({
  defaultType = "daily",
  defaultDays = [],
  defaultCount = 3,
}: {
  defaultType?: string;
  defaultDays?: number[];
  defaultCount?: number;
}) {
  const [type, setType] = useState(defaultType);
  const [days, setDays] = useState<number[]>(defaultDays);

  function toggleDay(d: number) {
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setType(opt.value)}
            className={`rounded-md border px-2 py-1 text-xs transition-colors ${
              type === opt.value
                ? "border-thread bg-thread-soft text-paper"
                : "border-hairline text-paper-muted hover:border-thread hover:text-paper"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <input type="hidden" name="frequencyType" value={type} />

      {type === "weekly_days" && (
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAYS.map((d) => (
            <label key={d.value} className="cursor-pointer">
              <input
                type="checkbox"
                name="frequencyDays"
                value={d.value}
                checked={days.includes(d.value)}
                onChange={() => toggleDay(d.value)}
                className="peer sr-only"
              />
              <span
                className={`flex h-7 w-9 items-center justify-center rounded-md border text-xs transition-colors ${
                  days.includes(d.value)
                    ? "border-thread bg-thread text-ink"
                    : "border-hairline text-paper-muted hover:border-thread"
                }`}
              >
                {d.label}
              </span>
            </label>
          ))}
        </div>
      )}

      {type === "weekly_count" && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-paper-muted">Times per week:</span>
          <input
            type="number"
            name="frequencyCount"
            defaultValue={defaultCount}
            min={1}
            max={7}
            className="w-16 rounded-md border border-hairline bg-ink px-2 py-1 text-sm text-paper outline-none focus:border-thread"
          />
        </div>
      )}
    </div>
  );
}
