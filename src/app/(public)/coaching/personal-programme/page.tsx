import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/content/metadata";
import { CoachingPersonalProgrammePage } from "@/views/coaching-personal-programme";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("coaching-personal-programme", "Independent Training Plan");
}

export default function Page() {
  return <CoachingPersonalProgrammePage />;
}
