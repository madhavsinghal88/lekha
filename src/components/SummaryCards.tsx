"use client";

import { formatINRSmart } from "@/lib/format";
import { Totals } from "@/lib/ledger";
import { Card, cn } from "./ui";

export function SummaryCards({
  totals,
  openingBalance,
}: {
  totals: Totals;
  openingBalance: number;
}) {
  const negative = totals.currentBalance < 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Total Credited
        </p>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-600">
          {formatINRSmart(totals.totalCredit)}
        </p>
        <p className="mt-1 text-xs text-slate-500">Money in</p>
      </Card>

      <Card className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Total Debited
        </p>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-rose-600">
          {formatINRSmart(totals.totalDebit)}
        </p>
        <p className="mt-1 text-xs text-slate-500">Money out</p>
      </Card>

      <Card
        className={cn(
          "p-5 sm:col-span-2 xl:col-span-1",
          "border-slate-900 bg-slate-900 text-white shadow-md",
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
          Net Balance
        </p>
        <p
          className={cn(
            "mt-2 text-3xl font-semibold tabular-nums",
            negative ? "text-rose-300" : "text-white",
          )}
        >
          {formatINRSmart(totals.currentBalance)}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Opening {formatINRSmart(openingBalance)} · Net movement{" "}
          {totals.netMovement >= 0 ? "+" : "−"}
          {formatINRSmart(Math.abs(totals.netMovement))}
        </p>
      </Card>

      <Card className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Transactions
        </p>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
          {totals.count}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {totals.count === 1 ? "entry recorded" : "entries recorded"}
        </p>
      </Card>
    </div>
  );
}
