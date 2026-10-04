"use client";

import { useState, type ReactNode } from "react";
import { formatMoney } from "@/lib/format";
import { compactMoney } from "@/lib/periods";
import { riseDelay } from "./ui";

export type BarSeries = { label: string; color: string };
export type BarDatum = { key: string; short: string; full: string; values: number[] };

const MUTED_BAR = "rgb(255 255 255 / 0.26)";

function niceStep(raw: number) {
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
}

function scale(values: number[]) {
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  if (max === 0 && min === 0) return { top: 4, bottom: 0, ticks: [0, 1, 2, 3, 4] };
  const step = niceStep((max - min) / 4 || 1);
  const top = Math.ceil(max / step) * step || step;
  const bottom = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let t = bottom; t <= top + step / 2; t += step) ticks.push(Math.round(t));
  return { top, bottom, ticks };
}

/**
 * Столбчатый график. `highlight` — одна серия: столбики серые, выбранный и наведённый — акцентного цвета (как в референсе).
 * Несколько серий — у каждой свой цвет. Отрицательные значения (прибыль) растут вниз и красные.
 */
export function BarChart({
  data,
  series,
  currency,
  selected,
  onSelect,
  highlight = false,
  tooltip,
  className = "h-[210px]",
}: {
  data: BarDatum[];
  series: BarSeries[];
  currency: string;
  selected?: string | null;
  onSelect?: (key: string) => void;
  highlight?: boolean;
  tooltip?: (d: BarDatum) => ReactNode;
  className?: string;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const { top, bottom, ticks } = scale(data.flatMap((d) => d.values));
  const range = top - bottom;
  const zero = (-bottom / range) * 100;
  const pct = (v: number) => (Math.abs(v) / range) * 100;
  const n = data.length;
  const dense = n > 14;
  const showLabel = (i: number) => !dense || i % 5 === 0 || i === n - 1;
  const active = hover ?? null;

  const barColor = (d: BarDatum, s: number, v: number) => {
    const isOn = d.key === selected || d.key === hover;
    if (v < 0) return isOn || !highlight ? "var(--danger)" : "rgb(255 59 95 / 0.45)";
    if (highlight) return isOn ? "var(--accent)" : MUTED_BAR;
    return series[s].color;
  };

  const money = (v: number) => formatMoney(v, currency);

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex min-h-0 flex-1">
        {/* Ось Y */}
        <div className="relative w-10 shrink-0 text-[11px] text-faint tnum" aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="absolute right-2 translate-y-1/2" style={{ bottom: `${((t - bottom) / range) * 100}%` }}>
              {compactMoney(t)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {ticks.map((t) => (
            <div
              key={t}
              className={`absolute inset-x-0 border-t ${t === 0 ? "border-white/20" : "border-dashed border-white/[0.07]"}`}
              style={{ bottom: `${((t - bottom) / range) * 100}%` }}
              aria-hidden
            />
          ))}

          <div className="absolute inset-0 flex">
            {data.map((d, i) => {
              const dim = !highlight && selected && d.key !== selected && d.key !== hover;
              const positive = Math.max(0, ...d.values);
              const label = `${d.full}: ${series.map((s, si) => `${s.label} ${money(d.values[si])}`).join(", ")}`;
              return (
                <button
                  key={d.key}
                  type="button"
                  aria-label={label}
                  aria-pressed={selected ? d.key === selected : undefined}
                  onPointerEnter={(e) => e.pointerType === "mouse" && setHover(d.key)}
                  onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}
                  onClick={() => {
                    setHover((h) => (h === d.key && !onSelect ? null : d.key));
                    onSelect?.(d.key);
                  }}
                  onBlur={() => setHover(null)}
                  className={`relative h-full min-w-0 flex-1 outline-offset-0 ${onSelect ? "cursor-pointer" : "cursor-default"}`}
                >
                  <span
                    className={`absolute inset-0 flex justify-center transition-opacity duration-200 ${dense ? "gap-px" : "gap-[3px]"} ${
                      dim ? "opacity-45" : ""
                    }`}
                  >
                    {d.values.map((v, s) => (
                      <span key={s} className="relative h-full" style={{ width: series.length > 1 ? "min(12px, 30%)" : dense ? "62%" : "min(16px, 55%)" }}>
                        <span
                          className={`grow-y absolute inset-x-0 rounded-full transition-colors duration-200 ${v < 0 ? "grow-y-down" : ""}`}
                          style={{
                            bottom: v < 0 ? `${zero - pct(v)}%` : `${zero}%`,
                            height: v === 0 ? "3px" : `max(4px, ${pct(v)}%)`,
                            background: v === 0 ? "rgb(255 255 255 / 0.14)" : barColor(d, s, v),
                            ...riseDelay(Math.min(i, 20)),
                          }}
                        />
                      </span>
                    ))}
                  </span>

                  {active === d.key && (
                    <span
                      className={`pop-in pointer-events-none absolute z-20 rounded-xl border border-line bg-[#15181b]/95 px-3 py-2 text-left text-xs whitespace-nowrap shadow-xl ${
                        i < 2 ? "left-0" : i > n - 3 ? "right-0" : "left-1/2 -translate-x-1/2"
                      }`}
                      style={{ bottom: `calc(${zero + pct(positive)}% + 10px)`, transformOrigin: "bottom center" }}
                    >
                      <span className="block font-semibold text-ink">{d.full}</span>
                      {tooltip ? (
                        tooltip(d)
                      ) : (
                        series.map((s, si) => (
                          <span key={s.label} className="mt-1 flex items-center gap-2 text-muted">
                            <span className="size-2 rounded-full" style={{ background: highlight ? "var(--accent)" : s.color }} />
                            {s.label}
                            <span className="ml-auto pl-3 font-semibold text-ink tnum">{money(d.values[si])}</span>
                          </span>
                        ))
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ось X */}
      <div className="mt-2 flex pl-10 text-[11px] sm:text-xs" aria-hidden>
        {data.map((d, i) => {
          const on = d.key === selected || d.key === hover;
          return (
            <span
              key={d.key}
              className={`min-w-0 flex-1 text-center whitespace-nowrap transition-colors ${on ? "font-semibold text-ink" : "text-faint"}`}
            >
              {showLabel(i) || on ? d.short : ""}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: it.color }} aria-hidden />
          {it.label}
        </span>
      ))}
    </div>
  );
}
