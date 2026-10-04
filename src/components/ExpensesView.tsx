"use client";

import { Plus, ReceiptText, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { AppData } from "@/lib/data";
import { formatDay, formatMoney, monthRange } from "@/lib/format";
import { bucketize, monthName, rangeLabel, spanBuckets, type DateRange, type Period } from "@/lib/periods";
import type { Transaction } from "@/lib/types";
import { Page } from "./AppShell";
import { BarChart } from "./BarChart";
import { PeriodControl } from "./DateRangePicker";
import { usePeriod } from "./hooks";
import { ExpenseRow, UNCATEGORIZED } from "./Rows";
import { SheetHost, useSheets } from "./SheetHost";
import { withAppData } from "./WithData";
import {
  AnimatedMoney,
  CategoryIcon,
  DemoBanner,
  EmptyState,
  Fab,
  PageHeader,
  Stat,
  Tile,
  TileHeader,
  plural,
  primaryButton,
} from "./ui";

type Props = { data: AppData; currency: string; initialPeriod: Period; initialMonth: string | null; initialRange: DateRange | null };

function dayLabel(iso: string, today: string) {
  const diff = Math.round((Date.parse(today) - Date.parse(iso)) / 86_400_000);
  if (diff === 0) return "Сегодня";
  if (diff === 1) return "Вчера";
  const weekday = new Intl.DateTimeFormat("ru-RU", { weekday: "short", timeZone: "UTC" }).format(new Date(iso));
  return `${formatDay(iso)}, ${weekday}`;
}

function ExpensesViewScreen({ data, currency, initialPeriod, initialMonth, initialRange }: Props) {
  const sheets = useSheets();
  const [filter, setFilter] = useState<number | null>(null);
  const { categories, projects, today } = data;
  const { period, setPeriod, month, setMonth, custom, setCustom, span } = usePeriod(initialPeriod, initialMonth, today, initialRange, data.since);

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const txs = useMemo(() => data.transactions.filter((t) => t.currency === currency), [data.transactions, currency]);

  const view = useMemo(() => {
    const { from, to } = span;
    const inPeriod = txs.filter((t) => t.spent_at >= from && t.spent_at <= to);
    const total = inPeriod.reduce((s, t) => s + t.amount, 0);
    const buckets = spanBuckets(span, today, true);
    const sums = bucketize(txs, (t) => t.spent_at, (t) => t.amount, buckets);

    const byCat = new Map<number, number>();
    for (const t of inPeriod) {
      const id = catById.has(t.category_id ?? 0) ? t.category_id! : 0;
      byCat.set(id, (byCat.get(id) ?? 0) + t.amount);
    }
    const breakdown = [...byCat.entries()]
      .map(([id, sum]) => ({ category: catById.get(id) ?? UNCATEGORIZED, sum }))
      .sort((a, b) => b.sum - a.sum);

    return {
      total,
      count: inPeriod.length,
      average: total / span.months,
      breakdown,
      chart: buckets.map((b, i) => ({ key: b.key, short: b.short, full: b.full, values: [sums[i]] })),
    };
  }, [txs, span, today, catById]);

  // Нажатием на столбик выбирается месяц; при своих датах список показывает весь период.
  const selectable = span.monthly && !custom;
  const listMonth = selectable ? month : today.slice(0, 7);
  const listRange = custom ?? monthRange(listMonth);
  const listTitle = custom ? rangeLabel(custom, today) : ` ${listMonth.slice(0, 4)}`;
  const monthTxs = useMemo(() => {
    const { from, to } = listRange;
    return data.transactions.filter((t) => t.spent_at >= from && t.spent_at <= to);
  }, [data.transactions, listRange]);

  const days = useMemo(() => {
    const catOf = (t: Transaction) => (catById.has(t.category_id ?? 0) ? t.category_id! : 0);
    const visible = filter === null ? monthTxs : monthTxs.filter((t) => catOf(t) === filter);
    const groups = new Map<string, Transaction[]>();
    visible.forEach((t) => groups.set(t.spent_at, [...(groups.get(t.spent_at) ?? []), t]));
    return [...groups.entries()];
  }, [monthTxs, filter, catById]);

  const monthTotal = monthTxs.filter((t) => t.currency === currency).reduce((s, t) => s + t.amount, 0);
  const top = view.breakdown[0];
  const filtered = filter === null ? null : (catById.get(filter) ?? UNCATEGORIZED);

  return (
    <Page>
      {data.demo && <DemoBanner />}
      <PageHeader
        title="Расходы"
        subtitle={`${formatMoney(view.total, currency)} ${span.caption}`}
        actions={
          <>
            <PeriodControl period={period} onPeriod={setPeriod} custom={custom} onCustom={setCustom} today={today} />
            <button onClick={() => sheets.open({ kind: "tx", id: null, categoryId: filter })} className={`${primaryButton} max-lg:hidden`}>
              <Plus size={18} strokeWidth={2.4} /> Добавить расход
            </button>
          </>
        }
      />

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Stat i={0} label={`Расходы ${span.caption}`} value={<AnimatedMoney value={view.total} currency={currency} />} />
        <Stat i={1} label="В среднем за месяц" value={<AnimatedMoney value={Math.round(view.average)} currency={currency} />} />
        <Stat
          i={2}
          label="Больше всего на"
          value={top ? top.category.name : "—"}
          hint={top && view.total ? `${Math.round((top.sum / view.total) * 100)}%, ${formatMoney(top.sum, currency)}` : undefined}
        />
        <Stat i={3} label="Трат" value={<span className="tnum">{view.count}</span>} hint={view.count ? `средняя ${formatMoney(Math.round(view.total / view.count), currency)}` : undefined} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:mt-4 lg:grid-cols-12 lg:gap-4">
        <Tile i={4} className="p-4 lg:col-span-8 lg:p-5">
          <TileHeader title={span.monthly ? "Расходы по месяцам" : "Расходы по дням"} sub={selectable ? "нажмите на месяц, чтобы увидеть траты" : undefined} />
          <BarChart
            className="mt-5 h-[220px] lg:h-[260px]"
            data={view.chart}
            series={[{ label: "Расходы", color: "var(--expense)" }]}
            currency={currency}
            highlight
            selected={selectable ? month : null}
            onSelect={selectable ? setMonth : undefined}
          />
        </Tile>

        <Tile i={5} className="flex flex-col p-4 lg:col-span-4 lg:max-h-[364px] lg:p-5">
          <TileHeader title="Категории" sub={span.caption} />
          {view.breakdown.length ? (
            <ul className="thin-scrollbar mt-2 min-h-0 flex-1 overflow-y-auto">
              {view.breakdown.map(({ category, sum }) => {
                const on = filter === category.id;
                return (
                  <li key={category.id}>
                    <button
                      onClick={() => setFilter(on ? null : category.id)}
                      aria-pressed={on}
                      className={`press flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-all hover:bg-white/[0.06] ${on ? "bg-white/10" : ""} ${
                        filter !== null && !on ? "opacity-50" : ""
                      }`}
                    >
                      <CategoryIcon category={category} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="flex justify-between gap-2 text-sm">
                          <span className="truncate font-medium">{category.name}</span>
                          <span className="shrink-0 font-semibold tnum">{formatMoney(sum, currency)}</span>
                        </span>
                        <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/10">
                          <span className="grow-x block h-full rounded-full" style={{ width: `${(sum / view.total) * 100}%`, background: category.color }} />
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState icon={ReceiptText} title="За этот период трат нет" />
          )}
        </Tile>
      </div>

      <Tile i={6} className="mt-3 p-4 lg:mt-4 lg:p-5">
        <TileHeader
          title={`Траты, ${listTitle}`}
          sub={monthTxs.length ? `${monthTxs.length} ${plural(monthTxs.length, ["трата", "траты", "трат"])} на ${formatMoney(monthTotal, currency)}` : undefined}
        >
          {filtered && (
            <button
              onClick={() => setFilter(null)}
              className="press inline-flex items-center gap-1.5 rounded-full bg-white/10 py-1.5 pr-2.5 pl-3 text-sm font-medium transition-colors hover:bg-white/20"
            >
              {filtered.name}
              <X size={14} aria-label="Сбросить фильтр" />
            </button>
          )}
        </TileHeader>

        {days.length === 0 ? (
          <EmptyState icon={ReceiptText} title={filtered ? "В этой категории трат нет" : "В этом месяце трат нет"}>
            Добавьте расход кнопкой «+».
          </EmptyState>
        ) : (
          <div className="mt-1 grid grid-cols-1 gap-x-8 lg:grid-cols-2">
            {days.map(([day, list]) => (
              <section key={day} className="break-inside-avoid">
                <div className="flex items-baseline justify-between px-0 pt-3 pb-1 text-[13px] text-muted">
                  <h3 className="font-medium">{dayLabel(day, today)}</h3>
                  <span className="tnum">{formatMoney(list.filter((t) => t.currency === currency).reduce((s, t) => s + t.amount, 0), currency)}</span>
                </div>
                <ul>
                  {list.map((tx) => (
                    <ExpenseRow
                      key={tx.id}
                      tx={tx}
                      category={catById.get(tx.category_id ?? 0) ?? UNCATEGORIZED}
                      project={tx.project_id ? projectById.get(tx.project_id) : null}
                      onOpen={() => sheets.open({ kind: "tx", id: tx.id })}
                      showDate={false}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Tile>

      <Fab label="Добавить расход" onClick={() => sheets.open({ kind: "tx", id: null, categoryId: filter })}>
        <Plus size={24} strokeWidth={2.4} />
      </Fab>
      <SheetHost {...sheets} data={{ categories, projects, payments: data.payments, transactions: data.transactions, currency, today }} />
    </Page>
  );
}

export const ExpensesView = withAppData(ExpensesViewScreen);
