import { monthRange, shiftMonth } from "./format";

export type Period = 1 | 3 | 6 | 12;

export const PERIODS: { value: Period; label: string }[] = [
  { value: 1, label: "Месяц" },
  { value: 3, label: "3 мес" },
  { value: 6, label: "6 мес" },
  { value: 12, label: "Год" },
];

/** Сколько месяцев истории грузим на каждую вкладку: переключение периода работает без запроса к серверу. */
export const WINDOW_MONTHS = 12;

export function windowStart(today: string) {
  return monthRange(shiftMonth(today.slice(0, 7), -(WINDOW_MONTHS - 1))).from;
}

export function parsePeriod(value: string | string[] | undefined, fallback: Period = 1): Period {
  const n = Number(value);
  return n === 1 || n === 3 || n === 6 || n === 12 ? n : fallback;
}

/** Месяц YYYY-MM из адреса, если он в пределах загруженного окна. */
export function parseMonth(value: string | string[] | undefined, today: string): string | null {
  const current = today.slice(0, 7);
  if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) return null;
  return value <= current && value >= shiftMonth(current, -(WINDOW_MONTHS - 1)) ? value : null;
}

const SHORT = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
const FULL = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

export const monthShort = (month: string) => SHORT[Number(month.slice(5, 7)) - 1];
export const monthName = (month: string) => FULL[Number(month.slice(5, 7)) - 1];

export function periodCaption(period: Period, month: string) {
  if (period === 1) return `за ${monthName(month).toLowerCase()}`;
  if (period === 3) return "за 3 месяца";
  if (period === 6) return "за полгода";
  return "за год";
}

export type Bucket = { key: string; short: string; full: string; from: string; to: string };

/**
 * Столбики графика для периода, который заканчивается текущим месяцем.
 * Месяц — по дням (`fine`) или по неделям; 3, 6 и 12 месяцев — по месяцам.
 */
export function periodBuckets(period: Period, today: string, fine = true): Bucket[] {
  const current = today.slice(0, 7);
  if (period > 1) {
    return Array.from({ length: period }, (_, i) => {
      const m = shiftMonth(current, i - (period - 1));
      const { from, to } = monthRange(m);
      return { key: m, short: monthShort(m), full: `${monthName(m)} ${m.slice(0, 4)}`, from, to };
    });
  }
  const { to } = monthRange(current);
  const last = Number(to.slice(8, 10));
  const day = (d: number) => `${current}-${String(d).padStart(2, "0")}`;
  const genitive = monthShort(current);
  if (fine) {
    return Array.from({ length: last }, (_, i) => ({
      key: day(i + 1),
      short: String(i + 1),
      full: `${i + 1} ${genitive}`,
      from: day(i + 1),
      to: day(i + 1),
    }));
  }
  const starts = [1, 8, 15, 22, 29].filter((d) => d <= last);
  return starts.map((d, i) => {
    const end = i === starts.length - 1 ? last : starts[i + 1] - 1;
    return { key: day(d), short: `${d}–${end}`, full: `${d}–${end} ${genitive}`, from: day(d), to: day(end) };
  });
}

export function periodRange(period: Period, today: string) {
  const current = today.slice(0, 7);
  return { from: monthRange(shiftMonth(current, -(period - 1))).from, to: monthRange(current).to };
}

/** Суммы по столбикам. */
export function bucketize<T>(items: T[], date: (x: T) => string, value: (x: T) => number, buckets: Bucket[]) {
  const sums = buckets.map(() => 0);
  for (const item of items) {
    const d = date(item);
    const i = buckets.findIndex((b) => d >= b.from && d <= b.to);
    if (i >= 0) sums[i] += value(item);
  }
  return sums;
}

/** «12,5к», «1,2м» — для подписей осей. */
export function compactMoney(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 1_000_000) return `${sign}${(Math.round(abs / 100_000) / 10).toString().replace(".", ",")}м`;
  if (abs >= 1000) return `${sign}${(Math.round(abs / 100) / 10).toString().replace(".", ",")}к`;
  return `${sign}${Math.round(abs)}`;
}

// ─── Свой период «с … по …» ─────────────────────────────────────────────

export type DateRange = { from: string; to: string };

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

/** Даты from/to из адреса. Проверяем формат и порядок. */
export function parseRange(from: string | string[] | undefined, to: string | string[] | undefined): DateRange | null {
  if (typeof from !== "string" || typeof to !== "string" || !isoDate.test(from) || !isoDate.test(to)) return null;
  if (Number.isNaN(Date.parse(from)) || Number.isNaN(Date.parse(to))) return null;
  return from <= to ? { from, to } : { from: to, to: from };
}

const SHORT_GEN = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

/** «5 сен» или «5 сен 2025», если год не текущий. */
export function shortDay(iso: string, today: string) {
  const text = `${Number(iso.slice(8, 10))} ${SHORT_GEN[Number(iso.slice(5, 7)) - 1]}`;
  return iso.slice(0, 4) === today.slice(0, 4) ? text : `${text} ${iso.slice(0, 4)}`;
}

export function rangeLabel(r: DateRange, today: string) {
  return r.from === r.to ? shortDay(r.from, today) : `${shortDay(r.from, today)} – ${shortDay(r.to, today)}`;
}

/** Выбранный период: готовые границы, подпись и как дробить график. */
export type Span = {
  period: Period;
  custom: DateRange | null;
  from: string;
  to: string;
  /** Столбики по месяцам (иначе по дням или неделям) */
  monthly: boolean;
  /** Длина в месяцах — для «в среднем за месяц» */
  months: number;
  caption: string;
};

export function makeSpan(period: Period, custom: DateRange | null, today: string): Span {
  if (custom) {
    const days = daysBetween(custom.from, custom.to) + 1;
    return {
      period,
      custom,
      ...custom,
      monthly: days > 62,
      months: Math.max(1, days / 30.44),
      caption: custom.from === custom.to ? `за ${shortDay(custom.from, today)}` : `с ${shortDay(custom.from, today)} по ${shortDay(custom.to, today)}`,
    };
  }
  const { from, to } = periodRange(period, today);
  return { period, custom: null, from, to, monthly: period > 1, months: period, caption: periodCaption(period, today.slice(0, 7)) };
}

/** Столбики для периода: `fine` — по дням, иначе по неделям (когда период короткий). */
export function spanBuckets(span: Span, today: string, fine = true): Bucket[] {
  if (!span.custom) return periodBuckets(span.period, today, fine);
  const { from, to } = span;
  if (span.monthly) {
    const out: Bucket[] = [];
    for (let m = from.slice(0, 7); m <= to.slice(0, 7); m = shiftMonth(m, 1)) {
      const r = monthRange(m);
      out.push({ key: m, short: monthShort(m), full: `${monthName(m)} ${m.slice(0, 4)}`, from: r.from > from ? r.from : from, to: r.to < to ? r.to : to });
    }
    return out;
  }
  const step = fine ? 1 : 7;
  const out: Bucket[] = [];
  for (let d = from; d <= to; d = addDays(d, step)) {
    const end = step === 1 ? d : addDays(d, 6) < to ? addDays(d, 6) : to;
    out.push({
      key: d,
      short: step === 1 ? String(Number(d.slice(8, 10))) : `${Number(d.slice(8, 10))}–${Number(end.slice(8, 10))}`,
      full: step === 1 ? shortDay(d, today) : rangeLabel({ from: d, to: end }, today),
      from: d,
      to: end,
    });
  }
  return out;
}