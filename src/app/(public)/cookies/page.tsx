import type { Metadata } from "next";
import { CookiesPage } from "@/views/cookies";

export const metadata: Metadata = { title: "Cookies" };

export default function Page() {
  return <CookiesPage />;
}
