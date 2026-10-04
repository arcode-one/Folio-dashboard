import type { Metadata } from "next";
import { ProfileView } from "@/components/ProfileView";
import { DEFAULT_CURRENCY } from "@/lib/env";

export const metadata: Metadata = { title: "Профиль" };

export default function ProfilePage() {
  return <ProfileView currency={DEFAULT_CURRENCY} />;
}
