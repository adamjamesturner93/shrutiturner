import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "You\'ve Been Invited",
  robots: { index: false, follow: false },
};

export default function Page() {
  redirect("/coaching");
}
