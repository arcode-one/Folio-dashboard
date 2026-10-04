"use client";

import { useSearchParams } from "next/navigation";
import { DEFAULT_CURRENCY } from "@/lib/env";
import { todayISO } from "@/lib/format";
import { parseMonth, parsePeriod, parseRange } from "@/lib/periods";
import { Dashboard } from "./Dashboard";
import { ExpensesView } from "./ExpensesView";
import { IncomeView } from "./IncomeView";
import { NotesView } from "./NotesView";
import { ProfitView } from "./ProfitView";
import { ProjectsView } from "./ProjectsView";

// Сайт собирается в статику (GitHub Pages), поэтому параметры адреса (?p=&m=&from=&to=) читаются в браузере, а не на сервере.

function useParams() {
  const params = useSearchParams();
  const get = (key: string) => params.get(key) ?? undefined;
  return {
    period: parsePeriod(get("p")),
    month: parseMonth(get("m"), todayISO()),
    range: parseRange(get("from"), get("to")),
    get,
  };
}

export function OverviewRoute() {
  const { period, range } = useParams();
  return <Dashboard currency={DEFAULT_CURRENCY} initialPeriod={period} initialRange={range} />;
}

export function IncomeRoute() {
  const { period, month, range } = useParams();
  return <IncomeView currency={DEFAULT_CURRENCY} initialPeriod={period} initialMonth={month} initialRange={range} />;
}

export function ExpensesRoute() {
  const { period, month, range } = useParams();
  return <ExpensesView currency={DEFAULT_CURRENCY} initialPeriod={period} initialMonth={month} initialRange={range} />;
}

export function ProfitRoute() {
  const { period, range } = useParams();
  return <ProfitView currency={DEFAULT_CURRENCY} initialPeriod={period} initialRange={range} />;
}

export function ProjectsRoute() {
  const { period, month, range, get } = useParams();
  const query = get("q") ?? "";
  return (
    <ProjectsView
      key={query}
      currency={DEFAULT_CURRENCY}
      initialPeriod={period}
      initialMonth={month}
      initialRange={range}
      initialQuery={query}
    />
  );
}

export function NotesRoute() {
  const { get } = useParams();
  return <NotesView openNew={get("new") === "1"} />;
}
