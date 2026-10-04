import type { Metadata } from "next";
import { Suspense } from "react";
import { IncomeRoute } from "@/components/routes";
import { PageSkeleton } from "@/components/WithData";

export const metadata: Metadata = { title: "Доходы" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <IncomeRoute />
    </Suspense>
  );
}
