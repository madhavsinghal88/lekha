"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { resolveAmount } from "@/lib/amount";
import {
  DraftRow,
  clearDraft,
  emptyRow,
  getDraftServerSnapshot,
  getDraftSnapshot,
  hasContent,
  setDraft,
  subscribeDraft,
} from "@/lib/draft";
import { formatINRSmart, todayISO } from "@/lib/format";
import { TransactionType } from "@/lib/types";
import { NewTransaction } from "@/lib/useLedger";
import { AmountInput } from "./AmountInput";
import { Card, cn, inputClass, labelClass } from "./ui";

const noopSubscribe = () => () => {};

/**
 * "Today" must come from the visitor's browser: this page is prerendered, so a
 * build-time date would go stale.
 */
function useToday(): string {
  return useSyncExternalStore(noopSubscribe, todayISO, () => "");
}

export function BatchTransactionForm({
  onAddMany,
  bankBalance,
  formRef,
}: {
  onAddMany: (transactions: NewTransaction[]) => void;
  bankBalance: number;
  formRef?: React.Ref<HTMLFormElement>;
}) {
  const today = useToday();
  const draft = useSyncExternalStore(
    subscribeDraft,
    getDraftSnapshot,
    getDraftServerSnapshot,
  );
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  const date = draft.date || today;

  const filled = useMemo(
    () => ({
      credit: draft.credit.filter((row) => row.amount.trim() !== ""),
      debit: draft.debit.filter((row) => row.amount.trim() !== ""),
    }),
    [draft.credit, draft.debit],
  );

  const pending = useMemo(() => {
    const sum = (rows: DraftRow[]) =>
      rows.reduce((total, row) => total + (resolveAmount(row.amount) ?? 0), 0);
    const credit = sum(filled.credit);
    const debit = sum(filled.debit);
    return {
      credit,
      debit,
      net: credit - debit,
      count: filled.credit.length + filled.debit.length,
    };
  }, [filled]);

  const projectedBalance = bankBalance + pending.net;

  const setRows = (
    type: TransactionType,
    updater: (rows: DraftRow[]) => DraftRow[],
  ) =>
    setDraft((current) => ({
      ...current,
      [type]: updater(current[type]),
    }));

  const updateRow = (
    type: TransactionType,
    key: string,
    patch: Partial<DraftRow>,
  ) => {
    if (error) setError(null);
    if (savedCount) setSavedCount(0);
    setRows(type, (rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  };

  const addRow = (type: TransactionType) =>
    setDraft((current) => ({
      ...current,
      [type]: [...current[type], emptyRow(current.sequence)],
      sequence: current.sequence + 1,
    }));

  const removeRow = (type: TransactionType, key: string) =>
    setDraft((current) => {
      const rows = current[type];
      return {
        ...current,
        [type]:
          rows.length <= 1
            ? [emptyRow(current.sequence)]
            : rows.filter((row) => row.key !== key),
        sequence: current.sequence + 1,
      };
    });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setSavedCount(0);

    if (!date) {
      setError("Pick a date for these transactions.");
      return;
    }

    const collected: NewTransaction[] = [];
    const problems: string[] = [];

    const collect = (rows: DraftRow[], type: TransactionType) => {
      rows.forEach((row, index) => {
        if (row.amount.trim() === "") return;
        const amount = resolveAmount(row.amount);
        const side = type === "credit" ? "Credit" : "Debit";

        if (amount === null || amount <= 0) {
          problems.push(`${side} row ${index + 1}: enter an amount above ₹0.`);
          return;
        }

        collected.push({
          type,
          amount,
          remark:
            row.remark.trim() || (type === "credit" ? "Money In" : "Money Out"),
          date,
        });
      });
    };

    collect(draft.credit, "credit");
    collect(draft.debit, "debit");

    if (problems.length > 0) {
      setError(problems[0]);
      return;
    }
    if (collected.length === 0) {
      setError("Enter at least one credit or debit amount.");
      return;
    }

    onAddMany(collected);
    clearDraft();
    setError(null);
    setSavedCount(collected.length);
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Add Transactions
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Fill any number of rows on both sides, then add them all at once.
            {hasContent(draft) ? " Unsaved rows are kept if you refresh." : ""}
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Date
          <input
            type="date"
            value={date}
            onChange={(event) =>
              setDraft((current) => ({ ...current, date: event.target.value }))
            }
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-normal normal-case tracking-normal text-slate-700 outline-none focus:border-slate-400"
          />
        </label>
      </div>

      <form ref={formRef} onSubmit={submit} className="mt-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
          <EntryColumn
            type="credit"
            rows={draft.credit}
            total={pending.credit}
            count={filled.credit.length}
            firstAmountId="amount"
            onUpdate={updateRow}
            onAdd={addRow}
            onRemove={removeRow}
          />
          <EntryColumn
            type="debit"
            rows={draft.debit}
            total={pending.debit}
            count={filled.debit.length}
            onUpdate={updateRow}
            onAdd={addRow}
            onRemove={removeRow}
          />
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">
            {pending.count === 0 ? (
              "Nothing to add yet."
            ) : (
              <>
                <p>
                  <span className="font-medium text-slate-900">
                    {pending.count}{" "}
                    {pending.count === 1 ? "transaction" : "transactions"}
                  </span>{" "}
                  ready · In{" "}
                  <strong className="tabular-nums text-emerald-600">
                    {formatINRSmart(pending.credit)}
                  </strong>{" "}
                  · Out{" "}
                  <strong className="tabular-nums text-rose-600">
                    {formatINRSmart(pending.debit)}
                  </strong>
                </p>
                <p className="mt-0.5">
                  Bank balance{" "}
                  <span className="tabular-nums">
                    {formatINRSmart(bankBalance)}
                  </span>{" "}
                  → after adding{" "}
                  <strong
                    className={cn(
                      "tabular-nums",
                      projectedBalance < 0 ? "text-rose-600" : "text-slate-900",
                    )}
                  >
                    {formatINRSmart(projectedBalance)}
                  </strong>
                </p>
              </>
            )}
          </div>
          <button
            type="submit"
            disabled={pending.count === 0}
            className="shrink-0 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {pending.count > 1
              ? `+ Add ${pending.count} Transactions`
              : "+ Add Transaction"}
          </button>
        </div>

        {error ? (
          <p role="alert" className="mt-2 text-sm text-rose-600">
            {error}
          </p>
        ) : null}
        {savedCount > 0 ? (
          <p role="status" className="mt-2 text-sm text-emerald-600">
            Added {savedCount} {savedCount === 1 ? "transaction" : "transactions"}{" "}
            to your ledger.
          </p>
        ) : null}
      </form>
    </Card>
  );
}

function EntryColumn({
  type,
  rows,
  total,
  count,
  firstAmountId,
  onUpdate,
  onAdd,
  onRemove,
}: {
  type: TransactionType;
  rows: DraftRow[];
  total: number;
  count: number;
  firstAmountId?: string;
  onUpdate: (
    type: TransactionType,
    key: string,
    patch: Partial<DraftRow>,
  ) => void;
  onAdd: (type: TransactionType) => void;
  onRemove: (type: TransactionType, key: string) => void;
}) {
  const isCredit = type === "credit";

  return (
    <section
      className={cn(
        "rounded-xl border p-4",
        isCredit
          ? "border-emerald-200 bg-emerald-50/40"
          : "border-rose-200 bg-rose-50/40",
      )}
      aria-label={isCredit ? "Credit entries" : "Debit entries"}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3
            className={cn(
              "text-sm font-semibold",
              isCredit ? "text-emerald-700" : "text-rose-700",
            )}
          >
            {isCredit ? "Credit — Money In" : "Debit — Money Out"}
          </h3>
          <p className="text-xs text-slate-500">
            {isCredit
              ? "Salary, refunds, money received"
              : "Rent, food, money paid out"}
          </p>
        </div>
        <p
          className={cn(
            "shrink-0 text-right text-sm font-semibold tabular-nums",
            isCredit ? "text-emerald-700" : "text-rose-700",
          )}
        >
          {formatINRSmart(total)}
          <span className="block text-[11px] font-medium text-slate-400">
            {count} {count === 1 ? "row" : "rows"}
          </span>
        </p>
      </div>

      <ul className="mt-3 space-y-3">
        {rows.map((row, index) => {
          const amountId =
            index === 0 && firstAmountId
              ? firstAmountId
              : `${type}-amount-${row.key}`;

          return (
            <li
              key={row.key}
              className="rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="flex items-start gap-2">
                <div className="w-32 shrink-0 sm:w-36">
                  <label className={cn(labelClass, "mb-1")} htmlFor={amountId}>
                    Amount
                  </label>
                  <AmountInput
                    id={amountId}
                    value={row.amount}
                    onChange={(next) =>
                      onUpdate(type, row.key, { amount: next })
                    }
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <label
                    className={cn(labelClass, "mb-1")}
                    htmlFor={`${type}-remark-${row.key}`}
                  >
                    Remark
                  </label>
                  <input
                    id={`${type}-remark-${row.key}`}
                    className={inputClass}
                    placeholder="What was this for?"
                    autoComplete="off"
                    value={row.remark}
                    onChange={(event) =>
                      onUpdate(type, row.key, { remark: event.target.value })
                    }
                  />
                </div>

                <button
                  type="button"
                  onClick={() => onRemove(type, row.key)}
                  aria-label={`Clear ${isCredit ? "credit" : "debit"} row ${index + 1}`}
                  className="mt-6 shrink-0 rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-rose-600"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => onAdd(type)}
        className={cn(
          "mt-3 w-full rounded-lg border border-dashed px-3 py-2 text-sm font-semibold transition",
          isCredit
            ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            : "border-rose-300 text-rose-700 hover:bg-rose-50",
        )}
      >
        + Add another {isCredit ? "credit" : "debit"} row
      </button>
    </section>
  );
}
