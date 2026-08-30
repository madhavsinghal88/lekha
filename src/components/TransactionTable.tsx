"use client";

import { formatDate, formatINRSmart } from "@/lib/format";
import { LedgerRow } from "@/lib/ledger";
import { cn } from "./ui";

export function TransactionTable({
  rows,
  onEdit,
  onDelete,
}: {
  rows: LedgerRow[];
  onEdit: (row: LedgerRow) => void;
  onDelete: (row: LedgerRow) => void;
}) {
  return (
    <div className="hidden md:block">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-5 py-3">Date</th>
            <th className="px-5 py-3">Remark</th>
            <th className="px-5 py-3">Category</th>
            <th className="px-5 py-3 text-right">Credit</th>
            <th className="px-5 py-3 text-right">Debit</th>
            <th className="px-5 py-3 text-right">Balance</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
            >
              <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                {formatDate(row.date)}
              </td>
              <td className="max-w-[18rem] px-5 py-3 font-medium text-slate-900">
                <span className="block truncate" title={row.remark}>
                  {row.remark}
                </span>
              </td>
              <td className="px-5 py-3">
                {row.category ? (
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {row.category}
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-right font-medium tabular-nums text-emerald-600">
                {row.type === "credit" ? formatINRSmart(row.amount) : "—"}
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-right font-medium tabular-nums text-rose-600">
                {row.type === "debit" ? formatINRSmart(row.amount) : "—"}
              </td>
              <td
                className={cn(
                  "whitespace-nowrap px-5 py-3 text-right font-semibold tabular-nums",
                  row.balance < 0 ? "text-rose-600" : "text-slate-900",
                )}
              >
                {formatINRSmart(row.balance)}
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-right">
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(row)}
                    className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(row)}
                    className="rounded-md px-2 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
