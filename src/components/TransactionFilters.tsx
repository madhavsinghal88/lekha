"use client";

import { FilterState } from "@/lib/ledger";
import { DateFilter, SortOrder, TypeFilter } from "@/lib/types";
import { cn, inputClass } from "./ui";

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "credit", label: "Credit" },
  { value: "debit", label: "Debit" },
];

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: "last60", label: "Last 60 Days" },
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "custom", label: "Custom Range" },
];

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "highest", label: "Highest amount" },
  { value: "lowest", label: "Lowest amount" },
];

export function TransactionFilters({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (next: FilterState) => void;
}) {
  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative lg:max-w-xs lg:flex-1">
          <label className="sr-only" htmlFor="search">
            Search transactions
          </label>
          <input
            id="search"
            type="search"
            value={filters.search}
            placeholder="Search remark or category"
            onChange={(event) => set("search", event.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            {TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={filters.type === option.value}
                onClick={() => set("type", option.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition",
                  filters.type === option.value
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <select
            aria-label="Date range"
            value={filters.dateFilter}
            onChange={(event) =>
              set("dateFilter", event.target.value as DateFilter)
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
          >
            {DATE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Sort transactions"
            value={filters.sort}
            onChange={(event) => set("sort", event.target.value as SortOrder)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filters.dateFilter === "custom" ? (
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <label className="flex items-center gap-2">
            From
            <input
              type="date"
              value={filters.from}
              onChange={(event) => set("from", event.target.value)}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 outline-none focus:border-slate-400"
            />
          </label>
          <label className="flex items-center gap-2">
            To
            <input
              type="date"
              value={filters.to}
              onChange={(event) => set("to", event.target.value)}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 outline-none focus:border-slate-400"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
