"use client";

import { useState } from "react";
import { formatAmountInput, formatINRSmart, parseAmountInput } from "@/lib/format";
import { Card, cn, inputClass } from "./ui";

/**
 * The money in the bank before any transaction below is applied. Stored as the
 * ledger's opening balance and used to seed every running balance.
 */
export function BankBalance({
  value,
  currentBalance,
  onChange,
  unset,
}: {
  value: number;
  currentBalance: number;
  onChange: (next: number) => void;
  unset: boolean;
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

  const movement = currentBalance - value;

  return (
    <Card className={cn("p-5", unset && "border-slate-300 bg-slate-50")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Bank Balance
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            What you have right now. Credits and debits below build on this.
          </p>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={startEditing}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition",
              unset
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "border border-slate-200 text-slate-700 hover:bg-slate-50",
            )}
          >
            {unset ? "Set bank balance" : "Edit"}
          </button>
        ) : null}
      </div>

      {editing ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[11rem] flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-slate-400">
              ₹
            </span>
            <input
              aria-label="Bank balance"
              autoFocus
              inputMode="decimal"
              placeholder="Enter your current balance"
              value={draft}
              onChange={(event) => setDraft(formatAmountInput(event.target.value))}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  save();
                }
                if (event.key === "Escape") setEditing(false);
              }}
              className={`${inputClass} py-3 pl-8 text-lg font-semibold tabular-nums`}
            />
          </div>
          <button
            type="button"
            onClick={save}
            className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-900">
            {formatINRSmart(value)}
          </p>
          {movement !== 0 ? (
            <p className="mt-1 text-xs text-slate-500">
              {movement > 0 ? "Up " : "Down "}
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  movement > 0 ? "text-emerald-600" : "text-rose-600",
                )}
              >
                {formatINRSmart(Math.abs(movement))}
              </span>{" "}
              since then · now {formatINRSmart(currentBalance)}
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">
              {unset
                ? "Set this first so your balances are accurate."
                : "No transactions applied yet."}
            </p>
          )}
        </>
      )}
    </Card>
  );
}
