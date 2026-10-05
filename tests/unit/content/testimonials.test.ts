import { beforeEach, describe, expect, it, vi } from "vitest";
import { selectApprovedTestimonials } from "@/lib/content/testimonial-policy";
import type { TestimonialContent } from "@/lib/content/types";
const { getEntries } = vi.hoisted(() => ({ getEntries: vi.fn() }));
vi.mock("@/lib/content/contentful-client", () => ({ getEntries }));
import {
  getApprovedTestimonials,
  getRetreatOverviewTestimonials,
} from "@/lib/content/testimonials";
const quote = (
  id: string,
  approvedPlacements: TestimonialContent["approvedPlacements"]
): TestimonialContent => ({ id, quote: `Quote ${id}`, authorName: "Attendee", approvedPlacements });

describe("curated testimonial placements", () => {
  beforeEach(() => getEntries.mockReset());
  it("maps editor labels to the correct areas without accepting unknown values", async () => {
    getEntries.mockResolvedValue({
      items: [
        {
          sys: { id: "home" },
          fields: { quote: "Home quote", authorName: "A", approvedPlacements: ["Home"] },
        },
        {
          sys: { id: "retreat" },
          fields: {
            quote: "Retreat quote",
            authorName: "B",
            approvedPlacements: ["Retreat", "Retreats General", "Unknown"],
          },
        },
        {
          sys: { id: "coaching" },
          fields: { quote: "Coaching quote", authorName: "C", approvedPlacements: ["Coaching"] },
        },
      ],
    });
    expect((await getApprovedTestimonials("home")).map((item) => item.id)).toEqual(["home"]);
    expect((await getApprovedTestimonials("event-page")).map((item) => item.id)).toEqual([
      "retreat",
    ]);
    expect((await getApprovedTestimonials("retreats-overview")).map((item) => item.id)).toEqual([
      "retreat",
    ]);
    expect((await getApprovedTestimonials("coaching")).map((item) => item.id)).toEqual([
      "coaching",
    ]);
  });
  it("does not leak event quotes into home, coaching or overview; explicit multi-area reuse is allowed", () => {
    const items = [
      quote("event", ["event-page"]),
      quote("shared", ["event-page", "retreats-overview"]),
      quote("legacy", undefined),
    ];
    expect(selectApprovedTestimonials(items, "home")).toEqual([]);
    expect(selectApprovedTestimonials(items, "coaching")).toEqual([]);
    expect(selectApprovedTestimonials(items, "retreats-overview").map((x) => x.id)).toEqual([
      "shared",
    ]);
    expect(
      selectApprovedTestimonials(items, "event-page", ["shared", "event", "shared", "missing"]).map(
        (x) => x.id
      )
    ).toEqual(["shared", "event"]);
  });
  it("limits output to three and skips missing/unpublished references without filling from unrelated quotes", async () => {
    getEntries.mockResolvedValue({
      items: [
        {
          sys: { id: "valid" },
          fields: {
            quote: "A real quote",
            authorName: "Author",
            approvedPlacements: ["event-page"],
          },
        },
      ],
    });
    expect(
      (await getApprovedTestimonials("event-page", ["deleted", "valid"])).map((x) => x.id)
    ).toEqual(["valid"]);
    expect(
      selectApprovedTestimonials(
        [1, 2, 3, 4].map((id) => quote(String(id), ["event-page"])),
        "event-page",
        ["4", "3", "2", "1"]
      )
    ).toHaveLength(3);
  });
  it("preserves overview reference order and applies approvals", async () => {
    getEntries.mockResolvedValueOnce({
      items: [
        {
          fields: {
            testimonials: [
              { sys: { id: "two" } },
              { sys: { id: "one" } },
              { sys: { id: "event" } },
            ],
          },
        },
      ],
    });
    getEntries.mockResolvedValueOnce({
      items: [
        quote("one", ["retreats-overview"]),
        quote("two", ["retreats-overview"]),
        quote("event", ["event-page"]),
      ].map((item) => ({ sys: { id: item.id }, fields: item })),
    });
    expect((await getRetreatOverviewTestimonials()).map((x) => x.id)).toEqual(["two", "one"]);
  });
  it("returns no overview quotes when there is no curated selection", async () => {
    getEntries.mockResolvedValue({ items: [] });
    expect(await getRetreatOverviewTestimonials()).toEqual([]);
    expect(getEntries).toHaveBeenCalledTimes(1);
  });
});

it("omits optional quotes when Contentful is unavailable", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  getEntries.mockRejectedValue(new Error("CMS unavailable"));
  await expect(getApprovedTestimonials("event-page", ["one"])).resolves.toEqual([]);
  await expect(getRetreatOverviewTestimonials()).resolves.toEqual([]);
  warn.mockRestore();
});
