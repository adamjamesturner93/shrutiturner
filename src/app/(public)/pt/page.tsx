import type { Metadata } from "next";
import { PTPage } from "@/views/pt";
import { buildPageMetadata } from "@/lib/content/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("pt", "Personal Training");
}

export default function Page() {
  return <PTPage />;
}
