"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { createId } from "./storage";
import {
  BankAccount,
  LedgerData,
  MAX_ACCOUNTS,
  Transaction,
  totalBankBalance,
} from "./types";
import { buildRows, computeInsights, computeTotals } from "./ledger";
import {
  getBackupServerSnapshot,
  getBackupSnapshot,
  getHistoryServerSnapshot,
  getHistorySnapshot,
  getServerSnapshot,
  getSnapshot,
  markBackedUp,
  redo,
  resetStore,
  setLedger,
  subscribe,
  undo,
} from "./store";

export type NewTransaction = Omit<Transaction, "id" | "createdAt">;

export function useLedger() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const lastBackupAt = useSyncExternalStore(
    subscribe,
    getBackupSnapshot,
    getBackupServerSnapshot,
  );
  const history = useSyncExternalStore(
    subscribe,
    getHistorySnapshot,
    getHistoryServerSnapshot,
  );

  const addTransaction = useCallback((input: NewTransaction) => {
    setLedger(
      (current) => ({
        ...current,
        transactions: [
          ...current.transactions,
          { ...input, id: createId(), createdAt: new Date().toISOString() },
        ],
      }),
      "Added 1 transaction",
    );
  }, []);

  const addTransactions = useCallback((inputs: NewTransaction[]) => {
    if (inputs.length === 0) return;
    const createdAt = new Date().toISOString();
    setLedger(
      (current) => ({
        ...current,
        transactions: [
          ...current.transactions,
          ...inputs.map((input, index) => ({
            ...input,
            id: createId(),
            // Suffix keeps insertion order stable for a same-instant batch.
            createdAt: `${createdAt}#${index}`,
          })),
        ],
      }),
      `Added ${inputs.length} transaction${inputs.length === 1 ? "" : "s"}`,
    );
  }, []);

  const updateTransaction = useCallback(
    (id: string, patch: Partial<NewTransaction>) => {
      setLedger(
        (current) => ({
          ...current,
          transactions: current.transactions.map((tx) =>
            tx.id === id ? { ...tx, ...patch } : tx,
          ),
        }),
        "Edited a transaction",
      );
    },
    [],
  );

  const deleteTransaction = useCallback((id: string) => {
    setLedger(
      (current) => ({
        ...current,
        transactions: current.transactions.filter((tx) => tx.id !== id),
      }),
      "Deleted a transaction",
    );
  }, []);

  const addAccount = useCallback((name: string, balance: number) => {
    setLedger(
      (current) =>
        current.accounts.length >= MAX_ACCOUNTS
          ? current
          : {
              ...current,
              accounts: [
                ...current.accounts,
                { id: createId(), name, balance },
              ],
            },
      "Added an account",
    );
  }, []);

  const updateAccount = useCallback(
    (id: string, patch: Partial<Omit<BankAccount, "id">>) => {
      setLedger(
        (current) => ({
          ...current,
          accounts: current.accounts.map((account) =>
            account.id === id ? { ...account, ...patch } : account,
          ),
        }),
        "Edited an account",
      );
    },
    [],
  );

  const removeAccount = useCallback((id: string) => {
    setLedger(
      (current) => ({
        ...current,
        accounts: current.accounts.filter((account) => account.id !== id),
      }),
      "Removed an account",
    );
  }, []);

  const replaceLedger = useCallback((next: LedgerData) => {
    setLedger(next, "Imported a backup");
  }, []);

  const resetLedger = useCallback(() => {
    resetStore();
  }, []);

  const openingBalance = useMemo(
    () => totalBankBalance(data.accounts),
    [data.accounts],
  );

  const rows = useMemo(
    () => buildRows(data.transactions, openingBalance),
    [data.transactions, openingBalance],
  );

  const totals = useMemo(
    () => computeTotals(data.transactions, openingBalance),
    [data.transactions, openingBalance],
  );

  const insights = useMemo(
    () => computeInsights(data.transactions),
    [data.transactions],
  );

  return {
    data,
    openingBalance,
    lastBackupAt,
    markBackedUp,
    history,
    undo,
    redo,
    rows,
    totals,
    insights,
    addTransaction,
    addTransactions,
    updateTransaction,
    deleteTransaction,
    addAccount,
    updateAccount,
    removeAccount,
    replaceLedger,
    resetLedger,
  };
}
