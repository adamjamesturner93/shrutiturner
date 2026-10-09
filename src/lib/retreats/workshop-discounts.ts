import "server-only";
import { db } from "@/lib/db";
import { getStripeClient } from "@/lib/billing/stripe-client";

export const workshopKinds = ["online_workshop", "in_person_workshop"] as const;

export async function listDiscountWorkshops() {
  return db.retreatDate.findMany({
    where: {
      eventKind: { in: [...workshopKinds] },
      status: { not: "cancelled" },
      endsAt: { gt: new Date() },
    },
    select: { id: true, retreatTitleSnapshot: true, startsAt: true },
    orderBy: { startsAt: "asc" },
  });
}

export async function workshopStripeProduct(dateId: string) {
  const date = await db.retreatDate.findUniqueOrThrow({ where: { id: dateId } });
  if (!workshopKinds.some((kind) => kind === date.eventKind))
    throw new Error("WORKSHOP_DISCOUNT_INVALID");
  if (date.stripeWorkshopProductId) return date.stripeWorkshopProductId;
  const product = await getStripeClient().products.create(
    {
      name: date.retreatTitleSnapshot,
      metadata: { workshopDateId: date.id },
    },
    { idempotencyKey: `workshop-product:${date.id}` }
  );
  await db.retreatDate.update({
    where: { id: date.id },
    data: { stripeWorkshopProductId: product.id },
  });
  return product.id;
}
