/**
 * Autosaves half-finished entry rows so a refresh never loses typing.
 * Kept separate from the ledger so drafts never end up in a backup file.
 */
const DRAFT_KEY = "inr-ledger:draft";

export interface DraftRow {
  key: string;
  amount: string;
  remark: string;
}

export interface DraftState {
  /** Empty means "use today". */
  date: string;
  credit: DraftRow[];
  debit: DraftRow[];
  sequence: number;
}

export const MIN_ROWS = 3;

export function emptyRow(sequence: number): DraftRow {
  return { key: `row-${sequence}`, amount: "", remark: "" };
}

export function initialRows(): DraftRow[] {
  return Array.from({ length: MIN_ROWS }, (_, index) => emptyRow(index));
}

export function emptyDraft(): DraftState {
  return {
    date: "",
    credit: initialRows(),
    debit: initialRows(),
    sequence: MIN_ROWS,
  };
}

export function isRowFilled(row: DraftRow): boolean {
  return row.amount.trim() !== "" || row.remark.trim() !== "";
}

export function hasContent(draft: DraftState): boolean {
  return [...draft.credit, ...draft.debit].some(isRowFilled);
}

// A stable reference for server rendering, and a client-side cache so
// useSyncExternalStore sees the same object until something actually changes.
const serverDraft = emptyDraft();
let state: DraftState | null = null;
const listeners = new Set<() => void>();

export function subscribeDraft(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDraftSnapshot(): DraftState {
  if (state === null) state = load();
  return state;
}

export function getDraftServerSnapshot(): DraftState {
  return serverDraft;
}

export function setDraft(
  updater: DraftState | ((current: DraftState) => DraftState),
): void {
  const current = getDraftSnapshot();
  const next = typeof updater === "function" ? updater(current) : updater;
  if (next === current) return;
  state = next;
  save(next);
  for (const listener of listeners) listener();
}

export function clearDraft(): void {
  setDraft(emptyDraft());
}

function load(): DraftState {
  if (typeof window === "undefined") return emptyDraft();
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return emptyDraft();
    return normalizeDraft(JSON.parse(raw));
  } catch {
    return emptyDraft();
  }
}

function save(draft: DraftState): void {
  if (typeof window === "undefined") return;
  try {
    if (hasContent(draft) || draft.date !== "") {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } else {
      window.localStorage.removeItem(DRAFT_KEY);
    }
  } catch {
    // Autosave is best-effort; typing must never break.
  }
}

export function normalizeDraft(input: unknown): DraftState {
  if (typeof input !== "object" || input === null) return emptyDraft();
  const record = input as Record<string, unknown>;

  const credit = normalizeRows(record.credit);
  const debit = normalizeRows(record.debit);
  const sequence = Number(record.sequence);

  return {
    date:
      typeof record.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(record.date)
        ? record.date
        : "",
    credit: credit.length ? credit : initialRows(),
    debit: debit.length ? debit : initialRows(),
    sequence: Number.isFinite(sequence)
      ? Math.max(sequence, credit.length + debit.length)
      : credit.length + debit.length,
  };
}

function normalizeRows(input: unknown): DraftRow[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((item, index) => {
    if (typeof item !== "object" || item === null) return [];
    const record = item as Record<string, unknown>;
    return [
      {
        key:
          typeof record.key === "string" && record.key
            ? record.key
            : `row-${index}`,
        amount: typeof record.amount === "string" ? record.amount : "",
        remark: typeof record.remark === "string" ? record.remark : "",
      },
    ];
  });
}
