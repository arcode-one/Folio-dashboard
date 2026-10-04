import type { Metadata } from "next";
import { Suspense } from "react";
import { NotesRoute } from "@/components/routes";
import { PageSkeleton } from "@/components/WithData";

export const metadata: Metadata = { title: "Заметки" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NotesRoute />
    </Suspense>
  );
}
