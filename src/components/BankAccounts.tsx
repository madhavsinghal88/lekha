"use client";

import { useState } from "react";
import {
  formatAmountEntry,
  isExpression,
  resolveAmount,
  sanitizeAmountEntry,
} from "@/lib/amount";
import { formatAmountInput, formatINRSmart } from "@/lib/format";
import { BankAccount, MAX_ACCOUNTS } from "@/lib/types";
import { Card, cn, inputClass } from "./ui";

/**
 * Starting balances for up to five accounts. Their total seeds every running
 * balance in the ledger.
 */
export function BankAccounts({
  accounts,
  total,
  currentBalance,
  onAdd,
  onUpdate,
  onRemove,
}: {
  accounts: BankAccount[];
  total: number;
  currentBalance: number;
  onAdd: (name: string, balance: number) => void;
  onUpdate: (id: string, patch: Partial<Omit<BankAccount, "id">>) => void;
  onRemove: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const empty = accounts.length === 0;
  const movement = currentBalance - total;
  const full = accounts.length >= MAX_ACCOUNTS;

  return (
    <Card className={cn("p-5", empty && "border-slate-300 bg-slate-50")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Bank Balance
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            What you have right now. Credits and debits below build on this.
          </p>
        </div>
        {!empty ? (
          <div className="text-right">
            <p className="text-2xl font-semibold tabular-nums text-slate-900">
              {formatINRSmart(total)}
            </p>
            <p className="text-[11px] text-slate-400">
              {accounts.length} of {MAX_ACCOUNTS} accounts
            </p>
          </div>
        ) : null}
      </div>

      {!empty ? (
        <ul className="mt-4 space-y-2">
          {accounts.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              onUpdate={onUpdate}
              onRemove={onRemove}
            />
          ))}
        </ul>
      ) : null}

      {adding ? (
        <AccountEditor
          className="mt-3"
          onCancel={() => setAdding(false)}
          onSave={(name, balance) => {
            onAdd(name, balance);
            setAdding(false);
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          disabled={full}
          className={cn(
            "mt-3 w-full rounded-lg px-3 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
            empty
              ? "bg-slate-900 text-white hover:bg-slate-800"
              : "border border-dashed border-slate-300 text-slate-600 hover:bg-slate-50",
          )}
        >
          {empty
            ? "Set bank balance"
            : full
              ? `Maximum ${MAX_ACCOUNTS} accounts`
              : "+ Add another account"}
        </button>
      )}

      {!empty && movement !== 0 ? (
        <p className="mt-3 text-xs text-slate-500">
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
      ) : null}
    </Card>
  );
}

function AccountRow({
  account,
  onUpdate,
  onRemove,
}: {
  account: BankAccount;
  onUpdate: (id: string, patch: Partial<Omit<BankAccount, "id">>) => void;
  onRemove: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li>
        <AccountEditor
          initialName={account.name}
          initialBalance={account.balance}
          onCancel={() => setEditing(false)}
          onSave={(name, balance) => {
            onUpdate(account.id, { name, balance });
            setEditing(false);
          }}
          onRemove={() => {
            onRemove(account.id);
            setEditing(false);
          }}
        />
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <span className="min-w-0 truncate text-sm font-medium text-slate-700">
        {account.name || "Unnamed account"}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="text-sm font-semibold tabular-nums text-slate-900">
          {formatINRSmart(account.balance)}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-md px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          Edit
        </button>
      </span>
    </li>
  );
}

function AccountEditor({
  initialName = "",
  initialBalance,
  onSave,
  onCancel,
  onRemove,
  className,
}: {
  initialName?: string;
  initialBalance?: number;
  onSave: (name: string, balance: number) => void;
  onCancel: () => void;
  onRemove?: () => void;
  className?: string;
}) {
  const [name, setName] = useState(initialName);
  const [draft, setDraft] = useState(
    initialBalance ? formatAmountInput(String(initialBalance)) : "",
  );

  const pendingSum = isExpression(sanitizeAmountEntry(draft));
  const result = pendingSum ? resolveAmount(draft) : null;

  const commit = () => {
    if (pendingSum) {
      if (result === null) return;
      setDraft(formatAmountInput(String(result)));
      return;
    }
    onSave(name.trim() || "Bank", resolveAmount(draft) ?? 0);
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 bg-white p-3",
        className,
      )}
    >
      <div className="flex flex-wrap gap-2">
        <input
          aria-label="Account name"
          autoFocus
          placeholder="Bank name (e.g. HDFC)"
          value={name}
          autoComplete="off"
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            }
            if (event.key === "Escape") onCancel();
          }}
          className={`${inputClass} min-w-[9rem] flex-1`}
        />
        <div className="relative min-w-[9rem] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            ₹
          </span>
          <input
            aria-label="Account balance"
            inputMode="decimal"
            placeholder="49000 or 49000-35000"
            value={draft}
            onChange={(event) => setDraft(formatAmountEntry(event.target.value))}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commit();
              }
              if (event.key === "Escape") onCancel();
            }}
            className={`${inputClass} pl-7 font-medium tabular-nums`}
          />
        </div>
      </div>

      {pendingSum ? (
        <p
          aria-live="polite"
          className={cn(
            "mt-1.5 text-xs font-medium tabular-nums",
            result === null ? "text-rose-600" : "text-slate-600",
          )}
        >
          {result === null
            ? "Can't calculate that"
            : `= ${formatINRSmart(result)} · press Enter`}
        </p>
      ) : null}

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={commit}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {pendingSum ? "=" : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
          >
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}
