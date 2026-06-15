export const BOOKING_CHECKOUT_INTENT_STORAGE_KEY = "shruti:booking-checkout-intent:v1";

const DEFAULT_INTENT_TTL_MS = 30 * 60 * 1000;

export type BookingCheckoutIntent = {
  classSlug: string;
  sessionId?: string;
  returnPath: string;
  createdAt: number;
  expiresAt: number;
};

export function buildBookingCheckoutReturnPath({
  pathname,
  search,
  classSlug,
  sessionId,
  checkoutStatus,
}: {
  pathname: string;
  search: string;
  classSlug: string;
  sessionId?: string | null;
  checkoutStatus: "success" | "cancelled";
}) {
  const params = new URLSearchParams(search);
  params.set("checkout", checkoutStatus);

  if (checkoutStatus === "success") {
    params.set("autobook", "1");
    params.set("autobookClass", classSlug);
    if (sessionId) {
      params.set("autobookSessionId", sessionId);
    } else {
      params.delete("autobookSessionId");
    }
  } else {
    params.delete("autobook");
    params.delete("autobookClass");
    params.delete("autobookSessionId");
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function createBookingCheckoutIntent({
  classSlug,
  sessionId,
  returnPath,
  now = Date.now(),
  ttlMs = DEFAULT_INTENT_TTL_MS,
}: {
  classSlug: string;
  sessionId?: string | null;
  returnPath: string;
  now?: number;
  ttlMs?: number;
}): BookingCheckoutIntent {
  return {
    classSlug,
    sessionId: sessionId || undefined,
    returnPath,
    createdAt: now,
    expiresAt: now + ttlMs,
  };
}

export function parseBookingCheckoutIntent(
  raw: string | null | undefined,
  now = Date.now()
): BookingCheckoutIntent | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<BookingCheckoutIntent>;
    if (typeof parsed.classSlug !== "string" || parsed.classSlug.length === 0) return null;
    if (typeof parsed.returnPath !== "string" || !parsed.returnPath.startsWith("/")) return null;
    if (typeof parsed.createdAt !== "number" || typeof parsed.expiresAt !== "number") return null;
    if (parsed.expiresAt <= now) return null;
    if (parsed.sessionId !== undefined && typeof parsed.sessionId !== "string") return null;

    return {
      classSlug: parsed.classSlug,
      sessionId: parsed.sessionId,
      returnPath: parsed.returnPath,
      createdAt: parsed.createdAt,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}
