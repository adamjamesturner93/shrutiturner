import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (typeof params.ref === "string" && params.ref) {
    query.set("ref", params.ref);
  }
  redirect(query.toString() ? `/login?${query.toString()}` : "/login");
}
