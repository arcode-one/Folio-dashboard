"use client";

import { useProfessionId } from "@/lib/data";
import { getProfession, type Terms } from "@/lib/professions";

/** Слова интерфейса для выбранной профессии («Заказы», «Съёмки», «Ученики»…). */
export function useTerms(): Terms {
  return getProfession(useProfessionId()).terms;
}
