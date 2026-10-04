import type { Metadata } from "next";
import { ExpensesView } from "@/components/ExpensesView";
import { DEFAULT_CURRENCY } from "@/lib/env";
import { todayISO } from "@/lib/format";
import { parseMonth, parsePeriod, parseRange } from "@/lib/periods";

export const metadata: Metadata = { title: "Расходы" };

export default async function ExpensesPage({ searchParams }: PageProps<"/expenses">) {
  const { p, m, from, to } = await searchParams;
  return (
    <ExpensesView
      currency={DEFAULT_CURRENCY}
      initialPeriod={parsePeriod(p)}
      initialMonth={parseMonth(m, todayISO())}
      initialRange={parseRange(from, to)}
    />
  );
}
