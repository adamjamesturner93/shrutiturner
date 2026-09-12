import { RetreatEventKind } from "@prisma/client";

export const RETREAT_EVENT_KINDS = [
  RetreatEventKind.residential_retreat,
  RetreatEventKind.day_retreat,
  RetreatEventKind.in_person_workshop,
  RetreatEventKind.online_workshop,
] as const;

export type RetreatEventCapabilities = {
  admission: "room" | "ticket";
  requiresAccommodation: boolean;
  requiresVenue: boolean;
  requiresPracticalRegistration: boolean;
  requiresCheckoutPracticalRegistration: boolean;
  usesLiveRoom: boolean;
  allowsMultipleGuests: boolean;
  paymentPolicy: "deposit_or_full" | "full_payment";
};

const CAPABILITIES: Record<RetreatEventKind, RetreatEventCapabilities> = {
  residential_retreat: {
    admission: "room",
    requiresAccommodation: true,
    requiresVenue: true,
    requiresPracticalRegistration: true,
    requiresCheckoutPracticalRegistration: true,
    usesLiveRoom: false,
    allowsMultipleGuests: true,
    paymentPolicy: "deposit_or_full",
  },
  day_retreat: {
    admission: "ticket",
    requiresAccommodation: false,
    requiresVenue: true,
    requiresPracticalRegistration: true,
    requiresCheckoutPracticalRegistration: true,
    usesLiveRoom: false,
    allowsMultipleGuests: false,
    paymentPolicy: "full_payment",
  },
  in_person_workshop: {
    admission: "ticket",
    requiresAccommodation: false,
    requiresVenue: true,
    requiresPracticalRegistration: true,
    requiresCheckoutPracticalRegistration: false,
    usesLiveRoom: false,
    allowsMultipleGuests: false,
    paymentPolicy: "full_payment",
  },
  online_workshop: {
    admission: "ticket",
    requiresAccommodation: false,
    requiresVenue: false,
    requiresPracticalRegistration: false,
    requiresCheckoutPracticalRegistration: false,
    usesLiveRoom: true,
    allowsMultipleGuests: false,
    paymentPolicy: "full_payment",
  },
};

export function getRetreatEventCapabilities(
  kind: RetreatEventKind | null | undefined,
  legacyRetreatType = "in_person"
) {
  return CAPABILITIES[kind || getDefaultEventKind(legacyRetreatType)];
}

export function getLegacyRetreatType(kind: RetreatEventKind): "in_person" | "online" {
  return kind === RetreatEventKind.online_workshop ? "online" : "in_person";
}

export function getDefaultEventKind(retreatType: string): RetreatEventKind {
  return retreatType === "online"
    ? RetreatEventKind.online_workshop
    : RetreatEventKind.residential_retreat;
}

export function isRetreatEventKind(value: unknown): value is RetreatEventKind {
  return typeof value === "string" && RETREAT_EVENT_KINDS.includes(value as RetreatEventKind);
}
