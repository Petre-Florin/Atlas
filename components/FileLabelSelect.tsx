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
        className="field field-select field-sm text-xs"
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
          className="field field-sm flex-1 text-xs"
        />
      ) : (
        <input type="hidden" name="label" value={selected} />
      )}
    </div>
  );
}
