import type { Metadata } from "next";
import { LoginPage } from "@/views/login";

export const metadata: Metadata = {
  title: "Login",
  robots: { index: false, follow: false },
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
