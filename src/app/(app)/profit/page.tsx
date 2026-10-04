import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfitRoute } from "@/components/routes";
import { PageSkeleton } from "@/components/WithData";

export const metadata: Metadata = { title: "Прибыль" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProfitRoute />
    </Suspense>
  );
}
