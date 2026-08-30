"use client";

import { formatINRSmart } from "@/lib/format";
import { Insights } from "@/lib/ledger";
import { Card } from "./ui";

export function InsightsPanel({
  insights,
  topCategory,
}: {
  insights: Insights;
  topCategory: { category: string; amount: number } | null;
}) {
  return (
    <Card className="p-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            This Month
          </p>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Money In</dt>
              <dd className="font-medium tabular-nums text-emerald-600">
                {formatINRSmart(insights.monthCredit)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Money Out</dt>
              <dd className="font-medium tabular-nums text-rose-600">
                {formatINRSmart(insights.monthDebit)}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-slate-100 pt-1">
              <dt className="text-slate-500">Net</dt>
              <dd className="font-semibold tabular-nums text-slate-900">
                {formatINRSmart(insights.monthNet)}
              </dd>
            </div>
          </dl>
        </div>

        <InsightItem
          label="Biggest Credit"
          remark={insights.biggestCredit?.remark || "—"}
          amount={insights.biggestCredit?.amount ?? null}
          tone="credit"
        />
        <InsightItem
          label="Biggest Debit"
          remark={insights.biggestDebit?.remark || "—"}
          amount={insights.biggestDebit?.amount ?? null}
          tone="debit"
        />
        <InsightItem
          label="Top Spend Category"
          remark={topCategory?.category || "—"}
          amount={topCategory?.amount ?? null}
          tone="debit"
        />
      </div>
    </Card>
  );
}

function InsightItem({
  label,
  remark,
  amount,
  tone,
}: {
  label: string;
  remark: string;
  amount: number | null;
  tone: "credit" | "debit";
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 truncate text-sm font-medium text-slate-900" title={remark}>
        {remark}
      </p>
      <p
        className={
          tone === "credit"
            ? "text-lg font-semibold tabular-nums text-emerald-600"
            : "text-lg font-semibold tabular-nums text-rose-600"
        }
      >
        {amount === null ? "—" : formatINRSmart(amount)}
      </p>
    </div>
  );
}
