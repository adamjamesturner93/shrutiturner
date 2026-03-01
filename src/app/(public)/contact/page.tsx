import type { Metadata } from "next";
import { ContactPage } from "@/views/contact";
import { buildPageMetadata } from "@/lib/content/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("contact", "Contact");
}

export default function Page() {
  return <ContactPage />;
}
