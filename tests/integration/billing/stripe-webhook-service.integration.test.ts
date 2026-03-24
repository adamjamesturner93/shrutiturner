import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { BillingEventStatus, type Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { processStripeWebhookEvent } from "@/lib/billing/billing-service";

const EVENT_ID = "integration-stripe-event-1";

async function cleanupRows() {
  await db.billingEvent.deleteMany({
    where: {
      providerEventId: {
        startsWith: "integration-stripe-event-",
      },
    },
  });
}

function createEvent(): Stripe.Event {
  return {
    id: EVENT_ID,
    object: "event",
    api_version: "2025-01-27.acacia",
    created: 1_711_234_567,
    data: {
      object: {
        id: "cus_test_123",
        object: "customer",
      } as Prisma.JsonObject,
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: null,
      idempotency_key: null,
    },
    type: "customer.created",
  } as unknown as Stripe.Event;
}

describe("processStripeWebhookEvent", () => {
  beforeEach(async () => {
    await cleanupRows();
  });

  afterAll(async () => {
    await cleanupRows();
  });

  it("persists and idempotently reuses billing events", async () => {
    const first = await processStripeWebhookEvent(createEvent());
    const second = await processStripeWebhookEvent(createEvent());

    const persisted = await db.billingEvent.findUniqueOrThrow({
      where: { providerEventId: EVENT_ID },
    });

    expect(first).toEqual({ idempotent: false });
    expect(second).toEqual({ idempotent: true });
    expect(persisted.status).toBe(BillingEventStatus.processed);
    expect(persisted.processedAt).not.toBeNull();
  });
});
