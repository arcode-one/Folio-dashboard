"use client";

import { BriefcaseBusiness } from "lucide-react";
import { useMemo } from "react";
import type { AppData } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { bucketize, monthName, spanBuckets, type DateRange, type Period } from "@/lib/periods";
import { profit } from "@/lib/projects";
import { Page } from "./AppShell";
import { BarChart } from "./BarChart";
import { PeriodControl } from "./DateRangePicker";
import { usePeriod } from "./hooks";
import { ClientAvatar } from "./Rows";
import { SheetHost, useSheets } from "./SheetHost";
import { useTerms } from "./terms";
import { withAppData } from "./WithData";
import { AnimatedMoney, DemoBanner, EmptyState, PageHeader, Stat, Tile, TileHeader } from "./ui";

type Props = { data: AppData; currency: string; initialPeriod: Period; initialRange: DateRange | null };

const margin = (income: number, net: number) => (income > 0 ? `${Math.round((net / income) * 100)}%` : "—");

function ProfitViewScreen({ data, currency, initialPeriod, initialRange }: Props) {
  const T = useTerms();
  const sheets = useSheets();
  const { today, projects } = data;
  const { period, setPeriod, custom, setCustom, span } = usePeriod(initialPeriod, null, today, initialRange, data.since);

  const view = useMemo(() => {
    const payments = data.payments.filter((p) => p.currency === currency);
    const txs = data.transactions.filter((t) => t.currency === currency);
    const buckets = spanBuckets(span, today, false);
    const inc = bucketize(payments, (p) => p.paid_at, (p) => p.amount, buckets);
    const exp = bucketize(txs, (t) => t.spent_at, (t) => t.amount, buckets);
    const rows = buckets.map((b, i) => ({ ...b, income: inc[i], expenses: exp[i], net: inc[i] - exp[i] }));
    const income = inc.reduce((s, x) => s + x, 0);
    const expenses = exp.reduce((s, x) => s + x, 0);
    const best = rows.reduce((a, b) => (b.net > a.net ? b : a), rows[0]);

    const { from, to } = span;
    const done = projects
      .filter((p) => p.status === "done" && p.currency === currency && (p.completed_at ?? "") >= from && (p.completed_at ?? "") <= to)
      .sort((a, b) => profit(b) - profit(a));

    return { rows, income, expenses, net: income - expenses, best, done };
  }, [data.payments, data.transactions, projects, span, today, currency]);

  const weekly = !span.monthly;
  const unit = weekly ? "неделю" : "месяц";
  const multiYear = span.from.slice(0, 4) !== span.to.slice(0, 4);

  return (
    <Page>
      {data.demo && <DemoBanner />}
      <PageHeader
        title="Прибыль"
        subtitle={`Доход минус все расходы ${span.caption}`}
        actions={<PeriodControl period={period} onPeriod={setPeriod} custom={custom} onCustom={setCustom} today={today} />}
      />

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Stat i={0} label={`Прибыль ${span.caption}`} value={<AnimatedMoney value={view.net} currency={currency} />} accent={view.net > 0} />
        <Stat i={1} label={`В среднем за ${unit}`} value={<AnimatedMoney value={Math.round(view.net / view.rows.length)} currency={currency} />} />
        <Stat i={2} label="Маржа" value={margin(view.income, view.net)} hint={`доход ${formatMoney(view.income, currency)}`} />
        <Stat i={3} label={weekly ? "Лучшая неделя" : "Лучший месяц"} value={formatMoney(view.best.net, currency)} hint={view.best.full} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:mt-4 lg:grid-cols-12 lg:gap-4">
        <Tile i={4} className="p-4 lg:col-span-7 lg:p-5">
          <TileHeader title={weekly ? "Прибыль по неделям" : "Прибыль по месяцам"} sub="ниже нуля — ушли в минус" />
          <BarChart
            className="mt-5 h-[230px] lg:h-[280px]"
            data={view.rows.map((r) => ({ key: r.key, short: r.short, full: r.full, values: [r.net] }))}
            series={[{ label: "Прибыль", color: "rgb(243 245 241 / 0.8)" }]}
            currency={currency}
            tooltip={(d) => {
              const r = view.rows.find((x) => x.key === d.key)!;
              return (
                <span className="mt-1 grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-muted">
                  <span>Доход</span>
                  <span className="text-right text-ink tnum">{formatMoney(r.income, currency)}</span>
                  <span>Расходы</span>
                  <span className="text-right text-ink tnum">{formatMoney(r.expenses, currency)}</span>
                  <span>Прибыль</span>
                  <span className={`text-right font-semibold tnum ${r.net < 0 ? "text-danger" : "text-ink"}`}>{formatMoney(r.net, currency)}</span>
                </span>
              );
            }}
          />
        </Tile>

        <Tile i={5} className="p-4 lg:col-span-5 lg:p-5">
          <TileHeader title={weekly ? "По неделям" : "По месяцам"} />
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-[13px] text-muted">
              <tr>
                <th className="pb-2 font-normal">{weekly ? "Неделя" : "Месяц"}</th>
                <th className="hidden pb-2 text-right font-normal sm:table-cell">Доход</th>
                <th className="hidden pb-2 text-right font-normal sm:table-cell">Расходы</th>
                <th className="pb-2 text-right font-normal">Прибыль</th>
                <th className="w-14 pb-2 text-right font-normal">Маржа</th>
              </tr>
            </thead>
            <tbody>
              {[...view.rows].reverse().map((r) => (
                <tr key={r.key} className="border-t border-white/[0.07]">
                  <td className="py-2.5">
                    <span className="font-medium">{weekly ? r.short : monthName(r.key)}</span>
                    {!weekly && multiYear && <span className="text-muted"> {r.key.slice(2, 4)}</span>}
                    <span className="block text-xs text-muted sm:hidden tnum">
                      +{formatMoney(r.income, currency)}, −{formatMoney(r.expenses, currency)}
                    </span>
                  </td>
                  <td className="hidden py-2.5 text-right tnum sm:table-cell">{formatMoney(r.income, currency)}</td>
                  <td className="hidden py-2.5 text-right text-muted tnum sm:table-cell">{formatMoney(r.expenses, currency)}</td>
                  <td className={`py-2.5 text-right font-semibold tnum ${r.net < 0 ? "text-danger" : ""}`}>{formatMoney(r.net, currency)}</td>
                  <td className="py-2.5 text-right text-muted tnum">{margin(r.income, r.net)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/20 font-semibold">
                <td className="pt-3">Итого</td>
                <td className="hidden pt-3 text-right tnum sm:table-cell">{formatMoney(view.income, currency)}</td>
                <td className="hidden pt-3 text-right tnum sm:table-cell">{formatMoney(view.expenses, currency)}</td>
                <td className={`pt-3 text-right tnum ${view.net < 0 ? "text-danger" : "text-ink"}`}>{formatMoney(view.net, currency)}</td>
                <td className="pt-3 text-right tnum">{margin(view.income, view.net)}</td>
              </tr>
            </tfoot>
          </table>
        </Tile>
      </div>

      <Tile i={6} className="mt-3 p-4 lg:mt-4 lg:p-5">
        <TileHeader title={T.doneProfit} sub={span.caption} />
        {view.done.length ? (
          <ul className="mt-2 grid grid-cols-1 gap-x-8 lg:grid-cols-2">
            {view.done.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => sheets.open({ kind: "project", id: p.id })}
                  className="-mx-2 flex w-[calc(100%+16px)] items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
                >
                  <ClientAvatar name={p.client} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.client}</span>
                    <span className="block truncate text-[13px] text-muted">
                      получено {formatMoney(p.received, p.currency)}
                      {p.costs > 0 && `, затраты ${formatMoney(p.costs, p.currency)}`}
                    </span>
                  </span>
                  <span className={`shrink-0 font-semibold tnum ${profit(p) < 0 ? "text-danger" : ""}`}>{formatMoney(profit(p), p.currency)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={BriefcaseBusiness} title={`За этот период ${T.doneGen} нет`} />
        )}
      </Tile>

      <SheetHost {...sheets} data={{ categories: data.categories, projects, payments: data.payments, transactions: data.transactions, currency, today }} />
    </Page>
  );
}

export const ProfitView = withAppData(ProfitViewScreen);
