import {
  emptyLedger,
  loadLastBackupAt,
  loadLedger,
  saveLastBackupAt,
  saveLedger,
} from "./storage";
import { LedgerData } from "./types";

/**
 * Tiny external store so React can read localStorage through
 * useSyncExternalStore instead of hydrating via effects.
 */
type Listener = () => void;

let state: LedgerData = emptyLedger;
let loaded = false;
const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): LedgerData {
  if (!loaded) {
    state = loadLedger();
    loaded = true;
  }
  return state;
}

export function getServerSnapshot(): LedgerData {
  return emptyLedger;
}

/**
 * Undo history. Every change keeps the previous ledger so an accidental add,
 * edit, delete or reset can be taken back.
 */
const HISTORY_LIMIT = 30;

export interface HistoryInfo {
  canUndo: boolean;
  canRedo: boolean;
  /** Describes the change that undo would take back, e.g. "Reset ledger". */
  lastAction: string | null;
}

let past: { data: LedgerData; action: string }[] = [];
let future: { data: LedgerData; action: string }[] = [];
let historyInfo: HistoryInfo = {
  canUndo: false,
  canRedo: false,
  lastAction: null,
};

function refreshHistory(): void {
  historyInfo = {
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    lastAction: past.length > 0 ? past[past.length - 1].action : null,
  };
}

export function getHistorySnapshot(): HistoryInfo {
  return historyInfo;
}

const serverHistory: HistoryInfo = {
  canUndo: false,
  canRedo: false,
  lastAction: null,
};

export function getHistoryServerSnapshot(): HistoryInfo {
  return serverHistory;
}

function commit(next: LedgerData): void {
  state = next;
  loaded = true;
  saveLedger(next);
  refreshHistory();
  for (const listener of listeners) listener();
}

export function setLedger(
  updater: LedgerData | ((current: LedgerData) => LedgerData),
  action = "Change",
): void {
  const current = getSnapshot();
  const next = typeof updater === "function" ? updater(current) : updater;
  if (next === current) return;

  past = [...past, { data: current, action }].slice(-HISTORY_LIMIT);
  future = [];
  commit(next);
}

export function undo(): void {
  if (past.length === 0) return;
  const previous = past[past.length - 1];
  past = past.slice(0, -1);
  future = [{ data: getSnapshot(), action: previous.action }, ...future];
  commit(previous.data);
}

export function redo(): void {
  if (future.length === 0) return;
  const [next, ...rest] = future;
  future = rest;
  past = [...past, { data: getSnapshot(), action: next.action }].slice(
    -HISTORY_LIMIT,
  );
  commit(next.data);
}

let backupAt: string | null = null;
let backupLoaded = false;

export function getBackupSnapshot(): string | null {
  if (!backupLoaded) {
    backupAt = loadLastBackupAt();
    backupLoaded = true;
  }
  return backupAt;
}

export function getBackupServerSnapshot(): string | null {
  return null;
}

export function markBackedUp(): void {
  backupAt = new Date().toISOString();
  backupLoaded = true;
  saveLastBackupAt(backupAt);
  for (const listener of listeners) listener();
}

/** Undoable: the wiped ledger is pushed onto the history first. */
export function resetStore(): void {
  setLedger(emptyLedger, "Reset ledger");
}

