import type { Metadata } from "next";
import { SignupPage } from "@/views/signup";

export const metadata: Metadata = {
  title: "Sign Up",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default function Page() {
  return <SignupPage />;
}
