"use client";

import { TransactionType } from "@/lib/types";
import { cn } from "./ui";

export function TypeToggle({
  value,
  onChange,
  size = "md",
}: {
  value: TransactionType;
  onChange: (next: TransactionType) => void;
  size?: "md" | "sm";
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Transaction type"
      className="grid grid-cols-2 gap-2"
    >
      <TypeButton
        active={value === "credit"}
        onClick={() => onChange("credit")}
        label="Credit"
        hint="Money In"
        tone="credit"
        size={size}
      />
      <TypeButton
        active={value === "debit"}
        onClick={() => onChange("debit")}
        label="Debit"
        hint="Money Out"
        tone="debit"
        size={size}
      />
    </div>
  );
}

function TypeButton({
  active,
  onClick,
  label,
  hint,
  tone,
  size,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
  tone: "credit" | "debit";
  size: "md" | "sm";
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "rounded-lg border text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20",
        size === "md" ? "px-3 py-2" : "px-3 py-1.5",
        active
          ? tone === "credit"
            ? "border-emerald-600 bg-emerald-50 text-emerald-700"
            : "border-rose-600 bg-rose-50 text-rose-700"
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      <span className="block text-sm font-semibold">{label}</span>
      <span className="block text-[11px] font-medium opacity-80">{hint}</span>
    </button>
  );
}
