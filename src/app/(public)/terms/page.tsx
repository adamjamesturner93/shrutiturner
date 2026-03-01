import type { Metadata } from "next";
import { TermsPage } from "@/views/terms";

export const metadata: Metadata = { title: "Terms" };

export default function Page() {
  return <TermsPage />;
}
