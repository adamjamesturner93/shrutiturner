import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { AboutPage } from "@/views/about";
import { buildPageMetadata } from "@/lib/content/metadata";
import { createPersonSchema, createWebPageSchema } from "@/lib/seo/structured-data";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("about", "About");
}

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          createWebPageSchema({
            name: "About Shruti Turner",
            path: "/about",
            type: "AboutPage",
          }),
          createPersonSchema(),
        ]}
      />
      <AboutPage />
    </>
  );
}
