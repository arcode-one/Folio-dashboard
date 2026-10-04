import type { Metadata } from "next";
import { ProfitView } from "@/components/ProfitView";
import { DEFAULT_CURRENCY } from "@/lib/env";
import { parsePeriod, parseRange } from "@/lib/periods";

export const metadata: Metadata = { title: "Прибыль" };

export default async function ProfitPage({ searchParams }: PageProps<"/profit">) {
  const { p, from, to } = await searchParams;
  return <ProfitView currency={DEFAULT_CURRENCY} initialPeriod={parsePeriod(p)} initialRange={parseRange(from, to)} />;
}
