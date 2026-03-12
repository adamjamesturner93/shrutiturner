import type { Metadata } from "next";
import { SubscribePage } from "@/views/subscribe";

export const metadata: Metadata = { title: "Subscribe" };
export const dynamic = "force-dynamic";

export default function Page() {
  return <SubscribePage />;
}
