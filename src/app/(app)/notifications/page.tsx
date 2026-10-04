import type { Metadata } from "next";
import { NotificationsView } from "@/components/NotificationsView";
import { DEFAULT_CURRENCY } from "@/lib/env";

export const metadata: Metadata = { title: "Уведомления" };

export default function NotificationsPage() {
  return <NotificationsView currency={DEFAULT_CURRENCY} />;
}
