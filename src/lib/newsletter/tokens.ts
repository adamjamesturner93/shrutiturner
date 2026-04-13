import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

type SignedUnsubscribePayload = {
  exp: number;
  sub: string;
  type: "unsubscribe";
};

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getSigningSecret() {
  return (
    process.env.NEWSLETTER_UNSUBSCRIBE_SECRET ||
    process.env.AUTH_SECRET ||
    "development-newsletter-secret"
  );
}

function signPayload(payload: string) {
  return createHmac("sha256", getSigningSecret()).update(payload).digest("base64url");
}

export function createVerificationToken() {
  return randomBytes(24).toString("hex");
}

export function hashVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createSignedUnsubscribeToken(
  subscriberId: string,
  expiresInMs = 1000 * 60 * 60 * 24 * 30
) {
  const payload = encodeBase64Url(
    JSON.stringify({
      exp: Date.now() + expiresInMs,
      sub: subscriberId,
      type: "unsubscribe",
    } satisfies SignedUnsubscribePayload)
  );
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

export function verifySignedUnsubscribeToken(token: string) {
  const [payload, signature] = token.trim().split(".");
  if (!payload || !signature) {
    throw new Error("INVALID_TOKEN");
  }

  const expectedSignature = signPayload(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new Error("INVALID_TOKEN");
  }

  const parsed = JSON.parse(decodeBase64Url(payload)) as Partial<SignedUnsubscribePayload>;
  if (
    parsed.type !== "unsubscribe" ||
    typeof parsed.sub !== "string" ||
    typeof parsed.exp !== "number"
  ) {
    throw new Error("INVALID_TOKEN");
  }

  if (parsed.exp <= Date.now()) {
    throw new Error("INVALID_TOKEN");
  }

  return parsed.sub;
}
