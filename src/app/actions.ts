"use client";

import { todayISO } from "@/lib/format";
import { mutate, newId } from "@/lib/store";
import { NOTE_COLORS, PROJECT_STATUSES, type NoteColor, type PaymentKind, type ProjectStatus } from "@/lib/types";

// Сохранение и удаление — те же функции, что были на сервере, только пишут в хранилище браузера.

type Result = { error?: string };

const isDate = (s: string | null | undefined) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
const round = (n: number) => Math.round(n * 100) / 100;
const now = () => new Date().toISOString();

// ─── Расходы ───
export type TransactionInput = {
  id?: string;
  amount: number;
  currency: string;
  category_id: number | null;
  project_id: string | null;
  description: string;
  spent_at: string;
};

export async function saveTransaction(input: TransactionInput): Promise<Result> {
  if (!(input.amount > 0)) return { error: "Сумма должна быть больше нуля." };
  if (!isDate(input.spent_at)) return { error: "Укажите дату." };

  const row = {
    amount: round(input.amount),
    currency: input.currency,
    category_id: input.category_id,
    project_id: input.project_id,
    description: input.description.trim().slice(0, 200) || null,
    spent_at: input.spent_at,
  };
  mutate((db) => {
    const current = input.id ? db.transactions.find((t) => t.id === input.id) : null;
    if (current) Object.assign(current, row);
    else db.transactions.push({ ...row, id: newId(), vendor: null, source: "manual", receipt_path: null, created_at: now() });
  });
  return {};
}

export async function deleteTransaction(id: string): Promise<Result> {
  mutate((db) => {
    db.transactions = db.transactions.filter((t) => t.id !== id);
  });
  return {};
}

// ─── Заказы ───
export type ProjectInput = {
  id?: string;
  client: string;
  title: string;
  status: ProjectStatus;
  platform: string;
  price: number;
  commission: number;
  deadline: string;
  notes: string;
};

export async function saveProject(input: ProjectInput): Promise<Result & { id?: string }> {
  if (!input.client.trim()) return { error: "Укажите клиента или название проекта." };
  if (!PROJECT_STATUSES.includes(input.status)) return { error: "Неизвестный статус." };
  if (input.price < 0 || input.commission < 0) return { error: "Суммы не могут быть отрицательными." };

  const row = {
    client: input.client.trim().slice(0, 120),
    title: input.title.trim().slice(0, 200) || "Без описания",
    status: input.status,
    platform: input.platform.trim() || null,
    price: round(input.price),
    commission: round(input.commission),
    deadline: isDate(input.deadline) ? input.deadline : null,
    notes: input.notes.trim() || null,
  };

  const id = input.id ?? newId();
  mutate((db) => {
    const current = input.id ? db.projects.find((p) => p.id === input.id) : null;
    if (current) {
      const completed_at = row.status === "done" ? (current.status === "done" ? current.completed_at : todayISO()) : null;
      Object.assign(current, row, { completed_at });
    } else {
      db.projects.push({ ...row, id, currency: "RUB", completed_at: row.status === "done" ? todayISO() : null, created_at: now() });
    }
  });
  return { id };
}

export async function deleteProject(id: string): Promise<Result> {
  // Как в базе: оплаты заказа удаляются вместе с ним, а расходы остаются без привязки.
  mutate((db) => {
    db.projects = db.projects.filter((p) => p.id !== id);
    db.payments = db.payments.filter((p) => p.project_id !== id);
    db.transactions.forEach((t) => {
      if (t.project_id === id) t.project_id = null;
    });
  });
  return {};
}

// ─── Доходы ───
export type PaymentInput = {
  id?: string;
  project_id: string | null;
  amount: number;
  kind: PaymentKind;
  paid_at: string;
  note: string;
};

export async function savePayment(input: PaymentInput): Promise<Result> {
  if (!(input.amount > 0)) return { error: "Сумма должна быть больше нуля." };
  if (!isDate(input.paid_at)) return { error: "Укажите дату." };

  const row = {
    project_id: input.project_id,
    amount: round(input.amount),
    kind: input.kind === "prepayment" ? ("prepayment" as const) : ("payment" as const),
    paid_at: input.paid_at,
    note: input.note.trim().slice(0, 200) || null,
  };
  mutate((db) => {
    const current = input.id ? db.payments.find((p) => p.id === input.id) : null;
    if (current) Object.assign(current, row);
    else db.payments.push({ ...row, id: newId(), currency: "RUB", created_at: now() });
  });
  return {};
}

export async function deletePayment(id: string): Promise<Result> {
  mutate((db) => {
    db.payments = db.payments.filter((p) => p.id !== id);
  });
  return {};
}

// ─── Заметки ───
export type NoteInput = {
  id?: string;
  title: string;
  body: string;
  color: NoteColor;
  pinned: boolean;
};

export async function saveNote(input: NoteInput): Promise<Result> {
  if (!input.title.trim() && !input.body.trim()) return { error: "Заметка пустая." };
  const row = {
    title: input.title.trim().slice(0, 120) || null,
    body: input.body.slice(0, 5000),
    color: NOTE_COLORS.includes(input.color) ? input.color : ("none" as const),
    pinned: input.pinned,
    updated_at: now(),
  };
  mutate((db) => {
    const current = input.id ? db.notes.find((n) => n.id === input.id) : null;
    if (current) Object.assign(current, row);
    else db.notes.push({ ...row, id: newId(), created_at: now() });
  });
  return {};
}

export async function setNotePinned(id: string, pinned: boolean): Promise<Result> {
  mutate((db) => {
    const note = db.notes.find((n) => n.id === id);
    if (note) note.pinned = pinned;
  });
  return {};
}

export async function deleteNote(id: string): Promise<Result> {
  mutate((db) => {
    db.notes = db.notes.filter((n) => n.id !== id);
  });
  return {};
}

// ─── Настройки ───
export async function saveGoal(amount: number): Promise<Result> {
  if (!(amount >= 0) || amount > 100_000_000) return { error: "Неверная сумма." };
  mutate((db) => {
    db.goal = amount > 0 ? round(amount) : null;
  });
  return {};
}
