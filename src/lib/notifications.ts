import { formatDay, formatMoney, shiftMonth } from "./format";
import { monthName } from "./periods";
import type { Terms } from "./professions";
import { isActive, remaining } from "./projects";
import type { Payment, ProjectSummary, Transaction } from "./types";

export type NoticeKind = "overdue" | "deadline" | "unpaid" | "noprepay" | "payment" | "expense" | "big" | "summary" | "goal";

export type Notice = {
  /** Стабильный id: по нему помним, что уведомление уже видели. */
  id: string;
  kind: NoticeKind;
  /** alert — требует действия, info — к сведению, good — хорошие новости */
  level: "alert" | "info" | "good";
  title: string;
  text: string;
  date: string;
  projectId?: string;
};

type Input = {
  projects: ProjectSummary[];
  payments: Payment[];
  transactions: Transaction[];
  today: string;
  currency: string;
  goal: number | null;
  terms: Terms;
};

const dayDiff = (a: string, b: string) => Math.round((Date.parse(a) - Date.parse(b)) / 86_400_000);

function inDays(n: number) {
  if (n === 0) return "сегодня";
  if (n === 1) return "завтра";
  return `через ${n} дн.`;
}

/** Уведомления собираются из данных на лету — отдельной таблицы нет. */
export function buildNotices({ projects, payments, transactions, today, currency, goal, terms }: Input): Notice[] {
  const list: Notice[] = [];
  const money = (n: number) => formatMoney(n, currency);
  const month = today.slice(0, 7);
  const prevMonth = shiftMonth(month, -1);

  for (const p of projects) {
    if (isActive(p) && p.deadline) {
      const left = dayDiff(p.deadline, today);
      if (left < 0) {
        list.push({
          id: `overdue:${p.id}:${p.deadline}`,
          kind: "overdue",
          level: "alert",
          title: `Просрочен срок: ${p.client}`,
          text: `Нужно было сдать ${formatDay(p.deadline)}, прошло ${-left} дн.`,
          date: p.deadline,
          projectId: p.id,
        });
      } else if (left <= 3) {
        list.push({
          id: `deadline:${p.id}:${p.deadline}`,
          kind: "deadline",
          level: "alert",
          title: `Скоро сдавать: ${p.client}`,
          text: `${p.title}. Срок ${formatDay(p.deadline)}, ${inDays(left)}.`,
          date: today,
          projectId: p.id,
        });
      }
    }
    if (p.status === "done" && remaining(p) > 0) {
      list.push({
        id: `unpaid:${p.id}:${remaining(p)}`,
        kind: "unpaid",
        level: "alert",
        title: `Не оплачено: ${p.client}`,
        text: `Работа завершена, но ещё должны ${money(remaining(p))}.`,
        date: p.completed_at ?? today,
        projectId: p.id,
      });
    }
    const started = p.created_at.slice(0, 10);
    if (isActive(p) && p.received === 0 && p.price > 0 && dayDiff(today, started) >= 3) {
      list.push({
        id: `noprepay:${p.id}`,
        kind: "noprepay",
        level: "info",
        title: `Нет предоплаты: ${p.client}`,
        text: `${terms.order} с ${formatDay(started)}, оплат пока не было.`,
        date: started,
        projectId: p.id,
      });
    }
  }

  const byId = new Map(projects.map((p) => [p.id, p]));
  for (const pay of payments) {
    if (dayDiff(today, pay.paid_at) > 7) continue;
    const project = pay.project_id ? byId.get(pay.project_id) : null;
    list.push({
      id: `payment:${pay.id}`,
      kind: "payment",
      level: "good",
      title: `Пришло ${formatMoney(pay.amount, pay.currency)}`,
      text: project ? `${pay.kind === "prepayment" ? "Предоплата" : "Оплата"} от ${project.client}` : (pay.note ?? `Доход без ${terms.orderGen}`),
      date: pay.paid_at,
      projectId: pay.project_id ?? undefined,
    });
  }

  for (const tx of transactions) {
    if (tx.currency !== currency || tx.amount < 5000 || dayDiff(today, tx.spent_at) > 7) continue;
    list.push({
      id: `big:${tx.id}`,
      kind: "big",
      level: "info",
      title: `Крупная трата: ${money(tx.amount)}`,
      text: tx.description || tx.vendor || "Без описания",
      date: tx.spent_at,
    });
  }

  const sum = <T extends { currency: string; amount: number }>(xs: T[]) =>
    xs.filter((x) => x.currency === currency).reduce((s, x) => s + x.amount, 0);
  const spentNow = sum(transactions.filter((t) => t.spent_at.startsWith(month)));
  const spentPrev = sum(transactions.filter((t) => t.spent_at.startsWith(prevMonth)));
  const earnedNow = sum(payments.filter((p) => p.paid_at.startsWith(month)));
  const earnedPrev = sum(payments.filter((p) => p.paid_at.startsWith(prevMonth)));

  if (spentPrev > 0 && spentNow > spentPrev) {
    list.push({
      id: `expense:${month}`,
      kind: "expense",
      level: "alert",
      title: "Расходы выше прошлого месяца",
      text: `В ${monthName(month).toLowerCase()} уже ${money(spentNow)}, а за весь ${monthName(prevMonth).toLowerCase()} было ${money(spentPrev)}.`,
      date: today,
    });
  }

  if (goal && earnedNow >= goal) {
    list.push({
      id: `goal:${month}:${goal}`,
      kind: "goal",
      level: "good",
      title: "План на месяц выполнен",
      text: `Заработано ${money(earnedNow)} при плане ${money(goal)}.`,
      date: today,
    });
  }

  if (earnedPrev > 0 || spentPrev > 0) {
    list.push({
      id: `summary:${prevMonth}`,
      kind: "summary",
      level: "info",
      title: `Итоги: ${monthName(prevMonth).toLowerCase()}`,
      text: `Доход ${money(earnedPrev)}, расходы ${money(spentPrev)}, прибыль ${money(earnedPrev - spentPrev)}.`,
      date: `${month}-01`,
    });
  }

  const rank = { alert: 0, good: 1, info: 2 };
  return list.sort((a, b) => rank[a.level] - rank[b.level] || b.date.localeCompare(a.date));
}
