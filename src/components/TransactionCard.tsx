"use client";

import { formatDate, formatINRSmart } from "@/lib/format";
import { LedgerRow } from "@/lib/ledger";
import { cn } from "./ui";

export function TransactionCardList({
  rows,
  onEdit,
  onDelete,
}: {
  rows: LedgerRow[];
  onEdit: (row: LedgerRow) => void;
  onDelete: (row: LedgerRow) => void;
}) {
  return (
    <ul className="divide-y divide-slate-100 md:hidden">
      {rows.map((row) => (
        <li key={row.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900">{row.remark}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatDate(row.date)}
                {row.category ? ` · ${row.category}` : ""}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p
                className={cn(
                  "font-semibold tabular-nums",
                  row.type === "credit" ? "text-emerald-600" : "text-rose-600",
                )}
              >
                {row.type === "credit" ? "+" : "−"}
                {formatINRSmart(row.amount)}
              </p>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {row.type === "credit" ? "Money In" : "Money Out"}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Balance:{" "}
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  row.balance < 0 ? "text-rose-600" : "text-slate-900",
                )}
              >
                {formatINRSmart(row.balance)}
              </span>
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onEdit(row)}
                className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(row)}
                className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                Delete
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
