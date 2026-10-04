"use client";

import { Plus, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import type { AppData } from "@/lib/data";
import { formatMoney, monthRange } from "@/lib/format";
import { bucketize, monthName, rangeLabel, spanBuckets, type DateRange, type Period } from "@/lib/periods";
import { Page } from "./AppShell";
import { BarChart } from "./BarChart";
import { PeriodControl } from "./DateRangePicker";
import { usePeriod } from "./hooks";
import { ClientAvatar, PaymentRow } from "./Rows";
import { SheetHost, useSheets } from "./SheetHost";
import { useTerms } from "./terms";
import { withAppData } from "./WithData";
import { AnimatedMoney, DemoBanner, EmptyState, Fab, PageHeader, Stat, Tile, TileHeader, plural, primaryButton } from "./ui";

type Props = { data: AppData; currency: string; initialPeriod: Period; initialMonth: string | null; initialRange: DateRange | null };

function IncomeViewScreen({ data, currency, initialPeriod, initialMonth, initialRange }: Props) {
  const T = useTerms();
  const sheets = useSheets();
  const { projects, today } = data;
  const { period, setPeriod, month, setMonth, custom, setCustom, span } = usePeriod(initialPeriod, initialMonth, today, initialRange, data.since);
  const payments = useMemo(() => data.payments.filter((p) => p.currency === currency), [data.payments, currency]);
  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const view = useMemo(() => {
    const { from, to } = span;
    const inPeriod = payments.filter((p) => p.paid_at >= from && p.paid_at <= to);
    const total = inPeriod.reduce((s, p) => s + p.amount, 0);
    const buckets = spanBuckets(span, today, true);
    const sums = bucketize(payments, (p) => p.paid_at, (p) => p.amount, buckets);
    const monthly = span.monthly ? buckets.map((b, i) => ({ key: b.key, sum: sums[i] })) : [{ key: span.to.slice(0, 7), sum: total }];
    const best = monthly.reduce((a, b) => (b.sum > a.sum ? b : a), monthly[0]);

    const clients = new Map<string, number>();
    for (const p of inPeriod) {
      const name = p.project_id ? (projectById.get(p.project_id)?.client ?? `Без ${T.orderGen}`) : (p.note ?? `Без ${T.orderGen}`);
      clients.set(name, (clients.get(name) ?? 0) + p.amount);
    }
    const topClients = [...clients.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

    return {
      total,
      count: inPeriod.length,
      average: total / span.months,
      best,
      chart: buckets.map((b, i) => ({ key: b.key, short: b.short, full: b.full, values: [sums[i]] })),
      topClients,
    };
  }, [payments, span, today, projectById]);

  // Нажатием на столбик выбирается месяц; при своих датах список показывает весь период.
  const selectable = span.monthly && !custom;
  const listMonth = selectable ? month : today.slice(0, 7);
  const listRange = custom ?? monthRange(listMonth);
  const listTitle = custom ? rangeLabel(custom, today) : ` ${listMonth.slice(0, 4)}`;
  const monthList = useMemo(() => {
    const { from, to } = listRange;
    return data.payments.filter((p) => p.paid_at >= from && p.paid_at <= to);
  }, [data.payments, listRange]);
  const monthTotal = monthList.filter((p) => p.currency === currency).reduce((s, p) => s + p.amount, 0);
  const topMax = view.topClients[0]?.[1] ?? 1;

  return (
    <Page>
      {data.demo && <DemoBanner />}
      <PageHeader
        title="Доходы"
        subtitle={`${formatMoney(view.total, currency)} ${span.caption}`}
        actions={
          <>
            <PeriodControl period={period} onPeriod={setPeriod} custom={custom} onCustom={setCustom} today={today} />
            <button onClick={() => sheets.open({ kind: "payment", id: null })} className={`${primaryButton} max-lg:hidden`}>
              <Plus size={18} strokeWidth={2.4} /> Добавить доход
            </button>
          </>
        }
      />

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Stat i={0} label={`Доход ${span.caption}`} value={<AnimatedMoney value={view.total} currency={currency} />} accent />
        <Stat i={1} label="В среднем за месяц" value={<AnimatedMoney value={Math.round(view.average)} currency={currency} />} />
        <Stat
          i={2}
          label="Лучший месяц"
          value={formatMoney(view.best.sum, currency)}
          hint={view.best.sum > 0 ? `${monthName(view.best.key)} ${view.best.key.slice(0, 4)}` : "пока нет"}
        />
        <Stat i={3} label="Поступлений" value={<span className="tnum">{view.count}</span>} hint={view.count ? `средний чек ${formatMoney(Math.round(view.total / view.count), currency)}` : undefined} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:mt-4 lg:grid-cols-12 lg:gap-4">
        <Tile i={4} className="p-4 lg:col-span-8 lg:p-5">
          <TileHeader title={span.monthly ? "Доход по месяцам" : "Доход по дням"} sub={selectable ? "нажмите на месяц, чтобы увидеть оплаты" : undefined} />
          <BarChart
            className="mt-5 h-[220px] lg:h-[260px]"
            data={view.chart}
            series={[{ label: "Доход", color: "var(--accent)" }]}
            currency={currency}
            highlight
            selected={selectable ? month : null}
            onSelect={selectable ? setMonth : undefined}
          />
        </Tile>

        <Tile i={5} className="p-4 lg:col-span-4 lg:p-5">
          <TileHeader title="От кого" sub={span.caption} />
          {view.topClients.length ? (
            <ul className="mt-3 flex flex-col gap-3">
              {view.topClients.map(([name, sum]) => (
                <li key={name} className="flex items-center gap-3">
                  <ClientAvatar name={name} size="size-9" />
                  <span className="min-w-0 flex-1">
                    <span className="flex justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{name}</span>
                      <span className="shrink-0 font-semibold tnum">{formatMoney(sum, currency)}</span>
                    </span>
                    <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/10">
                      <span className="grow-x block h-full rounded-full bg-accent" style={{ width: `${(sum / topMax) * 100}%` }} />
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={TrendingUp} title="За этот период оплат нет" />
          )}
        </Tile>
      </div>

      <Tile i={6} className="mt-3 p-4 lg:mt-4 lg:p-5">
        <TileHeader
          title={`Оплаты, ${listTitle}`}
          sub={monthList.length ? `${monthList.length} ${plural(monthList.length, ["оплата", "оплаты", "оплат"])} на ${formatMoney(monthTotal, currency)}` : undefined}
        />
        {monthList.length ? (
          <ul className="mt-2 grid grid-cols-1 gap-x-8 lg:grid-cols-2">
            {monthList.map((p) => (
              <PaymentRow key={p.id} payment={p} project={p.project_id ? projectById.get(p.project_id) : null} onOpen={() => sheets.open({ kind: "payment", id: p.id })} />
            ))}
          </ul>
        ) : (
          <EmptyState icon={TrendingUp} title="В этом месяце оплат не было">
            Добавьте доход кнопкой «+».
          </EmptyState>
        )}
      </Tile>

      <Fab label="Добавить доход" onClick={() => sheets.open({ kind: "payment", id: null })}>
        <Plus size={24} strokeWidth={2.4} />
      </Fab>
      <SheetHost {...sheets} data={{ categories: data.categories, projects, payments: data.payments, transactions: data.transactions, currency, today }} />
    </Page>
  );
}

export const IncomeView = withAppData(IncomeViewScreen);
