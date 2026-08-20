import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginPageLoading } from "@/components/public-loading";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
};

export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<LoginPageLoading />}>
      <SignupRedirect searchParams={searchParams} />
    </Suspense>
  );
}

async function SignupRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) query.append(key, item);
      }
      continue;
    }
    if (value) {
      query.set(key, value);
    }
  }

  return redirect(query.toString() ? `/login?${query.toString()}` : "/login");
}
