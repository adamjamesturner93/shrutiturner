import "server-only";

import { AcceptanceType } from "@prisma/client";
import { db } from "@/lib/db";
import { needsHealthDeclarationReview } from "@/lib/health/health-service";
import {
  getAcceptanceRequirementStates,
  getPhysicalServiceAcceptanceRequirements,
} from "@/lib/legal/acceptance-service";

export type WorkshopSetupMissingItem =
  | "verified_email"
  | "name"
  | "date_of_birth"
  | "health_profile"
  | "terms"
  | "health_waiver"
  | "health_data";

export type WorkshopSetupState = {
  complete: boolean;
  missing: WorkshopSetupMissingItem[];
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    dob: string;
  };
};

const acceptanceMissingItem: Partial<Record<AcceptanceType, WorkshopSetupMissingItem>> = {
  [AcceptanceType.terms]: "terms",
  [AcceptanceType.health_waiver]: "health_waiver",
  [AcceptanceType.health_data]: "health_data",
};

export async function getWorkshopSetupState(userId: string): Promise<WorkshopSetupState> {
  const [user, acceptanceStates] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        emailVerified: true,
        dob: true,
        healthProfile: {
          select: { declarationStatus: true, lastConfirmedAt: true },
        },
      },
    }),
    getAcceptanceRequirementStates(
      userId,
      getPhysicalServiceAcceptanceRequirements("online_workshop_setup")
    ),
  ]);
  if (!user) throw new Error("USER_NOT_FOUND");

  const missing: WorkshopSetupMissingItem[] = [];
  if (!user.emailVerified) missing.push("verified_email");
  if (!user.firstName?.trim() || !user.lastName?.trim()) missing.push("name");
  if (!user.dob) missing.push("date_of_birth");
  if (!user.healthProfile || needsHealthDeclarationReview(user.healthProfile.lastConfirmedAt)) {
    missing.push("health_profile");
  }
  for (const acceptance of acceptanceStates) {
    if (acceptance.isCurrent) continue;
    const item = acceptanceMissingItem[acceptance.type];
    if (item) missing.push(item);
  }

  return {
    complete: missing.length === 0,
    missing,
    profile: {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email,
      dob: user.dob?.toISOString().slice(0, 10) || "",
    },
  };
}

export async function getWorkshopBookingSetupState(bookingId: string, userId: string) {
  const booking = await db.retreatBooking.findFirst({
    where: {
      id: bookingId,
      retreatDate: { retreatType: "online" },
      OR: [
        { attendeeUserId: userId },
        { attendeeUserId: null, purchaserUserId: userId, giftPurchaseId: null },
      ],
    },
    select: {
      id: true,
      attendeeUserId: true,
      retreatDate: {
        select: { retreatTitleSnapshot: true, startsAt: true, timezone: true },
      },
    },
  });
  if (!booking) throw new Error("NOT_FOUND");

  if (!booking.attendeeUserId) {
    await db.retreatBooking.update({
      where: { id: booking.id },
      data: { attendeeUserId: userId },
    });
  }

  return {
    bookingId: booking.id,
    title: booking.retreatDate.retreatTitleSnapshot,
    startsAt: booking.retreatDate.startsAt.toISOString(),
    timezone: booking.retreatDate.timezone,
    setup: await getWorkshopSetupState(userId),
  };
}
