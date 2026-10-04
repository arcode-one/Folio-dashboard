"use client";

import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { monthRange, shiftMonth } from "@/lib/format";
import { addDays, monthName, rangeLabel, type DateRange, type Period } from "@/lib/periods";
import { PeriodPicker, primaryButton, secondaryButton } from "./ui";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

/** Понедельник недели, в которую входит дата. */
function weekStart(iso: string) {
  const day = (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7;
  return addDays(iso, -day);
}

function presets(today: string): { label: string; range: DateRange }[] {
  const month = today.slice(0, 7);
  const monday = weekStart(today);
  const prev = monthRange(shiftMonth(month, -1));
  return [
    { label: "Эта неделя", range: { from: monday, to: today } },
    { label: "Прошлая неделя", range: { from: addDays(monday, -7), to: addDays(monday, -1) } },
    { label: "Этот месяц", range: { from: `${month}-01`, to: today } },
    { label: "Прошлый месяц", range: prev },
    { label: "30 дней", range: { from: addDays(today, -29), to: today } },
    { label: "С начала года", range: { from: `${today.slice(0, 4)}-01-01`, to: today } },
  ];
}

/**
 * Кнопка «свои даты» рядом с переключателем периода. Открывает календарь: первое нажатие — начало,
 * второе — конец периода. На телефоне календарь выезжает снизу, на ПК — всплывает под кнопкой.
 */
export function DateRangeButton({ value, onChange, today }: { value: DateRange | null; onChange: (r: DateRange | null) => void; today: string }) {
  // Кнопка, под которой открыт календарь; null — закрыт.
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="dialog"
        aria-expanded={!!anchor}
        aria-label={value ? `Период ${rangeLabel(value, today)}, изменить` : "Выбрать даты"}
        title="Выбрать даты"
        className={`press inline-flex h-11 shrink-0 items-center gap-2 rounded-full transition-colors ${
          value ? "bg-accent px-4 text-sm font-semibold text-accent-ink" : "w-11 justify-center bg-black/25 text-muted hover:text-ink"
        }`}
      >
        <CalendarDays size={18} aria-hidden />
        {value && <span className="whitespace-nowrap tnum">{rangeLabel(value, today)}</span>}
      </button>
      {anchor &&
        createPortal(
          <Calendar
            anchor={anchor}
            value={value}
            today={today}
            onClose={() => setAnchor(null)}
            onApply={(r) => {
              onChange(r);
              setAnchor(null);
            }}
          />,
          document.body,
        )}
    </>
  );
}

function Calendar({
  anchor,
  value,
  today,
  onClose,
  onApply,
}: {
  anchor: HTMLElement | null;
  value: DateRange | null;
  today: string;
  onClose: () => void;
  onApply: (r: DateRange | null) => void;
}) {
  const [from, setFrom] = useState<string | null>(value?.from ?? null);
  const [to, setTo] = useState<string | null>(value?.to ?? null);
  const [hover, setHover] = useState<string | null>(null);
  // Правый из двух показанных месяцев (на телефоне показывается только он)
  const [view, setView] = useState((value?.to ?? today).slice(0, 7));
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // На ПК ставим окно под кнопкой и не даём вылезти за край экрана.
  useLayoutEffect(() => {
    const el = panel.current;
    if (!el || !anchor || window.innerWidth < 640) return;
    const a = anchor.getBoundingClientRect();
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const left = Math.min(Math.max(16, a.right - w), window.innerWidth - w - 16);
    const below = a.bottom + 8;
    const top = below + h <= window.innerHeight - 16 ? below : Math.max(16, a.top - h - 8);
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [anchor, view]);

  function pick(day: string) {
    if (!from || to) {
      setFrom(day);
      setTo(null);
    } else if (day < from) {
      setTo(from);
      setFrom(day);
    } else {
      setTo(day);
    }
  }

  const end = to ?? (from && hover && hover >= from ? hover : null);
  const draft = from ? { from, to: to ?? from } : null;
  const current = today.slice(0, 7);

  return (
    <div className="fixed inset-0 z-50">
      <div className="backdrop absolute inset-0 bg-black/50 sm:bg-black/20" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Выбор периода"
        className="cal-sheet absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-[32px] border-t border-line bg-[#1c1f23] px-4 pt-2 pb-safe sm:inset-x-auto sm:bottom-auto sm:w-max sm:max-w-[calc(100vw-32px)] sm:rounded-[28px] sm:border sm:bg-[#1c1f23]/95 sm:p-5 sm:backdrop-blur-2xl"
        style={{ boxShadow: "0 30px 80px -20px rgb(0 0 0 / 0.7)" }}
      >
        <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-white/20 sm:hidden" aria-hidden />
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Период</h2>
          <button onClick={onClose} aria-label="Закрыть" className="press grid size-9 place-items-center rounded-full bg-white/10 text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <div className="no-scrollbar -mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {presets(today).map((p) => {
            const on = from === p.range.from && (to ?? from) === p.range.to;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setFrom(p.range.from);
                  setTo(p.range.to);
                  setView(p.range.to.slice(0, 7));
                }}
                className={`press shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${on ? "bg-ink text-bg" : "bg-white/[0.08] text-muted hover:text-ink"}`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex gap-6">
          {[shiftMonth(view, -1), view].map((m, i) => (
            <div key={m} className={i === 0 ? "hidden sm:block" : "w-full sm:w-auto"}>
              <div className="mb-2 flex h-9 items-center justify-between">
                <button
                  type="button"
                  onClick={() => setView(shiftMonth(view, -1))}
                  aria-label="Предыдущий месяц"
                  className={`press grid size-9 place-items-center rounded-full hover:bg-white/10 ${i === 1 ? "sm:invisible" : ""}`}
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="font-semibold">
                  {monthName(m)} {m.slice(0, 4)}
                </span>
                <button
                  type="button"
                  onClick={() => setView(shiftMonth(view, 1))}
                  disabled={view >= current}
                  aria-label="Следующий месяц"
                  className={`press grid size-9 place-items-center rounded-full hover:bg-white/10 disabled:opacity-30 ${i === 0 ? "invisible" : ""}`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <MonthGrid month={m} today={today} from={from} end={end} onPick={pick} onHover={setHover} />
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-4">
          <p className="text-sm text-muted tnum">
            {draft ? (to ? rangeLabel(draft, today) : `${rangeLabel(draft, today)} — выберите конец`) : "Выберите первый день"}
          </p>
          <div className="flex w-full gap-2 sm:w-auto">
            {value && (
              <button type="button" onClick={() => onApply(null)} className={`${secondaryButton} flex-1 sm:flex-none`}>
                Сбросить
              </button>
            )}
            <button type="button" disabled={!draft} onClick={() => draft && onApply(draft)} className={`${primaryButton} flex-1 sm:flex-none`}>
              Показать
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MonthGrid({
  month,
  today,
  from,
  end,
  onPick,
  onHover,
}: {
  month: string;
  today: string;
  from: string | null;
  end: string | null;
  onPick: (d: string) => void;
  onHover: (d: string | null) => void;
}) {
  const { from: first, to: last } = monthRange(month);
  const offset = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
  const days = Number(last.slice(8, 10));
  const cells: (string | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`)];

  return (
    <div className="grid w-full grid-cols-7 gap-y-1 sm:w-[308px]" onPointerLeave={() => onHover(null)}>
      {WEEKDAYS.map((w) => (
        <span key={w} className="grid h-8 place-items-center text-xs text-faint" aria-hidden>
          {w}
        </span>
      ))}
      {cells.map((d, i) => {
        if (!d) return <span key={`e${i}`} />;
        const future = d > today;
        const start = d === from;
        const finish = d === end;
        const inside = from && end && d > from && d < end;
        const edge = start || finish;
        const band = from && end && from !== end && (inside || edge);
        return (
          <span
            key={d}
            className={`relative h-11 ${band ? "bg-accent/20" : ""} ${band && (start || i % 7 === 0) ? "rounded-l-full" : ""} ${
              band && (finish || i % 7 === 6) ? "rounded-r-full" : ""
            }`}
          >
            <button
              type="button"
              disabled={future}
              onClick={() => onPick(d)}
              onPointerEnter={(e) => e.pointerType === "mouse" && onHover(d)}
              aria-label={d}
              aria-pressed={edge}
              className={`absolute inset-0 m-auto grid size-10 place-items-center sm:size-11 rounded-full text-[15px] transition-colors tnum disabled:text-white/20 ${
                edge ? "bg-accent font-semibold text-accent-ink" : inside ? "text-ink hover:bg-white/10" : "hover:bg-white/10"
              } ${d === today && !edge ? "ring-1 ring-white/40" : ""}`}
            >
              {Number(d.slice(8, 10))}
            </button>
          </span>
        );
      })}
    </div>
  );
}

/** Переключатель периода и кнопка своих дат рядом. */
export function PeriodControl({
  period,
  onPeriod,
  custom,
  onCustom,
  today,
}: {
  period: Period;
  onPeriod: (p: Period) => void;
  custom: DateRange | null;
  onCustom: (r: DateRange | null) => void;
  today: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <PeriodPicker value={period} onChange={onPeriod} dimmed={!!custom} />
      <DateRangeButton value={custom} onChange={onCustom} today={today} />
    </div>
  );
}