import { Suspense } from "react";
import { OverviewRoute } from "@/components/routes";
import { PageSkeleton } from "@/components/WithData";

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OverviewRoute />
    </Suspense>
  );
}
