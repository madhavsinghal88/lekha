"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { createId } from "./storage";
import { LedgerData, Transaction } from "./types";
import { buildRows, computeInsights, computeTotals } from "./ledger";
import {
  getBackupServerSnapshot,
  getBackupSnapshot,
  getServerSnapshot,
  getSnapshot,
  markBackedUp,
  resetStore,
  setLedger,
  subscribe,
} from "./store";

export type NewTransaction = Omit<Transaction, "id" | "createdAt">;

export function useLedger() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const lastBackupAt = useSyncExternalStore(
    subscribe,
    getBackupSnapshot,
    getBackupServerSnapshot,
  );

  const addTransaction = useCallback((input: NewTransaction) => {
    setLedger((current) => ({
      ...current,
      transactions: [
        ...current.transactions,
        { ...input, id: createId(), createdAt: new Date().toISOString() },
      ],
    }));
  }, []);

  const addTransactions = useCallback((inputs: NewTransaction[]) => {
    if (inputs.length === 0) return;
    const createdAt = new Date().toISOString();
    setLedger((current) => ({
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
    }));
  }, []);

  const updateTransaction = useCallback(
    (id: string, patch: Partial<NewTransaction>) => {
      setLedger((current) => ({
        ...current,
        transactions: current.transactions.map((tx) =>
          tx.id === id ? { ...tx, ...patch } : tx,
        ),
      }));
    },
    [],
  );

  const deleteTransaction = useCallback((id: string) => {
    setLedger((current) => ({
      ...current,
      transactions: current.transactions.filter((tx) => tx.id !== id),
    }));
  }, []);

  const setOpeningBalance = useCallback((openingBalance: number) => {
    setLedger((current) => ({ ...current, openingBalance }));
  }, []);

  const replaceLedger = useCallback((next: LedgerData) => {
    setLedger(next);
  }, []);

  const resetLedger = useCallback(() => {
    resetStore();
  }, []);

  const rows = useMemo(
    () => buildRows(data.transactions, data.openingBalance),
    [data.transactions, data.openingBalance],
  );

  const totals = useMemo(
    () => computeTotals(data.transactions, data.openingBalance),
    [data.transactions, data.openingBalance],
  );

  const insights = useMemo(
    () => computeInsights(data.transactions),
    [data.transactions],
  );

  return {
    data,
    lastBackupAt,
    markBackedUp,
    rows,
    totals,
    insights,
    addTransaction,
    addTransactions,
    updateTransaction,
    deleteTransaction,
    setOpeningBalance,
    replaceLedger,
    resetLedger,
  };
}
