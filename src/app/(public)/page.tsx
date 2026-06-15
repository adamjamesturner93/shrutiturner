import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { HomePage } from "@/views/home";
import { buildPageMetadata, buildSeoMetadata } from "@/lib/content/metadata";
import {
  createOrganizationSchema,
  createWebPageSchema,
  createWebSiteSchema,
} from "@/lib/seo/structured-data";
import { getExistingPlatformUrl, isHoldingStage } from "@/lib/site-stage";
import { HoldingPage } from "@/views/holding-page";
import { getBlogPosts, getTestimonials } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  if (isHoldingStage()) {
    return buildSeoMetadata({
      title: "Something new is coming",
      description:
        "A new home for evidence-based coaching and resources is launching in early summer 2026.",
      canonicalUrl: "https://shrutiturner.co.uk",
    });
  }

  return buildPageMetadata("home", "Science-backed movement coaching for adults with chronic illness, autoimmune conditions and recovering from injury");
}

export default async function Page() {
  if (isHoldingStage()) {
    return (
      <>
        <JsonLd
          data={createWebPageSchema({
            name: "Shruti Turner",
            path: "/",
            description:
              "A new home for evidence-based coaching and resources is launching in early summer 2026.",
          })}
        />
        <HoldingPage existingPlatformUrl={getExistingPlatformUrl()} />
      </>
    );
  }

  const [blogPosts, testimonials] = await Promise.all([getBlogPosts(), getTestimonials()]);
  const homepageTestimonials = testimonials
    .filter((testimonial) => testimonial.featured || testimonial.service === "general")
    .slice(0, 3);

  return (
    <>
      <JsonLd
        data={[
          createWebSiteSchema(),
          createOrganizationSchema(),
          createWebPageSchema({
            name: "Inclusive movement coaching",
            path: "/",
            description:
              "Science-backed movement coaching for adults with chronic illness, autoimmune conditions and recovering from injury.",
          }),
        ]}
      />
      <HomePage recentPosts={blogPosts.slice(0, 3)} testimonials={homepageTestimonials} />
    </>
  );
}
