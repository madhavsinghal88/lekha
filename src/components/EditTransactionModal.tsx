"use client";

import { useState } from "react";
import { formatAmountInput, parseAmountInput } from "@/lib/format";
import { CATEGORIES, Transaction, TransactionType } from "@/lib/types";
import { NewTransaction } from "@/lib/useLedger";
import { AmountInput } from "./AmountInput";
import { TypeToggle } from "./TypeToggle";
import { Modal, inputClass, labelClass } from "./ui";

export function EditTransactionModal({
  transaction,
  onClose,
  onSave,
}: {
  transaction: Transaction | null;
  onClose: () => void;
  onSave: (id: string, patch: Partial<NewTransaction>) => void;
}) {
  return (
    <Modal
      open={Boolean(transaction)}
      onClose={onClose}
      title="Edit Transaction"
      description="Balances recalculate automatically after saving."
    >
      {transaction ? (
        <EditForm
          key={transaction.id}
          transaction={transaction}
          onClose={onClose}
          onSave={onSave}
        />
      ) : null}
    </Modal>
  );
}

function EditForm({
  transaction,
  onClose,
  onSave,
}: {
  transaction: Transaction;
  onClose: () => void;
  onSave: (id: string, patch: Partial<NewTransaction>) => void;
}) {
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [amount, setAmount] = useState(
    formatAmountInput(String(transaction.amount)),
  );
  const [remark, setRemark] = useState(transaction.remark);
  const [category, setCategory] = useState(transaction.category ?? "");
  const [date, setDate] = useState(transaction.date);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    const parsed = parseAmountInput(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter an amount greater than ₹0.");
      return;
    }
    if (!date) {
      setError("Pick a date for this transaction.");
      return;
    }

    onSave(transaction.id, {
      type,
      amount: parsed,
      remark: remark.trim() || (type === "credit" ? "Money In" : "Money Out"),
      category: category || undefined,
      date,
    });
    onClose();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
        <div>
          <span className={labelClass}>Type</span>
          <TypeToggle value={type} onChange={setType} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="edit-amount">
              Amount
            </label>
            <AmountInput
              id="edit-amount"
              value={amount}
              onChange={setAmount}
              invalid={Boolean(error)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="edit-date">
              Date
            </label>
            <input
              id="edit-date"
              type="date"
              className={inputClass}
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="edit-remark">
            Remark
          </label>
          <input
            id="edit-remark"
            className={inputClass}
            value={remark}
            placeholder="What was this for?"
            onChange={(event) => setRemark(event.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="edit-category">
            Category
          </label>
          <select
            id="edit-category"
            className={inputClass}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">Optional</option>
            {CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-rose-600">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Save Changes
          </button>
      </div>
    </form>
  );
}
