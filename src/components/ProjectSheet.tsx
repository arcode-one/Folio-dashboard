"use client";

import { useState, useTransition } from "react";
import { deleteProject, saveProject } from "@/app/actions";
import { formatDay, formatMoney, parseAmount } from "@/lib/format";
import { PAYMENT_KIND_LABEL, netPrice, profit, remaining } from "@/lib/projects";
import { PROJECT_STATUSES, type Payment, type ProjectStatus, type ProjectSummary, type Transaction } from "@/lib/types";
import { useTerms } from "./terms";
import { ErrorText, Field, Segmented, Sheet, SheetActions, amountToInput, inputClass } from "./ui";

type Props = {
  project: ProjectSummary | null;
  payments: Payment[];
  costs: Transaction[];
  today: string;
  onClose: () => void;
  onAddPayment: (projectId: string) => void;
  onEditPayment: (payment: Payment) => void;
  onAddCost: (projectId: string) => void;
  onEditCost: (tx: Transaction) => void;
};

export function ProjectSheet({
  project,
  payments,
  costs,
  onClose,
  onAddPayment,
  onEditPayment,
  onAddCost,
  onEditCost,
}: Props) {
  const T = useTerms();
  const [client, setClient] = useState(project?.client ?? "");
  const [title, setTitle] = useState(project?.title ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "in_progress");
  const [platform, setPlatform] = useState(project?.platform ?? "");
  const [price, setPrice] = useState(() => amountToInput(project?.price));
  const [commission, setCommission] = useState(() => amountToInput(project?.commission));
  const [deadline, setDeadline] = useState(project?.deadline ?? "");
  const [notes, setNotes] = useState(project?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  const priceValue = parseAmount(price) ?? 0;
  const commissionValue = parseAmount(commission) ?? 0;
  const currency = project?.currency ?? "RUB";

  function applyPercent(pct: number) {
    if (priceValue) setCommission(amountToInput(Math.round(priceValue * pct) / 100));
  }

  function save() {
    if (!client.trim()) return setError(`Заполните поле «${T.client}».`);
    setError(null);
    startTransition(async () => {
      const result = await saveProject({
        id: project?.id,
        client,
        title,
        status,
        platform,
        price: priceValue,
        commission: commissionValue,
        deadline,
        notes,
      });
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  function remove() {
    if (!project) return;
    if (!confirmDelete) return setConfirmDelete(true);
    startTransition(async () => {
      const result = await deleteProject(project.id);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <Sheet title={project ? `${project.client}` : T.newOrder} onClose={onClose}>
      {project && (
        <section className="mt-5 rounded-3xl bg-white/[0.07] p-5" aria-label="Деньги">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-display text-2xl font-semibold tnum">{formatMoney(project.received, currency)}</p>
            <p className="text-sm text-muted tnum">из {formatMoney(netPrice(project), currency)}</p>
          </div>
          <div className="mt-3">
            <div role="progressbar" aria-label="Оплачено" aria-valuemin={0} aria-valuemax={netPrice(project)} aria-valuenow={project.received} className="h-2 overflow-hidden rounded-full bg-white/12">
              <div className="grow-x h-full rounded-full bg-accent" style={{ width: `${netPrice(project) ? Math.min(100, (project.received / netPrice(project)) * 100) : 0}%` }} />
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <div>
              <dt className="text-muted">Ждём</dt>
              <dd className="font-medium tnum">{formatMoney(remaining(project), currency)}</dd>
            </div>
            <div>
              <dt className="text-muted">Затраты</dt>
              <dd className="font-medium tnum">{formatMoney(project.costs, currency)}</dd>
            </div>
            <div>
              <dt className="text-muted">Прибыль</dt>
              <dd className="font-medium tnum">{formatMoney(profit(project), currency)}</dd>
            </div>
          </dl>
        </section>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4">
        <Field label={T.client}>
          <input value={client} onChange={(e) => setClient(e.target.value)} maxLength={120} className={inputClass} autoFocus={!project} />
        </Field>
        <Field label={T.titleField}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={T.titlePlaceholder}
            maxLength={200}
            className={inputClass}
          />
        </Field>
        <div>
          <span className="mb-1.5 block text-sm text-muted">Статус</span>
          <Segmented
            label="Статус"
            value={status}
            onChange={setStatus}
            options={PROJECT_STATUSES.map((s) => ({ value: s, label: T.status[s] }))}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Стоимость">
            <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="0" className={`${inputClass} tnum`} />
          </Field>
          <Field label={T.source}>
            <input value={platform} onChange={(e) => setPlatform(e.target.value)} list="platforms" className={inputClass} />
            <datalist id="platforms">
              {T.sourceList.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </Field>
        </div>
        <div>
          <Field label={T.commission}>
            <input
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              inputMode="decimal"
              placeholder="0"
              className={`${inputClass} tnum`}
            />
          </Field>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            {[10, 15, 20].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => applyPercent(pct)}
                disabled={!priceValue}
                className="press rounded-full border border-line px-3 py-1 font-medium transition-colors hover:border-ink hover:bg-ink hover:text-surface disabled:opacity-40"
              >
                {pct}%
              </button>
            ))}
            {priceValue > 0 && commissionValue > 0 && (
              <span className="text-muted">
                {Math.round((commissionValue / priceValue) * 1000) / 10}% · на руки{" "}
                {formatMoney(priceValue - commissionValue, currency)}
              </span>
            )}
          </div>
        </div>
        <Field label="Дедлайн">
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Заметки">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={`${inputClass} resize-y`} />
        </Field>
      </div>

      {project && (
        <>
          <section className="mt-7">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Оплаты</h3>
              <button onClick={() => onAddPayment(project.id)} className="text-sm font-medium text-accent">
                Добавить оплату
              </button>
            </div>
            {payments.length ? (
              <ul className="mt-2 divide-y divide-line">
                {payments.map((p) => (
                  <li key={p.id}>
                    <button onClick={() => onEditPayment(p)} className="flex w-full items-center justify-between py-2.5 text-left">
                      <span>
                        {PAYMENT_KIND_LABEL[p.kind]}
                        <span className="ml-2 text-sm text-muted">{formatDay(p.paid_at)}</span>
                      </span>
                      <span className="font-semibold text-accent tnum">+{formatMoney(p.amount, p.currency)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">Оплат пока не было.</p>
            )}
          </section>

          <section className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Затраты на {T.orderAcc}</h3>
              <button onClick={() => onAddCost(project.id)} className="text-sm font-medium text-accent">
                Добавить затрату
              </button>
            </div>
            {costs.length ? (
              <ul className="mt-2 divide-y divide-line">
                {costs.map((t) => (
                  <li key={t.id}>
                    <button onClick={() => onEditCost(t)} className="flex w-full items-center justify-between py-2.5 text-left">
                      <span>
                        {t.description || "Затрата"}
                        <span className="ml-2 text-sm text-muted">{formatDay(t.spent_at)}</span>
                      </span>
                      <span className="font-medium tnum">−{formatMoney(t.amount, t.currency)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">{T.costsHint}</p>
            )}
          </section>
        </>
      )}

      {error && <ErrorText>{error}</ErrorText>}
      <SheetActions
        pending={pending}
        submitLabel={project ? "Сохранить" : T.createOrder}
        onSubmit={save}
        onDelete={project ? remove : undefined}
        confirmDelete={confirmDelete}
        deleteLabel={`Удалить ${T.orderAcc} вместе с оплатами`}
      />
    </Sheet>
  );
}
