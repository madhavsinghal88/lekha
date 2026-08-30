/**
 * Sanity checks for ledger math, INR formatting and the expression parser.
 * Run with: npm run check:logic
 */
import assert from "node:assert/strict";
import { formatAmountInput, formatINRSmart, parseAmountInput } from "../src/lib/format";
import { buildRows, computeTotals, computeInsights, dateRangeFor, filterRows, defaultFilters } from "../src/lib/ledger";
import { evaluateExpression } from "../src/lib/expression";
import { transactionsToCSV } from "../src/lib/exchange";
import { normalizeLedger } from "../src/lib/storage";
import type { Transaction } from "../src/lib/types";

const tx = (
  n: number,
  type: "credit" | "debit",
  amount: number,
  date: string,
  remark = `tx${n}`,
  category?: string,
): Transaction => ({
  id: `id${n}`,
  type,
  amount,
  remark,
  category,
  date,
  createdAt: `2026-08-30T10:0${n}:00.000Z`,
});

// INR formatting uses the Indian grouping system.
assert.equal(formatINRSmart(1000), "₹1,000");
assert.equal(formatINRSmart(100000), "₹1,00,000");
assert.equal(formatINRSmart(10000000), "₹1,00,00,000");
assert.equal(formatINRSmart(1250.5), "₹1,250.50");
assert.equal(formatAmountInput("125000"), "1,25,000");
assert.equal(formatAmountInput("₹1,500abc"), "1,500");
assert.equal(parseAmountInput("1,25,000.50"), 125000.5);
assert.ok(Number.isNaN(parseAmountInput("")));

// Running balance follows opening balance + credit - debit, chronologically.
const transactions = [
  tx(1, "credit", 50000, "2026-08-30", "Salary", "Salary"),
  tx(2, "debit", 15000, "2026-08-30", "Rent", "Rent"),
  tx(3, "credit", 5000, "2026-08-29", "Received from Rahul", "Borrowed"),
  tx(4, "debit", 800, "2026-08-29", "Dinner", "Food"),
];

const rows = buildRows(transactions, 20000);
assert.deepEqual(
  rows.map((r) => [r.remark, r.balance]),
  [
    ["Received from Rahul", 25000],
    ["Dinner", 24200],
    ["Salary", 74200],
    ["Rent", 59200],
  ],
);

const totals = computeTotals(transactions, 20000);
assert.equal(totals.totalCredit, 55000);
assert.equal(totals.totalDebit, 15800);
assert.equal(totals.netMovement, 39200);
assert.equal(totals.currentBalance, 59200);
assert.equal(totals.count, 4);

// Filters: type, search and sort. Pinned to "all time" so these stay stable.
const allTime = { ...defaultFilters, dateFilter: "all" as const };
const newest = filterRows(rows, allTime);
assert.equal(newest[0].remark, "Rent");
const oldest = filterRows(rows, { ...allTime, sort: "oldest" });
assert.equal(oldest[0].remark, "Received from Rahul");
const highest = filterRows(rows, { ...allTime, sort: "highest" });
assert.equal(highest[0].amount, 50000);
assert.equal(filterRows(rows, { ...allTime, type: "credit" }).length, 2);
assert.equal(filterRows(rows, { ...allTime, search: "rahul" }).length, 1);
assert.equal(filterRows(rows, { ...allTime, search: "Food" }).length, 1);

// Date filtering presets, evaluated against a fixed "now".
const now = new Date(2026, 7, 30); // Sun 30 Aug 2026
assert.deepEqual(dateRangeFor("today", "", "", now), { from: "2026-08-30", to: "2026-08-30" });
assert.deepEqual(dateRangeFor("week", "", "", now), { from: "2026-08-24", to: "2026-08-30" });
assert.deepEqual(dateRangeFor("month", "", "", now), { from: "2026-08-01", to: "2026-08-31" });
assert.equal(dateRangeFor("all", "", "", now), null);
// The 60-day window is inclusive of today, and is the default ledger view.
assert.deepEqual(dateRangeFor("last60", "", "", now), { from: "2026-07-02", to: "2026-08-30" });
assert.equal(defaultFilters.dateFilter, "last60");
assert.equal(filterRows(rows, defaultFilters, now).length, 4);
assert.equal(
  filterRows(
    [...rows, { ...rows[0], id: "old", date: "2026-01-01" }],
    defaultFilters,
    now,
  ).length,
  4,
);
assert.equal(filterRows(rows, { ...defaultFilters, dateFilter: "today" }, now).length, 2);
assert.equal(
  filterRows(rows, { ...defaultFilters, dateFilter: "custom", from: "2026-08-29", to: "2026-08-29" }, now).length,
  2,
);

// Insights.
const insights = computeInsights(transactions, now);
assert.equal(insights.monthCredit, 55000);
assert.equal(insights.monthDebit, 15800);
assert.equal(insights.monthNet, 39200);
assert.equal(insights.biggestCredit?.remark, "Salary");
assert.equal(insights.biggestDebit?.remark, "Rent");

// Calculator expressions.
assert.equal(evaluateExpression("1500 + 800 - 200"), 2100);
assert.equal(evaluateExpression("1200*3/2"), 1800);
assert.equal(evaluateExpression("(1000+500)*2"), 3000);
assert.equal(evaluateExpression("1,500 + 500"), 2000);
assert.equal(evaluateExpression("-500 + 700"), 200);
assert.equal(evaluateExpression("5/0"), null);
assert.equal(evaluateExpression("1 + "), null);
assert.equal(evaluateExpression("abc"), null);

// CSV export contains the opening row and a running balance column.
const csv = transactionsToCSV(buildRows(transactions, 20000), 20000);
assert.ok(csv.startsWith("Date,Remark,Category,Type,Credit (INR),Debit (INR),Balance (INR)"));
assert.ok(csv.includes("Opening Balance"));
assert.ok(csv.includes("59200.00"));
assert.ok(transactionsToCSV([tx(9, "debit", 10, "2026-08-30", 'A,"B"')], 0).includes('"A,""B"""'));

// Import normalisation drops junk and keeps valid rows.
const imported = normalizeLedger({
  openingBalance: "5000",
  transactions: [tx(1, "credit", 100, "2026-08-30"), { amount: -5 }, null, "x"],
});
assert.equal(imported.openingBalance, 5000);
assert.equal(imported.transactions.length, 1);
assert.deepEqual(normalizeLedger("nonsense").transactions, []);

console.log("All logic checks passed.");
