import type { Metadata } from "next";
import { IncomeView } from "@/components/IncomeView";
import { DEFAULT_CURRENCY } from "@/lib/env";
import { todayISO } from "@/lib/format";
import { parseMonth, parsePeriod, parseRange } from "@/lib/periods";

export const metadata: Metadata = { title: "Доходы" };

export default async function IncomePage({ searchParams }: PageProps<"/income">) {
  const { p, m, from, to } = await searchParams;
  return (
    <IncomeView
      currency={DEFAULT_CURRENCY}
      initialPeriod={parsePeriod(p)}
      initialMonth={parseMonth(m, todayISO())}
      initialRange={parseRange(from, to)}
    />
  );
}
