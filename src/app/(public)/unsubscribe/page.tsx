import type { Metadata } from "next";
import { UnsubscribePage } from "@/views/unsubscribe";

export const metadata: Metadata = { title: "Unsubscribe" };

export default function Page() {
  return <UnsubscribePage />;
}
