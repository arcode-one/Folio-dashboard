"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";
import { riseDelay } from "./ui";

export type TrendPoint = { month: string; label: string; income: number; expenses: number };

function compact(n: number) {
  if (n >= 1000) return `${Math.round(n / 100) / 10}к`.replace(".", ",");
  return String(Math.round(n));
}

/** Доход (сплошные) и расходы (штриховка) по месяцам. Подсказка — при наведении или у выбранного месяца. */
export function TrendChart({ data, currency, selected }: { data: TrendPoint[]; currency: string; selected: string }) {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expenses]));
  const activeMonth = hover ?? selected;

  return (
    <figure className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <figcaption className="font-display text-lg font-semibold tracking-tight">Доход и расходы</figcaption>
        <div className="flex gap-4 text-sm text-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-accent" aria-hidden /> Доход
          </span>
          <span className="flex items-center gap-1.5">
            <span className="hatch size-3 rounded-full" aria-hidden /> Расходы
          </span>
        </div>
      </div>

      <div
        className="relative mt-9 flex h-[190px] items-end justify-between gap-1 lg:h-auto lg:min-h-[120px] lg:flex-1"
        aria-hidden
      >
        {data.map((d, i) => {
          const active = d.month === activeMonth;
          const top = Math.max(d.income, d.expenses) / max;
          return (
            <div
              key={d.month}
              onMouseEnter={() => setHover(d.month)}
              onMouseLeave={() => setHover(null)}
              className="relative flex h-full flex-1 items-end justify-center gap-1.5"
            >
              {active && (
                <div
                  className="pop-in pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 rounded-lg border border-line bg-surface px-2 py-1 text-center text-[11px] leading-tight font-semibold whitespace-nowrap shadow-md tnum"
                  style={{ bottom: `calc(${top * 100}% + 8px)` }}
                >
                  <span className="text-accent">+{compact(d.income)}</span>
                  <span className="text-muted"> / </span>
                  <span>−{compact(d.expenses)}</span>
                </div>
              )}
              <div
                className={`grow-y w-[min(22px,32%)] rounded-full bg-accent transition-opacity duration-200 ${
                  active || !hover ? "opacity-100" : "opacity-55"
                }`}
                style={{ height: `${Math.max(3, (d.income / max) * 100)}%`, ...riseDelay(i * 2) }}
              />
              <div
                className={`hatch grow-y w-[min(22px,32%)] rounded-full transition-opacity duration-200 ${
                  active || !hover ? "opacity-100" : "opacity-55"
                }`}
                style={{ height: `${Math.max(3, (d.expenses / max) * 100)}%`, ...riseDelay(i * 2 + 1) }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex justify-between gap-1 text-sm" aria-hidden>
        {data.map((d) => (
          <span
            key={d.month}
            className={`flex-1 text-center transition-colors ${d.month === activeMonth ? "font-semibold text-ink" : "text-muted"}`}
          >
            {d.label.slice(0, 3)}
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>Доход и расходы по месяцам</caption>
        <thead>
          <tr>
            <th>Месяц</th>
            <th>Доход</th>
            <th>Расходы</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <td>{d.label}</td>
              <td>{formatMoney(d.income, currency)}</td>
              <td>{formatMoney(d.expenses, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
