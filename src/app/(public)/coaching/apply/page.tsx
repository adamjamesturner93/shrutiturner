import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/content/metadata";
import { CoachingApplyPage } from "@/views/coaching-apply";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("coaching-apply", "Enquire About Coaching");
}

export default function Page() {
  return <CoachingApplyPage />;
}
