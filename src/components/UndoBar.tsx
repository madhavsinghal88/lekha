"use client";

import { HistoryInfo } from "@/lib/store";
import { cn } from "./ui";

/** Lets an accidental add, edit, delete or reset be taken straight back. */
export function UndoBar({
  history,
  onUndo,
  onRedo,
}: {
  history: HistoryInfo;
  onUndo: () => void;
  onRedo: () => void;
}) {
  if (!history.canUndo && !history.canRedo) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-xs">
      <p className="text-sm text-slate-600">
        {history.canUndo ? (
          <>
            Last change:{" "}
            <span className="font-medium text-slate-900">
              {history.lastAction}
            </span>
          </>
        ) : (
          "Change undone."
        )}
      </p>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onUndo}
          disabled={!history.canUndo}
          title="Undo (⌘Z)"
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
            history.canUndo
              ? "bg-slate-900 text-white hover:bg-slate-800"
              : "cursor-not-allowed border border-slate-200 text-slate-300",
          )}
        >
          Undo
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!history.canRedo}
          title="Redo (⇧⌘Z)"
          className={cn(
            "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
            history.canRedo
              ? "border-slate-200 text-slate-700 hover:bg-slate-50"
              : "cursor-not-allowed border-slate-200 text-slate-300",
          )}
        >
          Redo
        </button>
      </div>
    </div>
  );
}
