import type { PaymentKind, ProjectStatus, ProjectSummary } from "./types";

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  new: "Новый",
  in_progress: "В работе",
  done: "Сдан",
  cancelled: "Отменён",
};

export const STATUS_EMOJI: Record<ProjectStatus, string> = {
  new: "🆕",
  in_progress: "🛠",
  done: "✅",
  cancelled: "✖️",
};

export const PAYMENT_KIND_LABEL: Record<PaymentKind, string> = {
  prepayment: "Предоплата",
  payment: "Оплата",
};

/** Сколько должно прийти на руки: стоимость минус комиссия площадки. */
export function netPrice(p: Pick<ProjectSummary, "price" | "commission">) {
  return Math.max(0, p.price - p.commission);
}

/** Сколько ещё не получено. Для отменённых проектов ничего не ждём. */
export function remaining(p: ProjectSummary) {
  if (p.status === "cancelled") return 0;
  return Math.max(0, netPrice(p) - p.received);
}

export function profit(p: ProjectSummary) {
  return p.received - p.costs;
}

export function isActive(p: Pick<ProjectSummary, "status">) {
  return p.status === "new" || p.status === "in_progress";
}

export function toNumberRow<T extends Record<string, unknown>>(row: T, keys: (keyof T)[]): T {
  const out = { ...row };
  for (const k of keys) out[k] = Number(row[k] ?? 0) as T[keyof T];
  return out;
}
