import type { Metadata } from "next";
import { AboutPage } from "@/views/about";
import { buildPageMetadata } from "@/lib/content/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("about", "About");
}

export default function Page() {
  return <AboutPage />;
}
