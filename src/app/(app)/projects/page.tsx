import type { Metadata } from "next";
import { ProjectsView } from "@/components/ProjectsView";
import { DEFAULT_CURRENCY } from "@/lib/env";
import { todayISO } from "@/lib/format";
import { parseMonth, parsePeriod, parseRange } from "@/lib/periods";

export const metadata: Metadata = { title: "Работа" };

export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  const { q, p, m, from, to } = await searchParams;
  const query = typeof q === "string" ? q : "";
  return (
    <ProjectsView
      key={query}
      currency={DEFAULT_CURRENCY}
      initialPeriod={parsePeriod(p)}
      initialMonth={parseMonth(m, todayISO())}
      initialRange={parseRange(from, to)}
      initialQuery={query}
    />
  );
}
