import type { Metadata } from "next";
import { NotesView } from "@/components/NotesView";

export const metadata: Metadata = { title: "Заметки" };

export default async function NotesPage({ searchParams }: PageProps<"/notes">) {
  const { new: isNew } = await searchParams;
  return <NotesView openNew={isNew === "1"} />;
}
