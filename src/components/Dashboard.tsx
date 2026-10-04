"use client";

import { BriefcaseBusiness, CalendarClock, ChevronRight, NotebookPen, Plus, ReceiptText, Wallet } from "lucide-react";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import type { AppData } from "@/lib/data";
import { formatDay, formatMoney } from "@/lib/format";
import { bucketize, monthName, spanBuckets, type DateRange, type Period } from "@/lib/periods";
import { isActive, netPrice, remaining } from "@/lib/projects";
import type { Category } from "@/lib/types";
import { Page } from "./AppShell";
import { BarChart, Legend } from "./BarChart";
import { PeriodControl } from "./DateRangePicker";
import { usePeriod } from "./hooks";
import { AddMenu, ClientAvatar, ExpenseRow, PaymentRow, UNCATEGORIZED } from "./Rows";
import { SheetHost, useSheets } from "./SheetHost";
import { useTerms } from "./terms";
import { withAppData } from "./WithData";
import { capitalize } from "@/lib/professions";
import {
  AnimatedMoney,
  ArrowButton,
  CategoryIcon,
  DemoBanner,
  EmptyState,
  ProgressBar,
  Stat,
  StatusBadge,
  Tile,
  TileHeader,
  plural,
} from "./ui";

type Props = { data: AppData; currency: string; initialPeriod: Period; initialRange: DateRange | null };

const sumIn = <T extends { amount: number; currency: string }>(xs: T[], currency: string) =>
  xs.filter((x) => x.currency === currency).reduce((s, x) => s + x.amount, 0);

// Часы обновляются раз в 20 секунд; на сервере не рисуются, чтобы не было расхождения при гидрации.
function subscribeClock(cb: () => void) {
  const id = window.setInterval(cb, 20_000);
  return () => window.clearInterval(id);
}
const clockSnapshot = () =>
  new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date());

function Clock({ today }: { today: string }) {
  const time = useSyncExternalStore(subscribeClock, clockSnapshot, () => null);
  const date = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${today}T12:00:00Z`),
  );
  return (
    <div className="flex items-center justify-between gap-3 rounded-full bg-black/25 py-2.5 pr-5 pl-5">
      <span className="font-display text-2xl font-semibold tnum">{time ?? " "}</span>
      <span className="text-sm text-muted first-letter:uppercase">{date}</span>
    </div>
  );
}

function DashboardScreen({ data, currency, initialPeriod, initialRange }: Props) {
  const T = useTerms();
  const sheets = useSheets();
  const { categories, projects, payments, transactions, today } = data;
  const { period, setPeriod, custom, setCustom, span } = usePeriod(initialPeriod, null, today, initialRange, data.since);
  const month = today.slice(0, 7);

  const cur = useMemo(
    () => ({
      income: sumIn(payments.filter((p) => p.paid_at.startsWith(month)), currency),
      expenses: sumIn(transactions.filter((t) => t.spent_at.startsWith(month)), currency),
    }),
    [payments, transactions, month, currency],
  );

  const active = useMemo(
    () => projects.filter(isActive).sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999")),
    [projects],
  );
  const expected = active.reduce((s, p) => s + remaining(p), 0);
  const unpaidDone = projects.filter((p) => p.status === "done" && remaining(p) > 0).reduce((s, p) => s + remaining(p), 0);

  const chart = useMemo(() => {
    const buckets = spanBuckets(span, today, false);
    const inc = bucketize(payments.filter((p) => p.currency === currency), (p) => p.paid_at, (p) => p.amount, buckets);
    const exp = bucketize(transactions.filter((t) => t.currency === currency), (t) => t.spent_at, (t) => t.amount, buckets);
    const { from, to } = span;
    const income = sumIn(payments.filter((p) => p.paid_at >= from && p.paid_at <= to), currency);
    const expenses = sumIn(transactions.filter((t) => t.spent_at >= from && t.spent_at <= to), currency);
    return {
      data: buckets.map((b, i) => ({ key: b.key, short: b.short, full: b.full, values: [inc[i], exp[i]] })),
      income,
      expenses,
    };
  }, [span, today, payments, transactions, currency]);

  const operations = useMemo(() => {
    const ops = [
      ...payments.map((p) => ({ type: "income" as const, date: p.paid_at, created: p.created_at, item: p })),
      ...transactions.map((t) => ({ type: "expense" as const, date: t.spent_at, created: t.created_at, item: t })),
    ];
    return ops.sort((a, b) => b.date.localeCompare(a.date) || b.created.localeCompare(a.created)).slice(0, 6);
  }, [payments, transactions]);

  // Куда ушли деньги в этом месяце — по категориям, крупные сверху
  const byCategory = useMemo(() => {
    const sums = new Map<number, number>();
    transactions
      .filter((t) => t.currency === currency && t.spent_at.startsWith(month))
      .forEach((t) => sums.set(t.category_id ?? 0, (sums.get(t.category_id ?? 0) ?? 0) + t.amount));
    return [...sums.entries()].sort((a, b) => b[1] - a[1]);
  }, [transactions, currency, month]);

  const projectById = new Map(projects.map((p) => [p.id, p]));
  const catById = new Map(categories.map((c) => [c.id, c]));
  const hero = active[0];
  const pinned = data.notes?.find((n) => n.pinned) ?? data.notes?.[0];
  const net = cur.income - cur.expenses;

  return (
    <Page>
      {data.demo && <DemoBanner />}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_330px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* ─── Основная колонка ─── */}
        <div className="flex min-w-0 flex-col gap-3 lg:gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-[28px] leading-tight font-semibold tracking-tight lg:text-[32px]">Обзор</h1>
              <p className="text-muted">
                {monthName(month)}: {active.length} {plural(active.length, T.forms)} в работе
              </p>
            </div>
            <div className="hidden lg:block">
              <AddMenu onPick={sheets.open} placement="down" />
            </div>
          </div>

          {/* Цифры месяца */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <Stat i={0} label={`Доход, ${monthName(month).toLowerCase()}`} value={<AnimatedMoney value={cur.income} currency={currency} />} accent />
            <Stat i={1} label={`Расходы, ${monthName(month).toLowerCase()}`} value={<AnimatedMoney value={cur.expenses} currency={currency} />} />
            <Stat
              i={2}
              label="Прибыль за месяц"
              value={<AnimatedMoney value={net} currency={currency} />}
              hint={cur.income > 0 ? `маржа ${Math.round((net / cur.income) * 100)}%` : undefined}
            />
            <Stat
              i={3}
              label={`Ждём по ${T.ordersDat}`}
              value={<AnimatedMoney value={expected + unpaidDone} currency={currency} />}
              hint={unpaidDone > 0 ? `из них по сданным ${formatMoney(unpaidDone, currency)}` : undefined}
            />
          </div>

          {/* Ближайший заказ + остальные в работе */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">
            <Tile i={4} className="p-4 lg:col-span-7 lg:p-5" label={T.nearest}>
              {hero ? (
                <div className="flex flex-col gap-4 sm:flex-row">
                  <button
                    onClick={() => sheets.open({ kind: "project", id: hero.id })}
                    className="press relative hidden size-40 shrink-0 place-items-center overflow-hidden rounded-[22px] bg-gradient-to-br from-[#3c5a78] to-[#1c2a3a] sm:grid"
                    aria-label={`Открыть: ${hero.client}`}
                  >
                    <span className="absolute -top-8 -right-8 size-32 rounded-full bg-accent/25 blur-2xl" aria-hidden />
                    <span className="font-display text-6xl font-bold text-white/90" aria-hidden>
                      {hero.client.replace(/[«»"]/g, "").charAt(0).toUpperCase()}
                    </span>
                  </button>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] text-muted">{hero.deadline ? "Ближайший срок" : `${T.order} в работе`}</p>
                        <p className="truncate text-lg font-semibold">{hero.client}</p>
                        <p className="truncate text-sm text-muted">{hero.title}</p>
                      </div>
                      <StatusBadge status={hero.status} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 divide-x divide-white/15 rounded-2xl bg-white/[0.08] py-3 text-center">
                      <div>
                        <p className="font-semibold tnum">{formatMoney(hero.received, hero.currency)}</p>
                        <p className="text-xs text-muted">получено</p>
                      </div>
                      <div>
                        <p className="font-semibold tnum">{formatMoney(remaining(hero), hero.currency)}</p>
                        <p className="text-xs text-muted">осталось</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-white/[0.08] px-3 py-2.5">
                        <p className="text-xs text-muted">Взят</p>
                        <p className="font-medium">{formatDay(hero.created_at.slice(0, 10))}</p>
                      </div>
                      <div className="rounded-2xl bg-white/[0.08] px-3 py-2.5">
                        <p className="text-xs text-muted">Срок</p>
                        <p className="font-medium">{hero.deadline ? formatDay(hero.deadline) : "не указан"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState icon={BriefcaseBusiness} title={`${capitalize(T.ordersGen)} в работе нет`}>
                  Добавьте {T.orderAcc} кнопкой «Добавить».
                </EmptyState>
              )}
              {hero && netPrice(hero) > 0 && (
                <div className="mt-4">
                  {/* Как ползунок яркости в референсе: белая часть — сколько уже оплачено */}
                  <div className="relative h-11 overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className="grow-x absolute inset-y-0 left-0 rounded-full bg-white"
                      style={{ width: `max(44px, ${Math.min(100, (hero.received / netPrice(hero)) * 100)}%)` }}
                    />
                    <span className="absolute inset-y-0 left-0 grid w-11 place-items-center text-[#15191e]">
                      <Wallet size={16} aria-hidden />
                    </span>
                    <span className="absolute inset-y-0 right-4 flex items-center text-sm text-white mix-blend-difference tnum">
                      оплачено {Math.round((hero.received / netPrice(hero)) * 100)}%
                      <span className="hidden sm:inline">&nbsp;из {formatMoney(netPrice(hero), hero.currency)}</span>
                    </span>
                  </div>
                </div>
              )}
            </Tile>

            <div className="flex flex-col gap-3 lg:col-span-5 lg:gap-4">
              {active.slice(1, 4).map((p, i) => (
                <Tile key={p.id} as="div" i={5 + i} className="tile-hover">
                  <button onClick={() => sheets.open({ kind: "project", id: p.id })} className="flex w-full items-center gap-3 p-4 text-left">
                    <ClientAvatar name={p.client} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-semibold">{p.client}</span>
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 text-[13px] text-muted">
                        {p.deadline ? (
                          <>
                            <CalendarClock size={14} aria-hidden /> до {formatDay(p.deadline)}
                          </>
                        ) : (
                          <span className="truncate">{p.title}</span>
                        )}
                        {remaining(p) > 0 && <span className="ml-auto shrink-0 tnum">ждём {formatMoney(remaining(p), p.currency)}</span>}
                      </span>
                      {netPrice(p) > 0 && (
                        <span className="mt-2 block">
                          <ProgressBar value={p.received} max={netPrice(p)} label={`Оплачено: ${p.client}`} />
                        </span>
                      )}
                    </span>
                    <ArrowButton />
                  </button>
                </Tile>
              ))}
              {active.length <= 1 && (
                <Tile as="div" i={5} className="flex flex-1 flex-col items-start justify-center gap-3 p-5">
                  <p className="text-muted">Других {T.ordersGen} в работе нет.</p>
                  <button onClick={() => sheets.open({ kind: "project", id: null })} className="press inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15">
                    <Plus size={16} /> {T.newOrder}
                  </button>
                </Tile>
              )}
              <Link
                href="/projects"
                className="group flex items-center justify-center gap-1 rounded-full bg-white/[0.06] py-2.5 text-sm font-medium text-muted transition-colors hover:bg-white/[0.12] hover:text-ink"
              >
                {T.allOrders}
                {active.length > 4 && <span className="tnum">, ещё {active.length - 4} в работе</span>}
                <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* График + итоги периода + заметка */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">
            <Tile i={8} className="p-4 lg:col-span-8 lg:p-5" label="Доход и расходы">
              <TileHeader title="Доход и расходы" sub={span.caption}>
                <PeriodControl period={period} onPeriod={setPeriod} custom={custom} onCustom={setCustom} today={today} />
              </TileHeader>
              <div className="mt-3">
                <Legend
                  items={[
                    { label: "Доход", color: "var(--accent)" },
                    { label: "Расходы", color: "var(--expense)" },
                  ]}
                />
              </div>
              <BarChart
                className="mt-4 h-[210px] lg:h-[240px]"
                data={chart.data}
                series={[
                  { label: "Доход", color: "var(--accent)" },
                  { label: "Расходы", color: "var(--expense)" },
                ]}
                currency={currency}
              />
            </Tile>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1 lg:gap-4">
              <Tile i={9} className="p-4 lg:p-5" label="Итоги периода">
                <p className="text-[13px] text-muted">Прибыль {span.caption}</p>
                <p className="mt-1 font-display text-[28px] leading-tight font-semibold tracking-tight">
                  <AnimatedMoney value={chart.income - chart.expenses} currency={currency} />
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-2xl bg-white/[0.07] px-3 py-2">
                    <dt className="text-xs text-muted">Доход</dt>
                    <dd className="font-semibold text-accent tnum">{formatMoney(chart.income, currency)}</dd>
                  </div>
                  <div className="rounded-2xl bg-white/[0.07] px-3 py-2">
                    <dt className="text-xs text-muted">Расходы</dt>
                    <dd className="font-semibold tnum">{formatMoney(chart.expenses, currency)}</dd>
                  </div>
                </dl>
              </Tile>
              <Tile as="div" i={10} className="tile-hover">
                <Link href="/notes" className="flex h-full flex-col p-4 lg:p-5">
                  <span className="flex items-center justify-between gap-2 text-[13px] text-muted">
                    <span className="flex items-center gap-1.5">
                      <NotebookPen size={14} aria-hidden /> Заметка
                    </span>
                    <ArrowButton />
                  </span>
                  {pinned ? (
                    <>
                      {pinned.title && <span className="mt-2 font-semibold">{pinned.title}</span>}
                      <span className="mt-1 line-clamp-3 text-[15px] leading-snug whitespace-pre-line text-ink/85">{pinned.body}</span>
                    </>
                  ) : (
                    <span className="mt-2 text-muted">
                      Здесь будет закреплённая заметка.
                    </span>
                  )}
                </Link>
              </Tile>
            </div>
          </div>
        </div>

        {/* ─── Правая колонка: как панель термостата в референсе ─── */}
        <aside className="flex min-w-0 flex-col gap-3 lg:gap-4 xl:rounded-[32px] xl:bg-black/15 xl:p-4" aria-label="Сводка">
          <div className="hidden xl:block">
            <Clock today={today} />
          </div>
          <Tile i={12} className="p-4 lg:p-5" label="Последние операции">
            <TileHeader title="Последние операции" />
            {operations.length ? (
              <ul className="mt-2">
                {operations.map((op) => {
                  if (op.type === "income") {
                    const p = op.item;
                    return (
                      <PaymentRow key={p.id} payment={p} project={p.project_id ? projectById.get(p.project_id) : null} onOpen={() => sheets.open({ kind: "payment", id: p.id })} />
                    );
                  }
                  const t = op.item;
                  const cat: Category = catById.get(t.category_id ?? 0) ?? UNCATEGORIZED;
                  return (
                    <ExpenseRow
                      key={t.id}
                      tx={t}
                      category={cat}
                      project={t.project_id ? projectById.get(t.project_id) : null}
                      onOpen={() => sheets.open({ kind: "tx", id: t.id })}
                    />
                  );
                })}
              </ul>
            ) : (
              <EmptyState icon={ReceiptText} title="Операций пока нет">
                Добавьте доход или расход кнопкой «Добавить».
              </EmptyState>
            )}
          </Tile>

          <Tile i={13} className="p-4 lg:p-5" label="Расходы по категориям">
            <TileHeader title="Расходы по категориям" sub={monthName(month).toLowerCase()} />
            {byCategory.length ? (
              <ul className="mt-3 flex flex-col gap-3.5">
                {byCategory.slice(0, 5).map(([id, sum]) => {
                  const cat: Category = catById.get(id) ?? UNCATEGORIZED;
                  return (
                    <li key={id} className="flex items-center gap-3">
                      <CategoryIcon category={cat} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2 text-sm">
                          <span className="truncate font-medium">{cat.name}</span>
                          <span className="shrink-0 font-semibold tnum">{formatMoney(sum, currency)}</span>
                        </div>
                        <div className="mt-1.5">
                          <ProgressBar value={sum} max={byCategory[0][1]} label={`${cat.name}: ${formatMoney(sum, currency)}`} />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">В этом месяце расходов пока нет.</p>
            )}
            <Link href="/expenses" className="group mt-4 flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink">
              Все расходы
              <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Tile>
        </aside>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),16px)] z-30 flex justify-end px-4 lg:hidden">
        <div className="pointer-events-auto">
          <AddMenu onPick={sheets.open} placement="up" />
        </div>
      </div>

      <SheetHost {...sheets} data={{ categories, projects, payments, transactions, currency, today }} />
    </Page>
  );
}

export const Dashboard = withAppData(DashboardScreen);
