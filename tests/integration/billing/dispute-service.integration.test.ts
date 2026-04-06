import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { hasActiveDisputeHold, processStripeDisputeEvent } from "@/lib/billing/dispute-service";

const USER_PREFIX = "integration-dispute-user-";
const PROGRAM_PREFIX = "integration-dispute-programme-";

async function cleanupRows() {
  await db.billingDisputeCase.deleteMany({
    where: {
      OR: [
        { resourceType: "small_group_enrollment" },
        { user: { email: { startsWith: USER_PREFIX } } },
      ],
    },
  });
  await db.smallGroupProgrammeEnrollment.deleteMany({
    where: {
      programme: {
        slug: {
          startsWith: PROGRAM_PREFIX,
        },
      },
    },
  });
  await db.smallGroupProgramme.deleteMany({
    where: {
      slug: {
        startsWith: PROGRAM_PREFIX,
      },
    },
  });
  await db.user.deleteMany({
    where: {
      email: {
        startsWith: USER_PREFIX,
      },
    },
  });
}

function makeEmail(label: string) {
  return `${USER_PREFIX}${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

describe("dispute service", () => {
  beforeEach(async () => {
    await cleanupRows();
  });

  afterAll(async () => {
    await cleanupRows();
  });

  it("applies dispute hold only to the disputed entitlement by default", async () => {
    const user = await db.user.create({
      data: {
        email: makeEmail("member"),
        firstName: "Nina",
        lastName: "Member",
      },
    });
    const [programmeOne, programmeTwo] = await Promise.all([
      db.smallGroupProgramme.create({
        data: {
          slug: `${PROGRAM_PREFIX}one`,
          runSlug: `${PROGRAM_PREFIX}one`,
          templateSlug: "template-one",
          title: "Programme One",
          shortDescription: "Programme one",
          durationLabel: "6 weeks",
          cohortSize: 8,
          pricePence: 12000,
        },
      }),
      db.smallGroupProgramme.create({
        data: {
          slug: `${PROGRAM_PREFIX}two`,
          runSlug: `${PROGRAM_PREFIX}two`,
          templateSlug: "template-two",
          title: "Programme Two",
          shortDescription: "Programme two",
          durationLabel: "6 weeks",
          cohortSize: 8,
          pricePence: 12000,
        },
      }),
    ]);

    const [enrolmentOne, enrolmentTwo] = await Promise.all([
      db.smallGroupProgrammeEnrollment.create({
        data: {
          programmeId: programmeOne.id,
          userId: user.id,
          attendeeName: "Nina Member",
          attendeeEmail: user.email,
          status: "active",
          stripePaymentIntentId: "pi_dispute_target",
        },
      }),
      db.smallGroupProgrammeEnrollment.create({
        data: {
          programmeId: programmeTwo.id,
          userId: user.id,
          attendeeName: "Nina Member",
          attendeeEmail: user.email,
          status: "active",
          stripePaymentIntentId: "pi_other",
        },
      }),
    ]);

    const event = {
      id: "evt_dispute_1",
      object: "event",
      api_version: "2025-01-27.acacia",
      created: 1_711_234_567,
      data: {
        object: {
          id: "dp_123",
          object: "dispute",
          created: 1_711_234_567,
          status: "warning_needs_response",
          payment_intent: "pi_dispute_target",
          charge: {
            id: "ch_123",
            customer: user.stripeCustomerId,
          },
        },
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: null,
        idempotency_key: null,
      },
      type: "charge.dispute.created",
    } as unknown as Stripe.Event;

    await processStripeDisputeEvent(event);

    await expect(hasActiveDisputeHold("small_group_enrollment", enrolmentOne.id)).resolves.toBe(
      true
    );
    await expect(hasActiveDisputeHold("small_group_enrollment", enrolmentTwo.id)).resolves.toBe(
      false
    );
  });
});
