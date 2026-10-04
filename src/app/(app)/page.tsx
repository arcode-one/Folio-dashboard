import { Dashboard } from "@/components/Dashboard";
import { DEFAULT_CURRENCY } from "@/lib/env";
import { parsePeriod, parseRange } from "@/lib/periods";

export default async function OverviewPage({ searchParams }: PageProps<"/">) {
  const { p, from, to } = await searchParams;
  return <Dashboard currency={DEFAULT_CURRENCY} initialPeriod={parsePeriod(p)} initialRange={parseRange(from, to)} />;
}
