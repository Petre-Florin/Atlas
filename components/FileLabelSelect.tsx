"use client";

import { useState } from "react";

const LABEL_PRESETS = ["CV", "Cover Letter", "Certificate"];

export function FileLabelSelect() {
  const [selected, setSelected] = useState("CV");

  return (
    <div className="flex gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="rounded-md border border-hairline bg-ink px-2 py-1 text-xs text-paper outline-none focus:border-thread"
      >
        {LABEL_PRESETS.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
        <option value="Other">Other…</option>
      </select>
      {selected === "Other" ? (
        <input
          type="text"
          name="label"
          placeholder="Custom label"
          required
          className="flex-1 rounded-md border border-hairline bg-ink px-2 py-1 text-xs text-paper outline-none focus:border-thread"
        />
      ) : (
        <input type="hidden" name="label" value={selected} />
      )}
    </div>
  );
}
