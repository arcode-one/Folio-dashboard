"use client";

import { useSyncExternalStore } from "react";
import type { ProfessionId } from "./professions";
import { getProfessionSnapshot, getSnapshot, subscribe } from "./store";
import type { Category, Note, Payment, ProjectSummary, Transaction } from "./types";

export type AppData = {
  demo: boolean;
  profession: ProfessionId;
  today: string;
  /** С какой даты загружены расходы и оплаты (в демо загружено всё — пустая строка) */
  since: string;
  categories: Category[];
  projects: ProjectSummary[];
  payments: Payment[];
  transactions: Transaction[];
  /** null — заметки недоступны */
  notes: Note[] | null;
  /** План дохода на месяц; null — не задан */
  goal: number | null;
  settingsReady: boolean;
};

/**
 * Все данные кабинета из браузерного хранилища. На сервере, при первой отрисовке и пока не выбрана профессия — null
 * (показываем заглушку), сразу после гидрации — данные; любые правки перерисовывают подписчиков.
 */
export function useAppData(): AppData | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

/** undefined — на сервере (ещё неизвестно), null — профессия не выбрана. */
export function useProfessionId(): ProfessionId | null | undefined {
  return useSyncExternalStore(subscribe, getProfessionSnapshot, () => undefined);
}
