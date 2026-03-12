import type { Metadata } from "next";
import { LoginPage } from "@/views/login";

export const metadata: Metadata = {
  title: "Login",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <LoginPage />;
}
