import {
  clearLedger,
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

export function setLedger(
  updater: LedgerData | ((current: LedgerData) => LedgerData),
): void {
  const current = getSnapshot();
  const next = typeof updater === "function" ? updater(current) : updater;
  if (next === current) return;
  state = next;
  saveLedger(next);
  for (const listener of listeners) listener();
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

export function resetStore(): void {
  clearLedger();
  state = emptyLedger;
  loaded = true;
  for (const listener of listeners) listener();
}
