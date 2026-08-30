"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatINRSmart } from "@/lib/format";
import {
  FilterState,
  LedgerRow,
  defaultFilters,
  filterRows,
  spendByCategory,
} from "@/lib/ledger";
import { useLedger } from "@/lib/useLedger";
import { backupFilename, downloadFile, ledgerToJSON } from "@/lib/exchange";
import { BackupReminder } from "./BackupReminder";
import { UndoBar } from "./UndoBar";
import { EditTransactionModal } from "./EditTransactionModal";
import { InsightsPanel } from "./InsightsPanel";
import { BankAccounts } from "./BankAccounts";
import { SettingsMenu } from "./SettingsMenu";
import { SummaryCards } from "./SummaryCards";
import { TransactionCardList } from "./TransactionCard";
import { TransactionFilters } from "./TransactionFilters";
import { BatchTransactionForm } from "./BatchTransactionForm";
import { TransactionTable } from "./TransactionTable";
import { Card, ConfirmDialog, cn } from "./ui";

export function Dashboard() {
  const ledger = useLedger();
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [editing, setEditing] = useState<LedgerRow | null>(null);
  const [deleting, setDeleting] = useState<LedgerRow | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const visibleRows = useMemo(
    () => filterRows(ledger.rows, filters),
    [ledger.rows, filters],
  );

  const topCategory = useMemo(
    () => spendByCategory(ledger.data.transactions)[0] ?? null,
    [ledger.data.transactions],
  );

  const visibleTotals = useMemo(() => {
    let credit = 0;
    let debit = 0;
    for (const row of visibleRows) {
      if (row.type === "credit") credit += row.amount;
      else debit += row.amount;
    }
    return { credit, debit };
  }, [visibleRows]);

  const hasTransactions = ledger.data.transactions.length > 0;
  const filtersActive =
    filters.search.trim() !== "" ||
    filters.type !== "all" ||
    filters.dateFilter !== "all";

  const { undo, redo } = ledger;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "z") {
        return;
      }
      const target = event.target as HTMLElement | null;
      // Let the browser handle text undo inside inputs.
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  const downloadBackup = () => {
    downloadFile(
      backupFilename("json"),
      ledgerToJSON(ledger.data),
      "application/json",
    );
    ledger.markBackedUp();
  };

  const focusForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    formRef.current?.querySelector<HTMLInputElement>("#amount")?.focus();
  };

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-lg font-semibold text-white"
          >
            ₹
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              Lekha
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Your personal rupee ledger. Saved on this device.
            </p>
          </div>
        </div>
        <SettingsMenu
          data={ledger.data}
          onImport={ledger.replaceLedger}
          onReset={ledger.resetLedger}
          onBackedUp={ledger.markBackedUp}
        />
      </header>

      <UndoBar
        history={ledger.history}
        onUndo={ledger.undo}
        onRedo={ledger.redo}
      />

      <BackupReminder
        transactionCount={ledger.data.transactions.length}
        lastBackupAt={ledger.lastBackupAt}
        onBackup={downloadBackup}
      />

      <main className="mt-6 space-y-4 sm:space-y-5">
        <SummaryCards
          totals={ledger.totals}
          openingBalance={ledger.openingBalance}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
          <div className="lg:col-span-1">
            <BankAccounts
              accounts={ledger.data.accounts}
              total={ledger.openingBalance}
              currentBalance={ledger.totals.currentBalance}
              onAdd={ledger.addAccount}
              onUpdate={ledger.updateAccount}
              onRemove={ledger.removeAccount}
            />
          </div>
          <div className="lg:col-span-2">
            <InsightsPanel
              insights={ledger.insights}
              topCategory={topCategory}
            />
          </div>
        </div>

        <BatchTransactionForm
          onAddMany={ledger.addTransactions}
          bankBalance={ledger.openingBalance}
          formRef={formRef}
        />

        <Card className="overflow-hidden">
          {hasTransactions ? (
            <>
              <TransactionFilters filters={filters} onChange={setFilters} />

              {visibleRows.length > 0 ? (
                <>
                  <TransactionTable
                    rows={visibleRows}
                    onEdit={setEditing}
                    onDelete={setDeleting}
                  />
                  <TransactionCardList
                    rows={visibleRows}
                    onEdit={setEditing}
                    onDelete={setDeleting}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-slate-600 sm:px-5">
                    <span>
                      Showing {visibleRows.length} of{" "}
                      {ledger.data.transactions.length} transactions
                    </span>
                    <span className="tabular-nums">
                      In{" "}
                      <strong className="text-emerald-600">
                        {formatINRSmart(visibleTotals.credit)}
                      </strong>{" "}
                      · Out{" "}
                      <strong className="text-rose-600">
                        {formatINRSmart(visibleTotals.debit)}
                      </strong>
                    </span>
                  </div>
                </>
              ) : (
                <p className="px-5 py-12 text-center text-sm text-slate-500">
                  No transactions match your search or filters.
                </p>
              )}
            </>
          ) : (
            <EmptyState onAdd={focusForm} />
          )}
        </Card>

        {filtersActive && visibleRows.length > 0 ? (
          <p className="text-center text-xs text-slate-400">
            Balances shown are running balances across your full ledger, not just
            the filtered rows.
          </p>
        ) : null}
      </main>

      <EditTransactionModal
        transaction={editing}
        onClose={() => setEditing(null)}
        onSave={ledger.updateTransaction}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this transaction?"
        message={
          deleting
            ? `${deleting.remark} — ${formatINRSmart(deleting.amount)} will be removed and all balances recalculated.`
            : ""
        }
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) ledger.deleteTransaction(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className={cn("px-6 py-14 text-center")}>
      <h3 className="text-base font-semibold text-slate-900">
        No transactions yet
      </h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
        Add your first credit or debit to start tracking your money.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-5 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        + Add Transaction
      </button>
    </div>
  );
}
