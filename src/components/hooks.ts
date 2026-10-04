"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { makeSpan, type DateRange, type Period } from "@/lib/periods";

/**
 * Период (месяц/3/6/год или свои даты) и выбранный месяц. Данные за год уже загружены,
 * поэтому переключение мгновенное, а адрес обновляется без перехода — после обновления страницы выбор сохраняется.
 * Если свои даты начинаются раньше загруженных данных (`loadedFrom`), страница перезапрашивается с сервера.
 */
export function usePeriod(
  initialPeriod: Period,
  initialMonth: string | null,
  today: string,
  initialRange: DateRange | null = null,
  loadedFrom = "",
) {
  const router = useRouter();
  const current = today.slice(0, 7);
  const [period, setPeriodState] = useState(initialPeriod);
  const [month, setMonthState] = useState(initialMonth ?? current);
  const [custom, setCustomState] = useState<DateRange | null>(initialRange);

  const sync = useCallback(
    (p: Period, m: string, range: DateRange | null) => {
      const url = new URL(window.location.href);
      url.searchParams.set("p", String(p));
      if (m === current || range) url.searchParams.delete("m");
      else url.searchParams.set("m", m);
      if (range) {
        url.searchParams.set("from", range.from);
        url.searchParams.set("to", range.to);
      } else {
        url.searchParams.delete("from");
        url.searchParams.delete("to");
      }
      if (range && loadedFrom && range.from < loadedFrom) router.replace(`${url.pathname}${url.search}`, { scroll: false });
      else window.history.replaceState(null, "", url);
    },
    [current, loadedFrom, router],
  );

  const setPeriod = (p: Period) => {
    // Выбранный месяц должен попадать в новый период, иначе возвращаемся к текущему.
    const start = shiftBack(current, p - 1);
    const m = month >= start ? month : current;
    setPeriodState(p);
    setMonthState(m);
    setCustomState(null);
    sync(p, m, null);
  };

  const setMonth = (m: string) => {
    setMonthState(m);
    sync(period, m, custom);
  };

  const setCustom = (range: DateRange | null) => {
    setCustomState(range);
    setMonthState(current);
    sync(period, current, range);
  };

  const span = useMemo(() => makeSpan(period, custom, today), [period, custom, today]);

  return { period, setPeriod, month, setMonth, custom, setCustom, span };
}

function shiftBack(month: string, n: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 - n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
// ─── Прочитанные уведомления (в браузере, на каждом устройстве свои) ───

const SEEN_KEY = "seen-notices";
const EVENT = "seen-notices-change";
let cached: { raw: string | null; ids: Set<string> } = { raw: null, ids: new Set() };

function readSeen(): Set<string> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(SEEN_KEY);
  } catch {}
  if (raw !== cached.raw) {
    let ids: string[] = [];
    try {
      ids = raw ? (JSON.parse(raw) as string[]) : [];
    } catch {}
    cached = { raw, ids: new Set(ids) };
  }
  return cached.ids;
}

const EMPTY = new Set<string>();

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(EVENT, listener);
  };
}

export function useSeenNotices() {
  return useSyncExternalStore(subscribe, readSeen, () => EMPTY);
}

/** Запоминаем только актуальные id, чтобы список не рос бесконечно. */
export function markNoticesSeen(ids: string[]) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}
