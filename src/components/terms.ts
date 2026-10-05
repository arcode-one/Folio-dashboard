"use client";

import { useAppData } from "@/lib/data";
import { getProfession, type Terms } from "@/lib/professions";

/** Слова интерфейса для профессии, чьи данные на экране («Заказы», «Съёмки», «Ученики»…). */
export function useTerms(): Terms {
  return getProfession(useAppData()?.profession).terms;
}
