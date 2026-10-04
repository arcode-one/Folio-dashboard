"use client";

import { useState, useTransition } from "react";
import { deletePayment, savePayment } from "@/app/actions";
import { formatMoney, parseAmount } from "@/lib/format";
import { isActive, remaining } from "@/lib/projects";
import type { Payment, PaymentKind, ProjectSummary } from "@/lib/types";
import { useTerms } from "./terms";
import { BigAmountInput, ErrorText, Field, Segmented, Sheet, SheetActions, amountToInput, inputClass } from "./ui";

type Props = {
  payment: Payment | null;
  projects: ProjectSummary[];
  defaultProjectId?: string | null;
  currency: string;
  today: string;
  onClose: () => void;
};

export function PaymentSheet({ payment, projects, defaultProjectId, currency, today, onClose }: Props) {
  const T = useTerms();
  const [amount, setAmount] = useState(() => amountToInput(payment?.amount));
  const [projectId, setProjectId] = useState(payment?.project_id ?? defaultProjectId ?? "");
  const project = projects.find((p) => p.id === projectId);
  const [kind, setKind] = useState<PaymentKind>(
    payment?.kind ?? (project && project.received === 0 && project.status !== "done" ? "prepayment" : "payment"),
  );
  const [date, setDate] = useState(payment?.paid_at ?? today);
  const [note, setNote] = useState(payment?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  const projectOptions = [...projects].sort((a, b) => Number(isActive(b)) - Number(isActive(a)));
  const left = project ? remaining(project) : 0;

  function save() {
    const value = parseAmount(amount);
    if (!value) return setError("Введите сумму больше нуля.");
    setError(null);
    startTransition(async () => {
      const result = await savePayment({
        id: payment?.id,
        project_id: projectId || null,
        amount: value,
        kind,
        paid_at: date,
        note,
      });
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  function remove() {
    if (!payment) return;
    if (!confirmDelete) return setConfirmDelete(true);
    startTransition(async () => {
      const result = await deletePayment(payment.id);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <Sheet title={payment ? "Изменить доход" : "Новый доход"} onClose={onClose}>
      <BigAmountInput value={amount} onChange={setAmount} currency={currency} autoFocus={!payment} />
      {!payment && left > 0 && (
        <button
          type="button"
          onClick={() => setAmount(amountToInput(left))}
          className="mt-2 text-sm font-medium text-accent"
        >
          Весь остаток: {formatMoney(left, currency)}
        </button>
      )}

      <Field label={T.order} className="mt-5">
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputClass}>
          <option value="">Без {T.orderGen}</option>
          {projectOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.client} — {p.title}
            </option>
          ))}
        </select>
      </Field>

      <div className="mt-4">
        <Segmented
          label="Тип оплаты"
          value={kind}
          onChange={setKind}
          options={[
            { value: "prepayment", label: "Предоплата" },
            { value: "payment", label: "Оплата" },
          ]}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Дата">
          <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Комментарий">
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className={inputClass} />
        </Field>
      </div>

      {error && <ErrorText>{error}</ErrorText>}
      <SheetActions
        pending={pending}
        submitLabel={payment ? "Сохранить" : "Добавить доход"}
        onSubmit={save}
        onDelete={payment ? remove : undefined}
        confirmDelete={confirmDelete}
        deleteLabel="Удалить доход"
      />
    </Sheet>
  );
}
