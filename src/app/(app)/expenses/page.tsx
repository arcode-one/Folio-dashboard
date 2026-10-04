import type { Metadata } from "next";
import { Suspense } from "react";
import { ExpensesRoute } from "@/components/routes";
import { PageSkeleton } from "@/components/WithData";

export const metadata: Metadata = { title: "Расходы" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ExpensesRoute />
    </Suspense>
  );
}
