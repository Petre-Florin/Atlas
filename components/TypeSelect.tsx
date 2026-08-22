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
        className="field field-select flex-1 text-sm"
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
          className="field flex-1 text-sm"
        />
      ) : (
        <input type="hidden" name="type" value={selected} />
      )}
    </div>
  );
}
