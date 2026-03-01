import type { Metadata } from "next";
import { PrivacyPage } from "@/views/privacy";

export const metadata: Metadata = { title: "Privacy" };

export default function Page() {
  return <PrivacyPage />;
}
