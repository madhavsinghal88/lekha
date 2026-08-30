"use client";

import { useEffect, useRef, useState } from "react";
import {
  formatAmountEntry,
  isExpression,
  resolveAmount,
  sanitizeAmountEntry,
} from "@/lib/amount";
import { evaluateExpression } from "@/lib/expression";
import { formatAmountInput, formatINRSmart } from "@/lib/format";
import { cn } from "./ui";

export function AmountInput({
  value,
  onChange,
  id = "amount",
  autoFocus,
  invalid,
}: {
  value: string;
  onChange: (next: string) => void;
  id?: string;
  autoFocus?: boolean;
  invalid?: boolean;
}) {
  const [calcOpen, setCalcOpen] = useState(false);

  const pendingSum = isExpression(sanitizeAmountEntry(value));
  const result = pendingSum ? resolveAmount(value) : null;

  /** Replaces "49000-35000" with its result. */
  const commit = () => {
    if (!pendingSum) return;
    if (result === null) return;
    onChange(formatAmountInput(String(result)));
  };

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
        ₹
      </span>
      <input
        id={id}
        name="amount"
        inputMode="decimal"
        autoComplete="off"
        autoFocus={autoFocus}
        aria-invalid={invalid || undefined}
        placeholder="Enter amount or 49000-35000"
        value={value}
        onChange={(event) => onChange(formatAmountEntry(event.target.value))}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter" && pendingSum) {
            // Resolve the sum in place instead of submitting the form.
            event.preventDefault();
            commit();
          }
        }}
        className={cn(
          "w-full rounded-lg border bg-white py-2.5 pl-7 pr-11 text-sm font-medium tabular-nums text-slate-900 shadow-xs outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/10",
          invalid
            ? "border-rose-400 focus:border-rose-500"
            : "border-slate-200 focus:border-slate-400",
        )}
      />
      <button
        type="button"
        onClick={() => setCalcOpen((open) => !open)}
        aria-label="Open calculator"
        aria-expanded={calcOpen}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <CalculatorIcon />
      </button>

      {pendingSum ? (
        <p
          aria-live="polite"
          className={cn(
            "mt-1 text-xs font-medium tabular-nums",
            result === null ? "text-rose-600" : "text-slate-600",
          )}
        >
          {result === null
            ? "Can't calculate that"
            : `= ${formatINRSmart(result)} · press Enter`}
        </p>
      ) : null}

      {calcOpen ? (
        <CalculatorPopover
          onClose={() => setCalcOpen(false)}
          onUse={(computed) => {
            onChange(formatAmountInput(String(computed)));
            setCalcOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function CalculatorPopover({
  onClose,
  onUse,
}: {
  onClose: () => void;
  onUse: (result: number) => void;
}) {
  const [expression, setExpression] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const result = expression.trim() ? evaluateExpression(expression) : null;

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [onClose]);

  const apply = () => {
    if (result !== null && result > 0) onUse(result);
  };

  return (
    <div
      ref={containerRef}
      className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
    >
      <label
        htmlFor="calc-expression"
        className="text-xs font-semibold uppercase tracking-wide text-slate-500"
      >
        Quick calculator
      </label>
      <input
        id="calc-expression"
        autoFocus
        value={expression}
        placeholder="1500 + 800 - 200"
        onChange={(event) => setExpression(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            apply();
          }
        }}
        className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold tabular-nums text-slate-900">
          {expression.trim() === ""
            ? "—"
            : result === null
              ? "Invalid expression"
              : formatINRSmart(result)}
        </span>
        <button
          type="button"
          onClick={apply}
          disabled={result === null || result <= 0}
          className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Use
        </button>
      </div>
    </div>
  );
}

function CalculatorIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <rect x="4" y="2.5" width="16" height="19" rx="3" />
      <path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16.5h.01M12 16.5h.01M16 16.5h.01" />
    </svg>
  );
}
