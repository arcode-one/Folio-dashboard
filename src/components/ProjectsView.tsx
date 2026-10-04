"use client";

import { BriefcaseBusiness, CalendarClock, ChevronRight, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { AppData } from "@/lib/data";
import { formatDay, formatMoney, monthRange } from "@/lib/format";
import { bucketize, monthName, rangeLabel, spanBuckets, type DateRange, type Period } from "@/lib/periods";
import { isActive, netPrice, profit, remaining } from "@/lib/projects";
import type { ProjectSummary } from "@/lib/types";
import { Page } from "./AppShell";
import { BarChart } from "./BarChart";
import { PeriodControl } from "./DateRangePicker";
import { usePeriod } from "./hooks";
import { ClientAvatar } from "./Rows";
import { SheetHost, useSheets } from "./SheetHost";
import { useTerms } from "./terms";
import { withAppData } from "./WithData";
import {
  AnimatedMoney,
  DemoBanner,
  EmptyState,
  Fab,
  PageHeader,
  ProgressBar,
  Stat,
  StatusBadge,
  Tile,
  TileHeader,
  plural,
  primaryButton,
} from "./ui";

type Scope = "month" | "active" | "all";

type Props = {
  data: AppData;
  currency: string;
  initialPeriod: Period;
  initialMonth: string | null;
  initialRange: DateRange | null;
  initialQuery: string;
};

const startedOn = (p: ProjectSummary) => p.created_at.slice(0, 10);

function ProjectsViewScreen({ data, currency, initialPeriod, initialMonth, initialRange, initialQuery }: Props) {
  const T = useTerms();
  const sheets = useSheets();
  const { projects, today } = data;
  const { period, setPeriod, month, setMonth, custom, setCustom, span } = usePeriod(initialPeriod, initialMonth, today, initialRange, data.since);
  const [scope, setScope] = useState<Scope>(initialQuery ? "all" : "month");
  const [query, setQuery] = useState(initialQuery);
  // Нажатием на столбик выбирается месяц; при своих датах список показывает весь период.
  const selectable = span.monthly && !custom;
  const listMonth = selectable ? month : today.slice(0, 7);
  const listRange = custom ?? monthRange(listMonth);

  const stats = useMemo(() => {
    const own = projects.filter((p) => p.currency === currency && p.status !== "cancelled");
    const { from, to } = span;
    const taken = own.filter((p) => startedOn(p) >= from && startedOn(p) <= to);
    const buckets = spanBuckets(span, today, true);
    const sums = bucketize(own, startedOn, (p) => p.price, buckets);
    const counts = bucketize(own, startedOn, () => 1, buckets);
    const sum = taken.reduce((s, p) => s + p.price, 0);
    return {
      taken: taken.length,
      sum,
      average: taken.length ? sum / taken.length : 0,
      waiting: own.reduce((s, p) => s + remaining(p), 0),
      chart: buckets.map((b, i) => ({ key: b.key, short: b.short, full: b.full, values: [sums[i]], count: counts[i] })),
    };
  }, [projects, span, today, currency]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = projects;
    if (q) list = list.filter((p) => `${p.client} ${p.title} ${p.platform ?? ""}`.toLowerCase().includes(q));
    else if (scope === "month") list = list.filter((p) => startedOn(p) >= listRange.from && startedOn(p) <= listRange.to);
    else if (scope === "active") list = list.filter(isActive);
    return [...list].sort((a, b) =>
      scope === "active" && !q ? (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999") : b.created_at.localeCompare(a.created_at),
    );
  }, [projects, scope, query, listRange]);

  const totals = useMemo(() => {
    const same = visible.filter((p) => p.currency === currency);
    const sum = (f: (p: ProjectSummary) => number) => same.reduce((s, p) => s + f(p), 0);
    return { price: sum((p) => p.price), received: sum((p) => p.received), remaining: sum(remaining), costs: sum((p) => p.costs), profit: sum(profit) };
  }, [visible, currency]);

  const m = (n: number) => formatMoney(n, currency);
  const openProject = (p: ProjectSummary) => sheets.open({ kind: "project", id: p.id });
  const monthLabel = `${monthName(listMonth)} ${listMonth.slice(0, 4)}`;
  const scopes: { id: Scope; label: string }[] = [
    { id: "month", label: custom ? rangeLabel(custom, today) : monthName(listMonth) },
    { id: "active", label: `${T.status.in_progress === "В работе" ? "В работе" : "Активные"} ${projects.filter(isActive).length}` },
    { id: "all", label: `Все ${projects.length}` },
  ];

  return (
    <Page>
      {data.demo && <DemoBanner />}
      <PageHeader
        title={T.orders}
        subtitle={`${stats.taken} ${plural(stats.taken, T.forms)} ${span.caption}`}
        actions={
          <>
            <PeriodControl
              period={period}
              onPeriod={setPeriod}
              custom={custom}
              onCustom={(r) => {
                setCustom(r);
                setScope("month");
                setQuery("");
              }}
              today={today}
            />
            <button onClick={() => sheets.open({ kind: "project", id: null })} className={`${primaryButton} max-lg:hidden`}>
              <Plus size={18} strokeWidth={2.4} /> {T.newOrder}
            </button>
          </>
        }
      />

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Stat i={0} label={`Новых ${span.caption}`} value={<span className="tnum">{stats.taken}</span>} hint={plural(stats.taken, T.forms)} />
        <Stat i={1} label="На сумму" value={<AnimatedMoney value={stats.sum} currency={currency} />} accent />
        <Stat i={2} label="Средний чек" value={<AnimatedMoney value={Math.round(stats.average)} currency={currency} />} />
        <Stat i={3} label="Ещё придёт" value={<AnimatedMoney value={stats.waiting} currency={currency} />} hint="по всем незакрытым" />
      </div>

      <Tile i={4} className="mt-3 p-4 lg:mt-4 lg:p-5">
        <TileHeader title={span.monthly ? `${T.orders} по месяцам` : `${T.orders} по дням`} sub={selectable ? "общая стоимость, нажмите на месяц" : "общая стоимость"} />
        <BarChart
          className="mt-5 h-[190px] lg:h-[210px]"
          data={stats.chart}
          series={[{ label: T.orders, color: "var(--accent)" }]}
          currency={currency}
          highlight
          selected={selectable ? month : null}
          onSelect={
            selectable
              ? (key) => {
                  setMonth(key);
                  setScope("month");
                  setQuery("");
                }
              : undefined
          }
          tooltip={(d) => {
            const count = stats.chart.find((x) => x.key === d.key)?.count ?? 0;
            return (
              <span className="mt-1 block text-muted">
                {count} {plural(count, T.forms)} на <span className="font-semibold text-ink tnum">{m(d.values[0])}</span>
              </span>
            );
          }}
        />
      </Tile>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Что показать" className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {scopes.map((s) => {
            const on = scope === s.id && !query;
            return (
              <button
                key={s.id}
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setScope(s.id);
                  setQuery("");
                }}
                className={`press shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${on ? "bg-ink text-bg" : "bg-white/[0.08] text-muted hover:text-ink"}`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <label className="flex h-11 items-center gap-2.5 rounded-full bg-white/[0.08] px-4 transition-shadow focus-within:shadow-[0_0_0_2px_var(--accent)] sm:w-72">
          <Search size={18} className="text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={T.search}
            aria-label="Поиск"
            className="w-full bg-transparent outline-none placeholder:text-faint"
          />
        </label>
      </div>

      {visible.length === 0 ? (
        <Tile className="mt-3">
          <EmptyState icon={BriefcaseBusiness} title={query ? "Ничего не нашлось" : scope === "month" ? (custom ? `За эти даты ${T.ordersGen} нет` : `В ${monthLabel.toLowerCase()} ${T.ordersGen} нет`) : "Здесь пока пусто"}>
            Нажмите «+», чтобы добавить {T.orderAcc}.
          </EmptyState>
        </Tile>
      ) : (
        <>
          {/* ПК: таблица */}
          <Tile i={5} className="thin-scrollbar mt-3 hidden overflow-x-auto lg:block">
            <table className="w-full text-sm [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap">
              <thead className="text-left text-[13px] text-muted">
                <tr className="border-b border-white/[0.08]">
                  <th className="py-3.5 pr-3 pl-5 font-normal">{T.order}</th>
                  <th className="px-3 py-3.5 font-normal">Статус</th>
                  <th className="px-3 py-3.5 font-normal">Взят</th>
                  <th className="px-3 py-3.5 text-right font-normal">Стоимость</th>
                  <th className="w-44 px-3 py-3.5 font-normal">Получено</th>
                  <th className="px-3 py-3.5 text-right font-normal">Ждём</th>
                  <th className="hidden px-3 py-3.5 text-right font-normal xl:table-cell">Затраты</th>
                  <th className="px-3 py-3.5 text-right font-normal">Прибыль</th>
                  <th className="w-10 pr-4" aria-hidden />
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id} onClick={() => openProject(p)} className="group cursor-pointer border-b border-white/[0.05] transition-colors last:border-0 hover:bg-white/[0.05]">
                    <td className="max-w-72 py-3 pr-3 pl-5">
                      <div className="flex items-center gap-3">
                        <ClientAvatar name={p.client} size="size-9" />
                        <div className="min-w-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openProject(p);
                            }}
                            className="block max-w-full truncate text-left font-semibold"
                          >
                            {p.client}
                          </button>
                          <span className="block truncate text-muted">
                            {p.title}
                            {p.platform && `, ${p.platform}`}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-3 py-3 text-muted">{formatDay(startedOn(p))}</td>
                    <td className="px-3 py-3 text-right tnum">{p.price ? m(p.price) : "—"}</td>
                    <td className="px-3 py-3">
                      <span className="font-medium tnum">{m(p.received)}</span>
                      {netPrice(p) > 0 && (
                        <div className="mt-1.5">
                          <ProgressBar value={p.received} max={netPrice(p)} label={`Оплачено: ${p.client}`} />
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right tnum">{remaining(p) ? m(remaining(p)) : "—"}</td>
                    <td className="hidden px-3 py-3 text-right text-muted tnum xl:table-cell">{p.costs ? m(p.costs) : "—"}</td>
                    <td className={`px-3 py-3 text-right font-semibold tnum ${profit(p) < 0 ? "text-danger" : ""}`}>{m(profit(p))}</td>
                    <td className="pr-4 text-muted">
                      <ChevronRight size={18} className="-translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/15 font-semibold">
                  <td className="py-4 pr-3 pl-5" colSpan={3}>
                    Итого, {visible.length} {plural(visible.length, T.forms)}
                  </td>
                  <td className="px-3 py-4 text-right tnum">{m(totals.price)}</td>
                  <td className="px-3 py-4 tnum">{m(totals.received)}</td>
                  <td className="px-3 py-4 text-right tnum">{m(totals.remaining)}</td>
                  <td className="hidden px-3 py-4 text-right text-muted tnum xl:table-cell">{m(totals.costs)}</td>
                  <td className="px-3 py-4 text-right tnum">{m(totals.profit)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </Tile>

          {/* Телефон и планшет: карточки */}
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
            {visible.map((p) => (
              <li key={p.id}>
                <button onClick={() => openProject(p)} className="press tile w-full p-4 text-left">
                  <div className="flex items-start gap-3">
                    <ClientAvatar name={p.client} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-semibold">{p.client}</p>
                        <StatusBadge status={p.status} />
                      </div>
                      <p className="truncate text-sm text-muted">{p.title}</p>
                    </div>
                  </div>
                  {netPrice(p) > 0 && (
                    <div className="mt-4">
                      <ProgressBar value={p.received} max={netPrice(p)} label={`Оплачено: ${p.client}`} />
                    </div>
                  )}
                  <div className="mt-2 flex justify-between gap-2 text-sm tnum">
                    <span className="truncate text-muted">
                      {m(p.received)}
                      {netPrice(p) > 0 && ` из ${m(netPrice(p))}`}
                    </span>
                    <span className="shrink-0 font-medium">{remaining(p) > 0 ? `ждём ${m(remaining(p))}` : `прибыль ${m(profit(p))}`}</span>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-[13px] text-muted">
                    {isActive(p) && p.deadline && <CalendarClock size={14} aria-hidden />}
                    {[`взят ${formatDay(startedOn(p))}`, p.platform, isActive(p) && p.deadline ? `до ${formatDay(p.deadline)}` : null].filter(Boolean).join(", ")}
                  </p>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-center text-sm text-muted lg:hidden tnum">
            Итого {visible.length} {plural(visible.length, T.forms)} на {m(totals.price)}, получено {m(totals.received)}
          </p>
        </>
      )}

      <Fab label={T.newOrder} onClick={() => sheets.open({ kind: "project", id: null })}>
        <Plus size={24} strokeWidth={2.4} />
      </Fab>
      <SheetHost {...sheets} data={{ categories: data.categories, projects, payments: data.payments, transactions: data.transactions, currency, today }} />
    </Page>
  );
}

export const ProjectsView = withAppData(ProjectsViewScreen);
