const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inrCompactFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const plainFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** ₹1,25,000.00 — always two decimals. */
export function formatINR(value: number): string {
  return inrFormatter.format(round2(value));
}

/** ₹1,25,000 when whole, ₹1,25,000.50 otherwise. */
export function formatINRSmart(value: number): string {
  const rounded = round2(value);
  return Number.isInteger(rounded)
    ? inrCompactFormatter.format(rounded)
    : inrFormatter.format(rounded);
}

/** 1,25,000 — grouping only, no symbol. Used inside the amount input. */
export function formatIndianNumber(value: number): string {
  return plainFormatter.format(value);
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Keeps digits, one dot, and re-applies Indian grouping to the integer part. */
export function formatAmountInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  let intPart = firstDot === -1 ? cleaned : cleaned.slice(0, firstDot);
  let decPart =
    firstDot === -1 ? "" : cleaned.slice(firstDot + 1).replace(/\./g, "");

  intPart = intPart.replace(/^0+(?=\d)/, "");
  decPart = decPart.slice(0, 2);

  const grouped = intPart === "" ? "" : formatIndianNumber(Number(intPart));

  if (firstDot === -1) return grouped;
  return `${grouped === "" ? "0" : grouped}.${decPart}`;
}

export function parseAmountInput(raw: string): number {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? round2(value) : NaN;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "30 Aug 2026" */
export function formatDate(iso: string): string {
  const date = parseISODate(iso);
  if (!date) return iso;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function parseISODate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}
