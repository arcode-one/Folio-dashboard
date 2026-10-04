"use client";

import { useState, useTransition } from "react";
import { deleteTransaction, saveTransaction } from "@/app/actions";
import { parseAmount } from "@/lib/format";
import { isActive } from "@/lib/projects";
import type { Category, ProjectSummary, Transaction } from "@/lib/types";
import { useTerms } from "./terms";
import { BigAmountInput, ErrorText, Field, Sheet, SheetActions, amountToInput, inputClass } from "./ui";

type Props = {
  transaction: Transaction | null;
  categories: Category[];
  projects: ProjectSummary[];
  defaultCategoryId?: number | null;
  defaultProjectId?: string | null;
  currency: string;
  today: string;
  onClose: () => void;
};

export function TransactionSheet({
  transaction,
  categories,
  projects,
  defaultCategoryId,
  defaultProjectId,
  currency,
  today,
  onClose,
}: Props) {
  const T = useTerms();
  const [amount, setAmount] = useState(() => amountToInput(transaction?.amount));
  const [categoryId, setCategoryId] = useState<number | null>(
    transaction?.category_id ?? defaultCategoryId ?? (defaultProjectId ? categories.find((c) => c.name === "Работа")?.id : null) ?? null,
  );
  const [projectId, setProjectId] = useState(transaction?.project_id ?? defaultProjectId ?? "");
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [date, setDate] = useState(transaction?.spent_at ?? today);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  const projectOptions = [...projects].sort((a, b) => Number(isActive(b)) - Number(isActive(a)));

  function save() {
    const value = parseAmount(amount);
    if (!value) return setError("Введите сумму больше нуля.");
    if (categoryId === null) return setError("Выберите категорию.");
    setError(null);
    startTransition(async () => {
      const result = await saveTransaction({
        id: transaction?.id,
        amount: value,
        currency: transaction?.currency ?? currency,
        category_id: categoryId,
        project_id: projectId || null,
        description,
        spent_at: date,
      });
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  function remove() {
    if (!transaction) return;
    if (!confirmDelete) return setConfirmDelete(true);
    startTransition(async () => {
      const result = await deleteTransaction(transaction.id);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <Sheet title={transaction ? "Изменить расход" : "Новый расход"} onClose={onClose}>
      <BigAmountInput
        value={amount}
        onChange={setAmount}
        currency={transaction?.currency ?? currency}
        autoFocus={!transaction}
      />

      <fieldset className="mt-5">
        <legend className="mb-2 text-sm text-muted">Категория</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const selected = cat.id === categoryId;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                aria-pressed={selected}
                className="rounded-full border px-3 py-1.5 text-sm transition-colors"
                style={
                  selected ? { background: `${cat.color}24`, borderColor: cat.color } : { borderColor: "var(--line)" }
                }
              >
                {cat.emoji} {cat.name}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Field label="Описание" className="mt-5">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Например, обед с коллегами"
          maxLength={200}
          className={inputClass}
        />
      </Field>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Дата">
          <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </Field>
        <Field label={T.order}>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputClass}>
            <option value="">Не относится к {T.orderDat}</option>
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.client} — {p.title}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {transaction?.vendor && <p className="mt-4 text-sm text-muted">Продавец: {transaction.vendor}</p>}

      {error && <ErrorText>{error}</ErrorText>}
      <SheetActions
        pending={pending}
        submitLabel={transaction ? "Сохранить" : "Добавить расход"}
        onSubmit={save}
        onDelete={transaction ? remove : undefined}
        confirmDelete={confirmDelete}
        deleteLabel="Удалить расход"
      />
    </Sheet>
  );
}
