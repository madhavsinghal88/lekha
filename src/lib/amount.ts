import { evaluateExpression } from "./expression";
import { formatAmountInput, parseAmountInput } from "./format";

const ALLOWED = /[^\d.,+\-*/()\s]/g;

/** Keeps only characters that can appear in an amount or a small sum. */
export function sanitizeAmountEntry(raw: string): string {
  return raw
    .replace(/[x×]/gi, "*")
    .replace(/÷/g, "/")
    .replace(/=/g, "")
    .replace(ALLOWED, "");
}

export function isExpression(value: string): boolean {
  // A leading minus is a sign, not a calculation.
  return /[+*/()]/.test(value) || /\d\s*-/.test(value);
}

/**
 * Formats plain numbers with Indian grouping as you type, but leaves
 * expressions like "49000-35000" untouched so they stay editable.
 */
export function formatAmountEntry(raw: string): string {
  const cleaned = sanitizeAmountEntry(raw);
  return isExpression(cleaned) ? cleaned : formatAmountInput(cleaned);
}

/** Resolves a field value to a number, evaluating it first if it's a sum. */
export function resolveAmount(raw: string): number | null {
  const cleaned = sanitizeAmountEntry(raw).trim();
  if (cleaned === "") return null;

  if (isExpression(cleaned)) return evaluateExpression(cleaned);

  const value = parseAmountInput(cleaned);
  return Number.isFinite(value) ? value : null;
}
