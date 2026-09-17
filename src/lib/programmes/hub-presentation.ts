import type { RetreatTemplateContent } from "@/lib/content/types";
import { getRetreatImageSrc, getRetreatCardImagePosition } from "@/lib/retreats/images";

export type HubAction = {
  id: string;
  groupId: string;
  title: string;
  detail: string;
  href: string;
  label: string;
  rank: number;
  at: string | null;
  actionable: boolean;
  timezone?: string;
  online?: boolean;
  location?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};
export function consolidateActions(actions: HubAction[]) {
  const grouped = new Map<string, HubAction>();
  for (const action of [...actions].sort(
    (a, b) => a.rank - b.rank || (a.at || "").localeCompare(b.at || "")
  )) {
    if (!grouped.has(action.groupId)) grouped.set(action.groupId, action);
  }
  return [...grouped.values()];
}
export type EventBookingSummary = {
  id: string;
  purchaserUserId: string | null;
  attendeeUserId: string | null;
  attendeeCount: number;
  attendees: { userId: string | null }[];
  bookingStatus: string;
  paymentStatus: string;
  balanceAmountPence: number;
  balancePaidPence: number;
  balanceDueAt: Date | null;
  instalments: { status: string; dueAt: Date | null; amountPence: number }[];
};
export function bookingSummary(b: EventBookingSummary, userId: string, now: Date) {
  const inactive = ["cancelled", "refunded"].includes(b.bookingStatus);
  const purchaser = b.purchaserUserId === userId;
  const outstanding =
    !inactive && b.balanceAmountPence > b.balancePaidPence && b.paymentStatus !== "paid_in_full";
  const unpaid = b.instalments.filter((i) => ["pending", "overdue", "failed"].includes(i.status));
  const due =
    outstanding &&
    (unpaid.length
      ? unpaid.some((i) => i.dueAt && i.dueAt <= now)
      : b.balanceDueAt
        ? b.balanceDueAt <= now
        : b.bookingStatus === "balance_due");
  return {
    id: b.id,
    reference: `Booking ${b.id.slice(-8).toUpperCase()}`,
    attendeeCount: purchaser ? Math.max(1, b.attendeeCount) : 1,
    active: !inactive,
    outstanding: purchaser && outstanding,
    due: purchaser && due,
    canPay: purchaser && outstanding,
    status: inactive
      ? b.bookingStatus === "refunded"
        ? "Refunded"
        : "Cancelled"
      : due && purchaser
        ? "Balance due"
        : outstanding
          ? "Balance outstanding"
          : b.paymentStatus === "paid_in_full"
            ? "Paid in full"
            : "Booking confirmed",
    href: `/dashboard/retreats/${b.id}`,
  };
}

/** Resolve the same published identity used by the public event cards. */
export function resolveHubEventPresentation(
  date: {
    retreatSlug: string;
    retreatType: string;
    eventKind: string;
    experience: { publishedContentJson: unknown } | null;
  },
  templates: Pick<
    RetreatTemplateContent,
    "slug" | "imageUrl" | "imageAlt" | "imageFocalPoint" | "experienceType"
  >[]
) {
  const legacy = templates.find((t) => t.slug === date.retreatSlug);
  const json = date.experience?.publishedContentJson;
  const raw = json && typeof json === "object" && "image" in json ? json.image : null;
  const image = raw && typeof raw === "object" ? raw : null;
  const url =
    image && "url" in image && typeof image.url === "string" ? image.url : legacy?.imageUrl;
  const alt =
    image && "alt" in image && typeof image.alt === "string" ? image.alt : legacy?.imageAlt;
  const focal = image && "focalPoint" in image ? image.focalPoint : legacy?.imageFocalPoint;
  const point =
    focal &&
    typeof focal === "object" &&
    "x" in focal &&
    "y" in focal &&
    typeof focal.x === "number" &&
    typeof focal.y === "number"
      ? { x: focal.x, y: focal.y }
      : null;
  const src = getRetreatImageSrc({
    imageUrl: url,
    retreatType: date.retreatType === "online" ? "online" : "in_person",
  });
  const kind = date.experience ? date.eventKind : legacy?.experienceType || date.eventKind;
  return {
    image: src,
    imageAlt: alt || "",
    imagePosition: getRetreatCardImagePosition(src, point),
    type:
      ["online_workshop", "in_person_workshop"].includes(kind) || date.retreatType === "online"
        ? "Workshop"
        : "Retreat",
  };
}
