import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from "vitest";
import type Stripe from "stripe";
const clock = vi.hoisted(() => ({ now: new Date("2027-01-25T09:00Z") }));
const provider = vi.hoisted(() => ({
  refund: vi.fn(),
  checkout: vi.fn(),
  playback: vi.fn(),
  email: vi.fn(),
}));
vi.mock("@/lib/programmes/clock", () => ({ programmeNow: () => clock.now }));
vi.mock("@/lib/billing/stripe-client", () => ({
  getStripeClient: () => ({
    refunds: { create: provider.refund },
    checkout: { sessions: { create: provider.checkout } },
  }),
}));
vi.mock("@/lib/daily/service", () => ({
  getRecordingAccessLink: provider.playback,
  createSessionRoom: vi.fn(),
  createMeetingToken: vi.fn(),
  startRoomRecording: vi.fn(),
  stopRoomRecording: vi.fn(),
}));
vi.mock("@/lib/postmark/client", () => ({
  attemptEmailDelivery: provider.email,
  getPostmarkMessageStream: () => "test",
  getNotificationInbox: () => "coach@example.test",
}));
import { db } from "@/lib/db";
import { seedProgrammeFixtures } from "../../../prisma/fixtures/programmes";
import { getClientHub } from "@/lib/programmes/hub-service";
import { programmeAccess } from "@/lib/programmes/access";
import { getProgrammeWeek, getProgrammePortal } from "@/lib/programmes/content-service";
import { reviewProgrammeHealth } from "@/lib/programmes/clearance-service";
import {
  createProgrammePost,
  changeProgrammePost,
  listProgrammePosts,
} from "@/lib/programmes/community-service";
import {
  confirmCohort,
  markTeachingComplete,
  redeemProgrammeCredit,
} from "@/lib/programmes/admin-service";
import {
  createProgrammeCheckout,
  fulfilProgrammeCheckout,
  cancelProgramme,
  refundProgrammeEnrolment,
} from "@/lib/programmes/checkout-service";
import { programmeMessageMaySend } from "@/lib/programmes/message-guard";
import {
  eventClearanceState,
  getEventOnboarding,
  confirmEventHealth,
  assertEventExerciseClearance,
} from "@/lib/retreats/offering-clearance";
import { maintainProgrammes, dispatchProgrammeMessages } from "@/lib/programmes/jobs";
let users: Record<string, string>;
const c = "rys-active-week1";
beforeAll(async () => {
  if (!["127.0.0.1", "localhost"].includes(new URL(process.env.DATABASE_URL!).hostname))
    throw new Error("Local database required");
  users = await seedProgrammeFixtures(db);
}, 60000);
beforeEach(() => {
  clock.now = new Date("2027-01-25T09:00Z");
  provider.email.mockResolvedValue({});
  provider.refund.mockResolvedValue({ id: "re_fixture", status: "succeeded" });
  provider.playback.mockResolvedValue({
    url: "https://example.test/signed",
    expiresAt: 1800000000,
  });
});
afterAll(async () => {
  await db.$disconnect();
});
describe("real database entitlement and access boundaries", () => {
  it.each([
    ["alex.account", ["Dashboard", "Account"]],
    ["casey.coaching", ["Dashboard", "Coaching", "Account"]],
    ["priya.programme", ["Dashboard", "Programmes", "Account"]],
    ["robin.retreat", ["Dashboard", "Events", "Account"]],
    ["sam.workshop", ["Dashboard", "Events", "Account"]],
    ["drew.events", ["Dashboard", "Events", "Account"]],
    ["jordan.multi", ["Dashboard", "Coaching", "Programmes", "Account"]],
    ["avery.everything", ["Dashboard", "Coaching", "Programmes", "Events", "Account"]],
    ["pat.purchaser", ["Dashboard", "Account"]],
  ])("%s navigation reflects independent relationships", async (name, labels) => {
    const hub = await getClientHub(users[name as string]);
    expect(hub.nav.map((i) => i.label)).toEqual(labels);
  });
  it("both events appear without exposing health information", async () => {
    const hub = await getClientHub(users["drew.events"]);
    expect(hub.events.map((e) => e.type).sort()).toEqual(["Retreat", "Workshop"]);
    expect(JSON.stringify(hub)).not.toContain("medicalConditions");
  });
  it.each(["jamie.health", "morgan.review"])(
    "%s sees education but not workout bodies",
    async (name) => {
      const week = await getProgrammeWeek(users[name], c, `${c}-w1`);
      expect(week.education).toContain("Week 1 education");
      expect(week.workout).toEqual([]);
      await expect(programmeAccess(users[name], c, "exercise")).rejects.toThrow(
        "EXERCISE_CLEARANCE_REQUIRED"
      );
    }
  );
  it("considerations never leak into portal or general dashboard", async () => {
    const portal = await getProgrammePortal(users["taylor.considerations"], c);
    expect(portal.canExercise).toBe(true);
    expect(JSON.stringify(portal)).not.toContain("SYNTHETIC_PRIVATE");
    expect(JSON.stringify(await getClientHub(users["taylor.considerations"]))).not.toContain(
      "SYNTHETIC_PRIVATE"
    );
  });
  it("future-week API is protected", async () => {
    await expect(getProgrammeWeek(users["priya.programme"], c, `${c}-w3`)).rejects.toThrow(
      "NOT_RELEASED"
    );
  });
  it("purchaser is not participant", async () => {
    await expect(programmeAccess(users["pat.purchaser"], c)).rejects.toThrow("NOT_FOUND");
    expect((await programmeAccess(users["gift.participant"], c)).accessible).toBe(true);
  });
  it("unrelated users cannot read cohort content", async () => {
    await expect(programmeAccess(users["alex.account"], c)).rejects.toThrow("NOT_FOUND");
  });
  it("new health revision invalidates old clearance", async () => {
    const uid = users["taylor.considerations"];
    await db.healthProfile.update({
      where: { userId: uid },
      data: { lastUpdatedAt: new Date("2027-01-20") },
    });
    expect((await programmeAccess(uid, c)).canExercise).toBe(false);
    await db.healthProfile.update({
      where: { userId: uid },
      data: { lastUpdatedAt: new Date("2027-01-01") },
    });
  });
  it("community publication does not require staff presence", async () => {
    clock.now = new Date("2027-02-26T09:00Z");
    await maintainProgrammes();
    const posts = await listProgrammePosts(users["priya.programme"], c);
    expect(posts.posts.some((p) => p.body.includes("What are you taking forward"))).toBe(true);
    await maintainProgrammes();
    expect(await db.programmePost.count({ where: { sourceKey: `reflection:${c}-w5` } })).toBe(1);
  }, 30000);
  it("community edit/delete is owner restricted", async () => {
    const p = await createProgrammePost(users["priya.programme"], c, {
      title: "Fixture question",
      body: "Synthetic text",
    });
    await expect(
      changeProgrammePost(users["morgan.review"], c, p.id, { action: "delete" })
    ).rejects.toThrow("FORBIDDEN");
    await changeProgrammePost(users["priya.programme"], c, p.id, {
      action: "edit",
      body: "Edited text",
    });
    await changeProgrammePost(users["priya.programme"], c, p.id, { action: "delete" });
  });
  it("batch excludes flagged participants and audits each accepted decision", async () => {
    const ready = await db.offeringClearance.findUniqueOrThrow({
      where: {
        userId_offeringKey: { userId: users["priya.programme"], offeringKey: `programme:${c}` },
      },
    });
    await db.offeringClearance.update({ where: { id: ready.id }, data: { status: "ready" } });
    const flagged = await db.offeringClearance.findUniqueOrThrow({
      where: {
        userId_offeringKey: { userId: users["morgan.review"], offeringKey: `programme:${c}` },
      },
    });
    const result = await reviewProgrammeHealth(users.coach, c, {
      entries: [ready, flagged].map((r) => ({ id: r.id, healthRevision: r.healthRevision })),
      status: "cleared",
    });
    expect(result.map((r) => r.cleared)).toEqual([true, false]);
    expect(
      await db.adminActionLog.count({
        where: { targetId: ready.id, actionType: "programme_clearance_reviewed" },
      })
    ).toBeGreaterThan(0);
  });
  it("teaching releases cohort-wide without attendance", async () => {
    const id = "rys-teaching";
    clock.now = new Date("2027-01-25T09:00Z");
    expect((await getProgrammeWeek(users["priya.programme"], id, `${id}-w1`)).availability).toBe(
      "awaiting_teaching"
    );
    clock.now = new Date("2027-01-27T19:20Z");
    await markTeachingComplete(users.coach, id, `${id}-s1`);
    expect((await getProgrammeWeek(users["priya.programme"], id, `${id}-w1`)).availability).toBe(
      "preparing_recording"
    );
    await db.replayAsset.upsert({
      where: { id: "rys-teaching-replay" },
      create: {
        id: "rys-teaching-replay",
        resourceType: "small_group_programme_session",
        smallGroupProgrammeId: id,
        smallGroupProgrammeSessionId: `${id}-s1`,
        dailyRecordingId: "fixture-teaching",
        status: "ready",
      },
      update: { status: "ready" },
    });
    expect((await getProgrammeWeek(users["priya.programme"], id, `${id}-w1`)).workout).toHaveLength(
      4
    );
    expect((await getProgrammeWeek(users["morgan.review"], id, `${id}-w1`)).workout).toHaveLength(
      0
    );
  });
  it("follow-up content remains then expires exactly in London", async () => {
    clock.now = new Date("2027-03-31T22:59:59Z");
    expect((await getProgrammePortal(users["priya.programme"], "rys-follow-up")).accessible).toBe(
      true
    );
    clock.now = new Date("2027-03-31T23:00Z");
    const portal = await getProgrammePortal(users["priya.programme"], "rys-follow-up");
    expect(portal.accessible).toBe(false);
    expect(portal.sessions).toEqual([]);
    await expect(listProgrammePosts(users["priya.programme"], "rys-follow-up")).rejects.toThrow(
      "ACCESS_ENDED"
    );
  });
  it("below minimum remains pending and can be explicitly confirmed", async () => {
    clock.now = new Date("2027-01-18T10:00Z");
    await maintainProgrammes();
    const below = await db.smallGroupProgramme.findUniqueOrThrow({
      where: { id: "rys-below-minimum" },
    });
    expect(below.confirmedAt).toBeNull();
    expect(
      await db.smallGroupProgrammeEnrollment.count({
        where: { programmeId: below.id, status: "active" },
      })
    ).toBe(3);
    await confirmCohort(users.coach, below.id);
    expect(
      (await db.smallGroupProgramme.findUniqueOrThrow({ where: { id: below.id } })).confirmedAt
    ).not.toBeNull();
  });
  it("one-use alumni redemption is atomic and never changes price", async () => {
    clock.now = new Date("2027-03-01");
    await db.smallGroupProgramme.update({
      where: { id: c },
      data: {
        creditActive: true,
        creditAmountPence: 2500,
        creditStartsAt: new Date("2027-02-27"),
        creditEndsAt: new Date("2027-04-01"),
        creditServices: ["coached_plan"],
      },
    });
    const eid = `${c}-priya.programme`;
    await db.smallGroupProgrammeEnrollment.update({
      where: { id: eid },
      data: { creditRedeemedAt: null },
    });
    const results = await Promise.allSettled([
      redeemProgrammeCredit(users.coach, c, eid, "test"),
      redeemProgrammeCredit(users.coach, c, eid, "test"),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(
      (await db.smallGroupProgramme.findUniqueOrThrow({ where: { id: c } })).salePricePence
    ).toBe(10000);
  });
});
describe("payment fulfilment and refunds", () => {
  it("duplicate paid webhooks create only one entitlement and welcome", async () => {
    clock.now = new Date("2027-01-17");
    const id = "rys-payment-duplicate";
    await db.smallGroupProgrammeEnrollment.upsert({
      where: { id },
      create: {
        id,
        programmeId: "rys-on-sale",
        attendeeName: "Payment Fixture",
        attendeeEmail: "payment.duplicate@example.test",
        purchaserEmail: "pat.purchaser@example.test",
        pricePaidPence: 10000,
        status: "pending_payment",
        stripeCheckoutSessionId: "cs_duplicate",
      },
      update: { paidAt: null, status: "pending_payment" },
    });
    const event = {
      id: "cs_duplicate",
      metadata: { kind: "cohort_purchase", enrolmentId: id },
      payment_status: "paid",
      amount_total: 10000,
      currency: "gbp",
      payment_intent: "pi_duplicate",
    } as unknown as Stripe.Checkout.Session;
    await Promise.all([fulfilProgrammeCheckout(event), fulfilProgrammeCheckout(event)]);
    expect(
      await db.smallGroupProgrammeEnrollment.count({ where: { id, userId: { not: null } } })
    ).toBe(1);
    expect(await db.programmeMessage.count({ where: { sourceKey: `welcome:${id}` } })).toBe(1);
    expect(
      (await db.user.findUniqueOrThrow({ where: { email: "payment.duplicate@example.test" } }))
        .emailVerified
    ).toBeNull();
  });
  it("delayed unpaid checkout cannot create access", async () => {
    expect(
      await fulfilProgrammeCheckout({
        metadata: { kind: "cohort_purchase" },
        payment_status: "unpaid",
      } as unknown as Stripe.Checkout.Session)
    ).toBe(true);
  });
  it("last capacity is serialized", async () => {
    clock.now = new Date("2027-01-17");
    const id = "rys-on-sale";
    const existing = await db.smallGroupProgrammeEnrollment.count({
      where: { programmeId: id, status: "active" },
    });
    await db.smallGroupProgramme.update({
      where: { id },
      data: { maximumParticipants: existing + 1 },
    });
    provider.checkout.mockResolvedValue({
      id: "cs_capacity",
      url: "https://example.test/checkout",
    });
    const purchase = (n: string) =>
      createProgrammeCheckout(id, {
        purchaser: { name: "Synthetic Buyer", email: `race.${n}@example.test` },
        participant: { name: "Synthetic Participant", email: `race.${n}@example.test` },
        agreementVersion: "1",
        acceptedTerms: true,
        screeningAcknowledged: true,
      });
    const outcomes = await Promise.allSettled([purchase("one"), purchase("two")]);
    expect(outcomes.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  });
  it("cancellation blocks access and retry uses same refund identity", async () => {
    await cancelProgramme(users.coach, "rys-pre-start", "Synthetic cancellation");
    await expect(programmeAccess(users["priya.programme"], "rys-pre-start")).rejects.toThrow(
      "ACCESS_ENDED"
    );
    const eid = "rys-pre-start-priya.programme";
    provider.refund.mockRejectedValueOnce(new Error("timeout"));
    await expect(refundProgrammeEnrolment(users.coach, "rys-pre-start", eid)).rejects.toThrow(
      "timeout"
    );
    await refundProgrammeEnrolment(users.coach, "rys-pre-start", eid);
    expect(provider.refund.mock.calls[0][1]).toEqual(provider.refund.mock.calls[1][1]);
    expect(
      (await db.smallGroupProgrammeEnrollment.findUniqueOrThrow({ where: { id: eid } }))
        .refundStatus
    ).toBe("succeeded");
  });
});

describe("programme communications and shared event health", () => {
  async function message(kind: string, sourceKey = `mail-check:${kind}`, cohort = "rys-follow-up") {
    return db.programmeMessage.upsert({
      where: { sourceKey },
      create: {
        sourceKey,
        kind,
        programmeId: cohort,
        userId: users["priya.programme"],
        dueAt: clock.now,
      },
      update: { dueAt: clock.now, sentAt: null, error: null },
    });
  }
  it("captures welcome securely for the participant, never the gift purchaser", async () => {
    clock.now = new Date("2027-01-17");
    await message("welcome", "mail-check:welcome", "rys-on-sale");
    await dispatchProgrammeMessages("rys-on-sale");
    const delivery = await db.emailDelivery.findFirstOrThrow({
      where: { templateKey: "programme-welcome", userId: users["priya.programme"] },
    });
    expect(delivery.toEmail).toBe("priya.programme@example.test");
    expect(JSON.stringify(delivery.payloadJson)).toContain("/onboarding");
    expect(JSON.stringify(delivery.payloadJson)).not.toContain("SYNTHETIC_PRIVATE");
  });
  it("does not remind a participant to finish a pending coach review", async () => {
    clock.now = new Date("2027-01-18T10:00Z");
    const m = await message("onboarding", "mail-check:complete", "rys-active-week1");
    expect(await programmeMessageMaySend(m.id)).toBe(false);
    await db.programmeMessage.update({
      where: { id: m.id },
      data: { userId: users["morgan.review"] },
    });
    expect(await programmeMessageMaySend(m.id)).toBe(false);
    await db.programmeMessage.update({
      where: { id: m.id },
      data: { userId: users["jamie.health"] },
    });
    expect(await programmeMessageMaySend(m.id)).toBe(true);
  });
  it.each(["prestart", "live24", "live1", "closing", "ending", "cancelled", "refunded"])(
    "captures %s mail with secure links and correct recipient",
    async (kind) => {
      const cohort =
        kind === "cancelled" || kind === "refunded" ? "rys-cancelled" : "rys-active-week3";
      clock.now = new Date(
        kind === "prestart"
          ? "2027-01-22T10:00Z"
          : kind.startsWith("live")
            ? "2027-01-27T18:00Z"
            : "2027-03-24T10:00Z"
      );
      await db.smallGroupProgramme.update({
        where: { id: cohort },
        data: { reminder24h: true, reminder1h: true },
      });
      const key = kind.startsWith("live")
        ? `mail-check:${kind}:${cohort}-s1`
        : `mail-check:${kind}`;
      const m = await message(kind, key, cohort);
      await dispatchProgrammeMessages(cohort);
      const delivery = await db.emailDelivery.findUniqueOrThrow({
        where: { id: `programme-${m.id}` },
      });
      expect(delivery.toEmail).toBe("priya.programme@example.test");
      expect(delivery.templateKey).toBe(`programme-${kind}`);
      expect(JSON.stringify(delivery.payloadJson)).toContain(`/dashboard/programmes/${cohort}`);
      expect(JSON.stringify(delivery.payloadJson)).not.toMatch(
        /SYNTHETIC_PRIVATE|additionalNotes|medicalConditions/
      );
    }
  );
  it("suppresses a queued retry after a schedule change or cancellation", async () => {
    clock.now = new Date("2027-01-27T18:00Z");
    const id = "rys-active-week3";
    const m = await message("live1", `mail-check:stale:${id}-s1`, id);
    expect(await programmeMessageMaySend(m.id, "2027-01-27T18:30:00.000Z")).toBe(true);
    expect(await programmeMessageMaySend(m.id, "2027-01-26T18:30:00.000Z")).toBe(false);
    await db.smallGroupProgramme.update({ where: { id }, data: { cohortState: "cancelled" } });
    expect(await programmeMessageMaySend(m.id)).toBe(false);
  });
  it("never emails an unrelated participant", async () => {
    const m = await message("welcome", "mail-check:unrelated", "rys-on-sale");
    await db.programmeMessage.update({
      where: { id: m.id },
      data: { userId: users["casey.coaching"] },
    });
    expect(await programmeMessageMaySend(m.id)).toBe(false);
  });
  it("reuses a health revision while requiring a separate event decision", async () => {
    const id = "rys-event-workshop";
    const uid = users["avery.everything"];
    await db.retreatDate.update({ where: { id }, data: { requiresOfferingClearance: true } });
    expect((await eventClearanceState(uid, id)).status).toBe("pending_confirmation");
    const onboarding = await getEventOnboarding(uid, `${id}-avery.everything`);
    await confirmEventHealth(uid, `${id}-avery.everything`, {
      healthConfirmed: true,
      healthRevision: onboarding.healthRevision,
      agreementVersion: "1",
      acceptances: onboarding.agreements.map((a) => ({
        type: a.type,
        policyVersionId: a.policyVersionId,
        version: a.currentVersion,
        acknowledged: true,
      })),
    });
    expect((await eventClearanceState(uid, id)).status).toBe("ready");
    await expect(assertEventExerciseClearance(uid, id)).rejects.toThrow(
      "EXERCISE_CLEARANCE_REQUIRED"
    );
    await expect(
      getEventOnboarding(users["pat.purchaser"], `${id}-avery.everything`)
    ).rejects.toThrow("NOT_FOUND");
  });
});
