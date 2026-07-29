"use client";

import { useState } from "react";

const TYPE_PRESETS = [
  "Job",
  "Work Experience",
  "Apprenticeship",
  "Internship",
  "Open Source",
  "Hackathon",
  "Conference",
  "Meetup",
  "Networking",
  "Scholarship",
  "Competition",
];

export function TypeSelect({ defaultValue = "" }: { defaultValue?: string }) {
  const isPreset = TYPE_PRESETS.includes(defaultValue);
  const [selected, setSelected] = useState(
    isPreset ? defaultValue : defaultValue ? "Other" : ""
  );

  return (
    <div className="flex gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="flex-1 rounded-md border border-hairline bg-ink px-3 py-1.5 text-sm text-paper outline-none focus:border-thread"
      >
        <option value="">Select type…</option>
        {TYPE_PRESETS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
        <option value="Other">Other…</option>
      </select>
      {selected === "Other" ? (
        <input
          type="text"
          name="type"
          defaultValue={isPreset ? "" : defaultValue}
          placeholder="Custom type"
          className="flex-1 rounded-md border border-hairline bg-ink px-3 py-1.5 text-sm text-paper outline-none focus:border-thread"
        />
      ) : (
        <input type="hidden" name="type" value={selected} />
      )}
    </div>
  );
}
