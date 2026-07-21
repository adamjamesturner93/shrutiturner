import "server-only";

import { z } from "zod";

const optionalString = z
  .string()
  .trim()
  .transform((value) => (value.length ? value : undefined))
  .optional();

const optionalUrl = z
  .string()
  .trim()
  .url()
  .transform((value) => value.replace(/\/$/, ""))
  .optional();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
  DATABASE_URL: optionalString,
  DIRECT_URL: optionalString,
  AUTH_SECRET: optionalString,
  AUTH_URL: optionalUrl,
  AUTH_GOOGLE_ID: optionalString,
  AUTH_GOOGLE_SECRET: optionalString,
  AUTH_SESSION_MAX_AGE_DAYS: z.coerce.number().int().min(1).default(30),
  AUTH_SESSION_MAX_CONCURRENT: z.coerce.number().int().min(1).default(3),
  AUTH_OTP_EXPIRY_MINUTES: z.coerce.number().int().min(1).max(60).default(10),
  AUTH_OTP_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(3),
  AUTH_OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().min(0).default(60),
  ADMIN_EMAILS: optionalString,
  NEXT_PUBLIC_APP_URL: optionalUrl,
  NEXT_PUBLIC_SITE_URL: optionalUrl,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: optionalString,
  NEXT_PUBLIC_E2E_TEST_MODE: z.enum(["0", "1"]).optional(),
  POSTMARK_API_TOKEN: optionalString,
  POSTMARK_SERVER_TOKEN: optionalString,
  POSTMARK_FROM_EMAIL: optionalString,
  POSTMARK_MESSAGE_STREAM: optionalString,
  POSTMARK_MARKETING_MESSAGE_STREAM: optionalString,
  POSTMARK_TRANSACTIONAL_MESSAGE_STREAM: optionalString,
  STRIPE_SECRET_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
  STRIPE_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).default(4000),
  DAILY_API_KEY: optionalString,
  DAILY_API_BASE: optionalString,
  DAILY_WEBHOOK_SECRET: optionalString,
  CONTENTFUL_SPACE_ID: optionalString,
  CONTENTFUL_ENVIRONMENT: optionalString,
  CONTENTFUL_DELIVERY_TOKEN: optionalString,
  CONTENTFUL_PREVIEW_TOKEN: optionalString,
  CONTENTFUL_MANAGEMENT_TOKEN: optionalString,
  CONTENTFUL_REVALIDATE_SECONDS: z.coerce.number().int().min(1).default(60),
  CONTENTFUL_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).default(4000),
  GA4_MEASUREMENT_ID: optionalString,
  TURNSTILE_SECRET_KEY: optionalString,
  APP_HEALTH_SECRET: optionalString,
  INTERNAL_JOB_SECRET: optionalString,
  SITE_STAGE: z.enum(["holding", "live"]).optional(),
});

function isDeploymentEnvironment(value: z.infer<typeof schema>) {
  return (
    value.NODE_ENV === "production" ||
    value.VERCEL_ENV === "preview" ||
    value.VERCEL_ENV === "production"
  );
}

function ensureRequiredRuntimeEnv(value: z.infer<typeof schema>) {
  if (!isDeploymentEnvironment(value)) return value;

  const missing: string[] = [];
  if (!value.AUTH_SECRET) missing.push("AUTH_SECRET");
  if ((value.AUTH_GOOGLE_ID || value.AUTH_GOOGLE_SECRET) && !value.AUTH_URL) {
    missing.push("AUTH_URL");
  }
  if (!value.DATABASE_URL && !value.DIRECT_URL) missing.push("DATABASE_URL or DIRECT_URL");
  if (!value.NEXT_PUBLIC_APP_URL && !value.NEXT_PUBLIC_SITE_URL) {
    missing.push("NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_SITE_URL");
  }
  if (!value.POSTMARK_API_TOKEN && !value.POSTMARK_SERVER_TOKEN) {
    missing.push("POSTMARK_API_TOKEN or POSTMARK_SERVER_TOKEN");
  }
  if (!value.POSTMARK_FROM_EMAIL) missing.push("POSTMARK_FROM_EMAIL");
  if (!value.STRIPE_SECRET_KEY) missing.push("STRIPE_SECRET_KEY");

  if (missing.length) {
    throw new Error(`Missing required runtime environment variables: ${missing.join(", ")}`);
  }

  return value;
}

export const env = ensureRequiredRuntimeEnv(schema.parse(process.env));

export function getDatabaseUrl() {
  return env.DATABASE_URL || env.DIRECT_URL;
}

export function getAdminEmailAllowlist() {
  return (env.ADMIN_EMAILS || "shruti@shrutiturner.co.uk")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function getBaseSiteUrlFromEnv() {
  return env.NEXT_PUBLIC_APP_URL || env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export function getPostmarkToken() {
  return env.POSTMARK_API_TOKEN || env.POSTMARK_SERVER_TOKEN;
}
