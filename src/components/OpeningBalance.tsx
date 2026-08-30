"use client";

import { useState } from "react";
import { formatAmountInput, formatINRSmart, parseAmountInput } from "@/lib/format";
import { Card, inputClass } from "./ui";

export function OpeningBalance({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const startEditing = () => {
    setDraft(value ? formatAmountInput(String(value)) : "");
    setEditing(true);
  };

  const save = () => {
    const parsed = parseAmountInput(draft);
    onChange(Number.isFinite(parsed) ? parsed : 0);
    setEditing(false);
  };

  return (
    <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Opening Balance
        </p>
        {editing ? null : (
          <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
            {formatINRSmart(value)}
          </p>
        )}
      </div>

      {editing ? (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="relative min-w-[10rem] flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              ₹
            </span>
            <input
              aria-label="Opening balance"
              autoFocus
              inputMode="decimal"
              value={draft}
              onChange={(event) => setDraft(formatAmountInput(event.target.value))}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  save();
                }
                if (event.key === "Escape") setEditing(false);
              }}
              className={`${inputClass} pl-7 tabular-nums`}
            />
          </div>
          <button
            type="button"
            onClick={save}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startEditing}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Edit
        </button>
      )}
    </Card>
  );
}
