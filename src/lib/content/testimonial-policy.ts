import type { TestimonialContent } from "./types";

export type TestimonialPlacement =
  | "home"
  | "coaching"
  | "classes"
  | "retreats-overview"
  | "event-page";

export function normalizeTestimonialPlacement(value: unknown): TestimonialPlacement | null {
  switch (value) {
    case "Home":
    case "home":
      return "home";
    case "Coaching":
    case "coaching":
      return "coaching";
    case "Retreats General":
    case "retreats-overview":
      return "retreats-overview";
    case "Retreat":
    case "event-page":
      return "event-page";
    case "classes":
      return "classes";
    default:
      return null;
  }
}

export function selectApprovedTestimonials(
  testimonials: TestimonialContent[],
  placement: TestimonialPlacement,
  ids?: string[]
) {
  const approved = testimonials.filter(
    (item) =>
      item.quote.trim() && item.authorName.trim() && item.approvedPlacements?.includes(placement)
  );
  if (!ids) return approved;
  const byId = new Map(approved.map((item) => [item.id, item]));
  return [...new Set(ids)].flatMap((id) => (byId.has(id) ? [byId.get(id)!] : [])).slice(0, 3);
}
