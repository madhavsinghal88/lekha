import { LedgerData, Transaction, TransactionType } from "./types";

// Keys predate the "Lekha" name; kept as-is so existing saved ledgers survive.
const STORAGE_KEY = "inr-ledger:v1";
const BACKUP_KEY = "inr-ledger:last-backup";

export const emptyLedger: LedgerData = {
  version: 1,
  openingBalance: 0,
  transactions: [],
};

export function loadLedger(): LedgerData {
  if (typeof window === "undefined") return emptyLedger;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyLedger;
    return normalizeLedger(JSON.parse(raw));
  } catch {
    return emptyLedger;
  }
}

export function saveLedger(data: LedgerData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable — keep the in-memory state usable.
  }
}

/** ISO timestamp of the last JSON backup, kept outside the exported data. */
export function loadLastBackupAt(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(BACKUP_KEY);
  } catch {
    return null;
  }
}

export function saveLastBackupAt(timestamp: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BACKUP_KEY, timestamp);
  } catch {
    // Non-critical: the reminder simply reappears next time.
  }
}

export function clearLedger(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/** Accepts unknown JSON (e.g. an imported backup) and returns safe ledger data. */
export function normalizeLedger(input: unknown): LedgerData {
  if (typeof input !== "object" || input === null) return emptyLedger;
  const record = input as Record<string, unknown>;

  const openingBalance = Number(record.openingBalance);
  const rawTransactions = Array.isArray(record.transactions)
    ? record.transactions
    : [];

  const transactions = rawTransactions
    .map(normalizeTransaction)
    .filter((tx): tx is Transaction => tx !== null);

  return {
    version: 1,
    openingBalance: Number.isFinite(openingBalance) ? openingBalance : 0,
    transactions,
  };
}

function normalizeTransaction(input: unknown): Transaction | null {
  if (typeof input !== "object" || input === null) return null;
  const record = input as Record<string, unknown>;

  const amount = Number(record.amount);
  const type: TransactionType = record.type === "credit" ? "credit" : "debit";
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const date =
    typeof record.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(record.date)
      ? record.date
      : new Date().toISOString().slice(0, 10);

  return {
    id: typeof record.id === "string" && record.id ? record.id : createId(),
    type,
    amount,
    remark: typeof record.remark === "string" ? record.remark : "",
    category:
      typeof record.category === "string" && record.category
        ? record.category
        : undefined,
    date,
    createdAt:
      typeof record.createdAt === "string"
        ? record.createdAt
        : new Date().toISOString(),
  };
}

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `tx_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
