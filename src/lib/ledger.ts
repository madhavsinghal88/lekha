import { parseISODate, round2, toISODate } from "./format";
import {
  DateFilter,
  RECENT_WINDOW_DAYS,
  SortOrder,
  Transaction,
  TypeFilter,
} from "./types";

export interface LedgerRow extends Transaction {
  balance: number;
}

export interface Totals {
  totalCredit: number;
  totalDebit: number;
  netMovement: number;
  currentBalance: number;
  count: number;
}

/** Chronological order: by date, then by insertion order for same-date entries. */
export function sortChronologically(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

/** Attaches a running balance to every transaction, starting at the opening balance. */
export function buildRows(
  transactions: Transaction[],
  openingBalance: number,
): LedgerRow[] {
  let balance = openingBalance;
  return sortChronologically(transactions).map((tx) => {
    balance = round2(
      balance + (tx.type === "credit" ? tx.amount : -tx.amount),
    );
    return { ...tx, balance };
  });
}

export function computeTotals(
  transactions: Transaction[],
  openingBalance: number,
): Totals {
  let totalCredit = 0;
  let totalDebit = 0;
  for (const tx of transactions) {
    if (tx.type === "credit") totalCredit += tx.amount;
    else totalDebit += tx.amount;
  }
  totalCredit = round2(totalCredit);
  totalDebit = round2(totalDebit);
  return {
    totalCredit,
    totalDebit,
    netMovement: round2(totalCredit - totalDebit),
    currentBalance: round2(openingBalance + totalCredit - totalDebit),
    count: transactions.length,
  };
}

export interface FilterState {
  search: string;
  type: TypeFilter;
  dateFilter: DateFilter;
  from: string;
  to: string;
  sort: SortOrder;
}

export const defaultFilters: FilterState = {
  search: "",
  type: "all",
  dateFilter: "last60",
  from: "",
  to: "",
  sort: "newest",
};

/** Inclusive [from, to] ISO range for the selected preset, or null for all time. */
export function dateRangeFor(
  filter: DateFilter,
  from: string,
  to: string,
  now = new Date(),
): { from: string; to: string } | null {
  if (filter === "all") return null;

  if (filter === "custom") {
    if (!from && !to) return null;
    return {
      from: from || "0000-01-01",
      to: to || "9999-12-31",
    };
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (filter === "today") {
    const iso = toISODate(today);
    return { from: iso, to: iso };
  }

  if (filter === "last60") {
    const start = new Date(today);
    start.setDate(today.getDate() - (RECENT_WINDOW_DAYS - 1));
    return { from: toISODate(start), to: toISODate(today) };
  }

  if (filter === "week") {
    // Week starts Monday.
    const day = (today.getDay() + 6) % 7;
    const start = new Date(today);
    start.setDate(today.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { from: toISODate(start), to: toISODate(end) };
  }

  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { from: toISODate(start), to: toISODate(end) };
}

export function filterRows(
  rows: LedgerRow[],
  filters: FilterState,
  now = new Date(),
): LedgerRow[] {
  const range = dateRangeFor(
    filters.dateFilter,
    filters.from,
    filters.to,
    now,
  );
  const query = filters.search.trim().toLowerCase();

  const filtered = rows.filter((row) => {
    if (filters.type !== "all" && row.type !== filters.type) return false;
    if (range && (row.date < range.from || row.date > range.to)) return false;
    if (query) {
      const haystack = `${row.remark} ${row.category ?? ""}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  return sortRows(filtered, filters.sort);
}

export function sortRows(rows: LedgerRow[], sort: SortOrder): LedgerRow[] {
  const sorted = [...rows];
  switch (sort) {
    case "oldest":
      return sorted;
    case "highest":
      return sorted.sort((a, b) => b.amount - a.amount);
    case "lowest":
      return sorted.sort((a, b) => a.amount - b.amount);
    case "newest":
    default:
      return sorted.reverse();
  }
}

export interface Insights {
  monthCredit: number;
  monthDebit: number;
  monthNet: number;
  biggestCredit: Transaction | null;
  biggestDebit: Transaction | null;
}

export function computeInsights(
  transactions: Transaction[],
  now = new Date(),
): Insights {
  const range = dateRangeFor("month", "", "", now)!;
  let monthCredit = 0;
  let monthDebit = 0;
  let biggestCredit: Transaction | null = null;
  let biggestDebit: Transaction | null = null;

  for (const tx of transactions) {
    const inMonth = tx.date >= range.from && tx.date <= range.to;
    if (tx.type === "credit") {
      if (inMonth) monthCredit += tx.amount;
      if (!biggestCredit || tx.amount > biggestCredit.amount) biggestCredit = tx;
    } else {
      if (inMonth) monthDebit += tx.amount;
      if (!biggestDebit || tx.amount > biggestDebit.amount) biggestDebit = tx;
    }
  }

  return {
    monthCredit: round2(monthCredit),
    monthDebit: round2(monthDebit),
    monthNet: round2(monthCredit - monthDebit),
    biggestCredit,
    biggestDebit,
  };
}

/** Total money out per category, biggest first. */
export function spendByCategory(
  transactions: Transaction[],
): { category: string; amount: number }[] {
  const totals = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type !== "debit") continue;
    const key = tx.category || "Uncategorised";
    totals.set(key, (totals.get(key) ?? 0) + tx.amount);
  }
  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount: round2(amount) }))
    .sort((a, b) => b.amount - a.amount);
}

export function isValidISODate(iso: string): boolean {
  return parseISODate(iso) !== null;
}
