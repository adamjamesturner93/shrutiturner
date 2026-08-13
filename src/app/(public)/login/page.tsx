import type { Metadata } from "next";
import { LoginPage } from "@/views/login";

export const metadata: Metadata = {
  title: { absolute: "Private Studio Login | Shruti Turner" },
  description: "Sign in to your private Shruti Turner coaching studio.",
  alternates: { canonical: "https://shrutiturner.co.uk/login" },
  robots: { index: false, follow: true },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const getValue = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] || null : value || null;
  };

  return (
    <LoginPage
      redirectTo={getValue("redirect")}
      intent={getValue("intent")}
      refCode={getValue("ref")}
    />
  );
}
