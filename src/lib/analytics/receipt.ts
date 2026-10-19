import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { signupLocation, type SignupLocation } from "./contracts";
export const RECEIPT_COOKIE = "st_analytics_receipt";
type Receipt = { id: string; source: SignupLocation; guide: boolean; expires: number };
function signature(value: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Analytics receipt signing unavailable");
  return createHmac("sha256", secret).update(`analytics-receipt:${value}`).digest("base64url");
}
export function makeReceipt(source: unknown, guide: boolean) {
  const payload: Receipt = {
    id: randomUUID(),
    source: signupLocation(source),
    guide,
    expires: Date.now() + 600_000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded)}`;
}
export function readReceipt(value: string | undefined): Receipt | null {
  try {
    if (!value || value.length > 1000) return null;
    const [payload, mac, extra] = value.split(".");
    if (!mac || extra) return null;
    const expected = Buffer.from(signature(payload)),
      supplied = Buffer.from(mac);
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (
      !/^[a-f0-9-]{36}$/.test(data.id) ||
      typeof data.expires !== "number" ||
      data.expires < Date.now() ||
      typeof data.guide !== "boolean"
    )
      return null;
    return {
      id: data.id,
      source: signupLocation(data.source),
      guide: data.guide,
      expires: data.expires,
    };
  } catch {
    return null;
  }
}
