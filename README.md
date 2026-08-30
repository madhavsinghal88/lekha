# Lekha — Personal Rupee Ledger

**Lekha** (Sanskrit: account, record) is a single-page personal ledger
calculator in Indian Rupees. Record money in
(credit) and money out (debit) with a remark, and instantly see totals, a
running balance, and simple monthly insights. Everything is stored locally in
the browser — no backend, no account.

## Features

- Summary cards: total credited, total debited, net balance (prominent), and transaction count
- Fast add form: Credit/Debit toggle, amount, remark, optional category, date
- Editable opening balance that seeds the running balance
- Ledger with a chronological running balance, shown as a table on desktop and cards on mobile
- Search by remark/category, filter by type and date (last 60 days by default, today, this week, this month, all time, custom range), sort by date or amount
- Nothing is ever auto-deleted; a periodic banner reminds you to download a JSON backup
- Edit and delete with confirmation; balances recalculate automatically
- Indian number formatting everywhere (₹1,00,000 style); amounts stored as plain numbers
- Built-in expression calculator (`1500 + 800 - 200`) that drops the result into the amount field
- Export CSV, export/import JSON backups, and a double-confirmed ledger reset
- `localStorage` persistence behind a small store abstraction, so a backend can be added later

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

| Script | Purpose |
| ------ | ------- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm run check:logic` | Assertions for ledger math, INR formatting, filters, CSV, and the calculator |

## Structure

```
src/
  app/            Next.js app router entry, layout, global styles
  components/     Dashboard, form, filters, table/cards, modals, settings
  lib/
    types.ts       Transaction / LedgerData model and categories
    format.ts      INR + Indian-number formatting, amount input parsing, dates
    ledger.ts      Running balance, totals, filters, insights
    expression.ts  Safe arithmetic evaluator for the calculator (no eval)
    storage.ts     localStorage read/write and import normalisation
    store.ts       External store read via useSyncExternalStore
    exchange.ts    CSV/JSON export helpers
    useLedger.ts   Ledger state and mutations
scripts/
  logic-check.ts  Dependency-free assertions run by npm run check:logic
```

## Data model

```ts
type TransactionType = "credit" | "debit";

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  remark: string;
  category?: string;
  date: string; // yyyy-mm-dd
  createdAt: string; // ISO timestamp, used to order same-day entries
}
```

Balance formulas:

- Total credit = sum of credit amounts
- Total debit = sum of debit amounts
- Current balance = opening balance + total credit − total debit
- Running balance = previous balance + credit − debit, in date then insertion order

## Retention and backups

Transactions are kept indefinitely in `localStorage` — nothing expires or is
pruned. The ledger view simply defaults to the **Last 60 Days** window, and
switching the date filter to **All Time** shows the full history. Summary cards,
insights and running balances always reflect the entire ledger, not the filter.

Your data lives only in this browser profile, so a banner appears if it has been
more than 30 days since your last JSON backup. Use **Settings → Export JSON
backup** (or the banner's Download button); **Import JSON backup** restores it on
any device. The backup timestamp is stored under a separate key so it never ends
up inside an exported file.
