import type { Metadata } from "next";
import { HomePage } from "@/views/home";
import { buildPageMetadata } from "@/lib/content/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("home", "Strength & Yoga for Complex Bodies");
}

export default function Page() {
  return <HomePage />;
}
