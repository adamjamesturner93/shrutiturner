import "server-only";
import { getEntries } from "./contentful-client";
import {
  normalizeTestimonialPlacement,
  selectApprovedTestimonials,
  type TestimonialPlacement,
} from "./testimonial-policy";
import type { TestimonialContent } from "./types";

export async function getApprovedTestimonials(
  placement: TestimonialPlacement,
  ids?: string[]
): Promise<TestimonialContent[]> {
  if (ids && !ids.length) return [];
  const response = await getEntries<Record<string, unknown>>("testimonial", {
    limit: 1000,
    ...(ids ? { "sys.id[in]": [...new Set(ids)].slice(0, 3).join(",") } : {}),
  }).catch(() => {
    console.warn("Contentful testimonials are unavailable; omitting optional quotes.");
    return null;
  });
  const quotes = (response?.items || []).map((item) => ({
    id: String(item.sys.id),
    quote: String(item.fields.quote || ""),
    authorName: String(item.fields.authorName || ""),
    contextLabel: String(item.fields.contextLabel || ""),
    featured: Boolean(item.fields.featured),
    approvedPlacements: Array.isArray(item.fields.approvedPlacements)
      ? item.fields.approvedPlacements.flatMap((value) => {
          const placement = normalizeTestimonialPlacement(value);
          return placement ? [placement] : [];
        })
      : [],
  }));
  return selectApprovedTestimonials(quotes, placement, ids);
}

export async function getRetreatOverviewTestimonials() {
  const selection = await getEntries<Record<string, unknown>>("testimonialSelection", {
    "fields.slug": "retreats-overview",
    limit: 1,
  }).catch(() => {
    console.warn(
      "Contentful retreat testimonial selection is unavailable; omitting optional quotes."
    );
    return null;
  });
  const references = selection?.items[0]?.fields.testimonials;
  const ids = Array.isArray(references)
    ? references.flatMap((ref) => {
        const id = (ref as { sys?: { id?: unknown } })?.sys?.id;
        return typeof id === "string" ? [id] : [];
      })
    : [];
  return getApprovedTestimonials("retreats-overview", ids);
}
