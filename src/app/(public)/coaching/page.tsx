import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/content/metadata";
import { CoachingPage } from "@/views/coaching";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("coaching", "Coaching");
}

export default function Page() {
  return <CoachingPage />;
}
