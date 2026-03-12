import type { Metadata } from "next";
import { SubscribePage } from "@/views/subscribe";

export const metadata: Metadata = { title: "Subscribe" };

export default function Page() {
  return <SubscribePage />;
}
