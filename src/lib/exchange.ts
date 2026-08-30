import { formatDate } from "./format";
import { LedgerData, Transaction } from "./types";

export function transactionsToCSV(
  transactions: Transaction[],
  openingBalance: number,
): string {
  const header = [
    "Date",
    "Remark",
    "Category",
    "Type",
    "Credit (INR)",
    "Debit (INR)",
    "Balance (INR)",
  ];

  let balance = openingBalance;
  const rows = transactions.map((tx) => {
    balance += tx.type === "credit" ? tx.amount : -tx.amount;
    return [
      formatDate(tx.date),
      tx.remark,
      tx.category ?? "",
      tx.type === "credit" ? "Money In" : "Money Out",
      tx.type === "credit" ? tx.amount.toFixed(2) : "",
      tx.type === "debit" ? tx.amount.toFixed(2) : "",
      balance.toFixed(2),
    ];
  });

  const openingRow = [
    "",
    "Bank Balance (starting)",
    "",
    "",
    "",
    "",
    openingBalance.toFixed(2),
  ];

  return [header, openingRow, ...rows]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\r\n");
}

function escapeCSV(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function downloadFile(
  filename: string,
  contents: string,
  mime: string,
): void {
  const blob = new Blob([contents], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function ledgerToJSON(data: LedgerData): string {
  return JSON.stringify(
    { ...data, exportedAt: new Date().toISOString() },
    null,
    2,
  );
}

export function backupFilename(extension: "csv" | "json"): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `lekha-ledger-${stamp}.${extension}`;
}
