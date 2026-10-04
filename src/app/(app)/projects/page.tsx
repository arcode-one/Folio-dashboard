import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectsRoute } from "@/components/routes";
import { PageSkeleton } from "@/components/WithData";

export const metadata: Metadata = { title: "Работа" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProjectsRoute />
    </Suspense>
  );
}
