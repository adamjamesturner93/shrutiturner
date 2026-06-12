import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AcceptanceType } from "@prisma/client";
import { db } from "@/lib/db";
import {
  getAccount,
  updateAccount,
  updateNotificationPreferences,
} from "@/lib/account/account-service";
import { formatDate, formatTime } from "@/lib/date-i18n";
import { getHealthProfile, upsertHealthProfile } from "@/lib/health/health-service";
import { createAccountTestEmail, cleanupAccountRows } from "../../helpers/account-fixtures";

const { syncMarketingPreferenceForUserMock } = vi.hoisted(() => ({
  syncMarketingPreferenceForUserMock: vi.fn(),
}));

vi.mock("@/lib/newsletter/subscriber-service", () => ({
  syncMarketingPreferenceForUser: syncMarketingPreferenceForUserMock,
  ensureSubscriberLinkedToUser: vi.fn().mockResolvedValue(undefined),
}));

describe("account journeys integration", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await cleanupAccountRows();
  });

  afterAll(async () => {
    await cleanupAccountRows();
  });

  it("persists account profile fields, preferences and explicit prefer-not-to-say values", async () => {
    const email = createAccountTestEmail("profile", "member");
    const user = await db.user.create({
      data: {
        email,
      },
    });

    await updateAccount(user.id, {
      firstName: "Casey",
      lastName: "Reader",
      dob: "1990-04-12",
      gender: "prefer_not_to_say",
      ethnicity: "prefer_not_to_say",
      timezone: "America/New_York",
      dateFormat: "MM/DD/YYYY",
    });

    const account = await getAccount(user.id, "http://localhost:3000");

    expect(account.profile).toMatchObject({
      firstName: "Casey",
      lastName: "Reader",
      dob: "1990-04-12",
      gender: "prefer_not_to_say",
      ethnicity: "prefer_not_to_say",
      timezone: "America/New_York",
      dateFormat: "MM/DD/YYYY",
    });
  });

  it("persists notification settings and syncs marketing preference changes", async () => {
    const email = createAccountTestEmail("notifications", "member");
    const user = await db.user.create({
      data: {
        email,
      },
    });

    const updated = await updateNotificationPreferences(user.id, {
      classReminders: false,
      scheduleUpdates: false,
      programAnnouncements: true,
      marketingEmails: false,
    });

    expect(updated).toMatchObject({
      classReminders: false,
      scheduleUpdates: false,
      programAnnouncements: true,
      marketingEmails: false,
    });
    expect(syncMarketingPreferenceForUserMock).toHaveBeenCalledWith(user.id, false, {
      source: "account",
      surface: "account_notifications",
      wordingText:
        "I want to receive marketing emails, newsletter updates and occasional offers from Shruti Turner. I can unsubscribe at any time.",
    });
  });

  it("persists onboarding profile, legal, source and health data for later account views", async () => {
    const email = createAccountTestEmail("onboarding", "member");
    const user = await db.user.create({
      data: {
        email,
      },
    });

    await updateAccount(user.id, {
      firstName: "Jordan",
      lastName: "Member",
      dob: "1988-07-08",
      hasAgreedToTerms: true,
      hasAgreedToHealth: true,
      hasConsentedToHealthData: true,
      heardAboutSource: "google",
      isOnboarded: true,
    });

    await upsertHealthProfile(
      user.id,
      {
        conditions: { autoimmune: true },
        details: { autoimmune: "Most noticeable after midday." },
        additionalNotes: "Needs longer warmups after travel.",
      },
      user.id
    );

    const account = await getAccount(user.id, "http://localhost:3000");
    const health = await getHealthProfile(user.id);

    expect(account.profile).toMatchObject({
      firstName: "Jordan",
      lastName: "Member",
      dob: "1988-07-08",
      hasAgreedToTerms: true,
      hasAgreedToHealth: true,
      hasConsentedToHealthData: true,
      heardAboutSource: "google",
      isOnboarded: true,
      hasHealthProfile: true,
      onboarding: {
        isComplete: true,
        checklistComplete: true,
        nextStep: "complete",
        missingSteps: [],
      },
    });
    expect(health).toMatchObject({
      conditions: { autoimmune: true },
      details: { autoimmune: "Most noticeable after midday." },
      additionalNotes: "Needs longer warmups after travel.",
    });
  });

  it("requires annual health waiver re-acceptance for physical services", async () => {
    const email = createAccountTestEmail("health-waiver-expiry", "member");
    const user = await db.user.create({
      data: {
        email,
      },
    });

    await updateAccount(user.id, {
      hasAgreedToHealth: true,
    });

    const expiredAt = new Date(Date.now() - 366 * 24 * 60 * 60 * 1000);
    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { healthAgreedAt: expiredAt },
      }),
      db.acceptanceEvent.updateMany({
        where: { userId: user.id, type: AcceptanceType.health_waiver },
        data: { acceptedAt: expiredAt },
      }),
    ]);

    const expiredAccount = await getAccount(user.id, "http://localhost:3000");
    expect(expiredAccount.profile).toMatchObject({
      hasAgreedToHealth: false,
      needsHealthWaiverReacceptance: true,
    });

    await updateAccount(user.id, {
      hasAgreedToHealth: true,
    });

    const refreshedAccount = await getAccount(user.id, "http://localhost:3000");
    const healthWaiverEvents = await db.acceptanceEvent.count({
      where: { userId: user.id, type: AcceptanceType.health_waiver },
    });
    expect(refreshedAccount.profile).toMatchObject({
      hasAgreedToHealth: true,
      needsHealthWaiverReacceptance: false,
    });
    expect(healthWaiverEvents).toBe(2);
  });

  it("persists display preferences that can be reused by member-facing date formatting", async () => {
    const email = createAccountTestEmail("i18n", "member");
    const user = await db.user.create({
      data: {
        email,
      },
    });

    await updateAccount(user.id, {
      timezone: "America/New_York",
      dateFormat: "MM/DD/YYYY",
    });

    const account = await getAccount(user.id, "http://localhost:3000");
    const prefs = {
      timezone: account.profile.timezone,
      dateFormat: account.profile.dateFormat as "MM/DD/YYYY",
    };

    expect(formatDate("2026-07-15T00:30:00.000Z", prefs)).toBe("July 14, 2026");
    expect(formatTime("2026-07-15T14:30:00.000Z", prefs)).toBe("10:30 AM");
  });
});
