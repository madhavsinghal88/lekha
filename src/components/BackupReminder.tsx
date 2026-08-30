"use client";

import { useState } from "react";
import { formatDate } from "@/lib/format";

const REMIND_AFTER_DAYS = 30;

function daysSince(iso: string): number {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - then) / 86_400_000);
}

/**
 * Nothing in this app expires, but the data lives only in this browser profile,
 * so nudge for a JSON backup periodically.
 */
export function BackupReminder({
  transactionCount,
  lastBackupAt,
  onBackup,
}: {
  transactionCount: number;
  lastBackupAt: string | null;
  onBackup: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);

  const overdue =
    lastBackupAt === null || daysSince(lastBackupAt) >= REMIND_AFTER_DAYS;

  if (dismissed || transactionCount === 0 || !overdue) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-sm text-amber-900">
        <strong className="font-semibold">Back up your ledger.</strong>{" "}
        {lastBackupAt
          ? `Last backup was ${formatDate(lastBackupAt.slice(0, 10))}.`
          : "Your data is saved only in this browser, so clearing site data would lose it."}
      </p>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onBackup}
          className="rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-800"
        >
          Download backup
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
        >
          Later
        </button>
      </div>
    </div>
  );
}
