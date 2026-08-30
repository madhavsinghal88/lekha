"use client";

import { useEffect, useRef, useState } from "react";
import {
  backupFilename,
  downloadFile,
  ledgerToJSON,
  transactionsToCSV,
} from "@/lib/exchange";
import { sortChronologically } from "@/lib/ledger";
import { normalizeLedger } from "@/lib/storage";
import { LedgerData } from "@/lib/types";
import { ConfirmDialog, cn } from "./ui";

export function SettingsMenu({
  data,
  onImport,
  onReset,
  onBackedUp,
}: {
  data: LedgerData;
  onImport: (next: LedgerData) => void;
  onReset: () => void;
  onBackedUp: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);
  const [message, setMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const exportCSV = () => {
    const csv = transactionsToCSV(
      sortChronologically(data.transactions),
      data.openingBalance,
    );
    downloadFile(backupFilename("csv"), csv, "text/csv");
    setOpen(false);
  };

  const exportJSON = () => {
    downloadFile(backupFilename("json"), ledgerToJSON(data), "application/json");
    onBackedUp();
    setOpen(false);
  };

  const importJSON = async (file: File) => {
    try {
      const next = normalizeLedger(JSON.parse(await file.text()));
      onImport(next);
      setMessage(
        `Imported ${next.transactions.length} transaction${next.transactions.length === 1 ? "" : "s"}.`,
      );
    } catch {
      setMessage("That file could not be read as a ledger backup.");
    } finally {
      setOpen(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-xs transition hover:bg-slate-50"
      >
        Settings
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
          className={cn("transition", open && "rotate-180")}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void importJSON(file);
        }}
      />

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          <MenuItem onClick={exportCSV}>Export CSV</MenuItem>
          <MenuItem onClick={exportJSON}>Export JSON backup</MenuItem>
          <MenuItem onClick={() => fileRef.current?.click()}>
            Import JSON backup
          </MenuItem>
          <div className="my-1 border-t border-slate-100" />
          <MenuItem destructive onClick={() => setResetStep(1)}>
            Reset Ledger
          </MenuItem>
        </div>
      ) : null}

      {message ? (
        <p className="absolute right-0 top-full z-40 mt-2 w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-md">
          {message}
        </p>
      ) : null}

      <ConfirmDialog
        open={resetStep === 1}
        title="Reset ledger?"
        message="Are you sure you want to permanently delete your entire ledger? Export a backup first if you may need this data."
        confirmLabel="Continue"
        onCancel={() => setResetStep(0)}
        onConfirm={() => setResetStep(2)}
      />
      <ConfirmDialog
        open={resetStep === 2}
        title="This cannot be undone"
        message="Final confirmation: every transaction and your opening balance will be deleted from this device."
        confirmLabel="Delete everything"
        onCancel={() => setResetStep(0)}
        onConfirm={() => {
          onReset();
          setResetStep(0);
          setMessage("Ledger reset.");
        }}
      />
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  destructive,
}: {
  children: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "block w-full px-4 py-2 text-left text-sm font-medium transition",
        destructive
          ? "text-rose-600 hover:bg-rose-50"
          : "text-slate-700 hover:bg-slate-50",
      )}
    >
      {children}
    </button>
  );
}
