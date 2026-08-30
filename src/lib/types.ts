export type TransactionType = "credit" | "debit";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  remark: string;
  category?: string;
  /** ISO date (yyyy-mm-dd) */
  date: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  name: string;
  balance: number;
}

export interface LedgerData {
  version: 2;
  /** Starting balances per account. Their sum seeds every running balance. */
  accounts: BankAccount[];
  transactions: Transaction[];
}

export const MAX_ACCOUNTS = 5;

export function totalBankBalance(accounts: BankAccount[]): number {
  return accounts.reduce((total, account) => total + account.balance, 0);
}

export const CATEGORIES = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Rent",
  "Salary",
  "Business",
  "Investment",
  "Borrowed",
  "Loan",
  "Transfer",
  "Other",
] as const;

export type TypeFilter = "all" | "credit" | "debit";
export type DateFilter =
  | "all"
  | "today"
  | "week"
  | "month"
  | "last60"
  | "custom";

/** Default ledger window. Nothing is ever deleted — this only filters the view. */
export const RECENT_WINDOW_DAYS = 60;
export type SortOrder = "newest" | "oldest" | "highest" | "lowest";
