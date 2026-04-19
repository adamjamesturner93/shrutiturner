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
  POSTMARK_FROM_EMAIL: optionalString,
  POSTMARK_MESSAGE_STREAM: optionalString,
  POSTMARK_MARKETING_MESSAGE_STREAM: optionalString,
  POSTMARK_TRANSACTIONAL_MESSAGE_STREAM: optionalString,
  STRIPE_SECRET_KEY: optionalString,
  STRIPE_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).default(4000),
  CONTENT_SOURCE: z.enum(["local", "hybrid", "contentful"]).default("local"),
  CONTENTFUL_SPACE_ID: optionalString,
  CONTENTFUL_ENVIRONMENT: optionalString,
  CONTENTFUL_DELIVERY_TOKEN: optionalString,
  CONTENTFUL_PREVIEW_TOKEN: optionalString,
  CONTENTFUL_MANAGEMENT_TOKEN: optionalString,
  CONTENTFUL_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).default(4000),
  TURNSTILE_SECRET_KEY: optionalString,
  APP_HEALTH_SECRET: optionalString,
  SITE_STAGE: z.enum(["holding", "live"]).optional(),
});

export const env = schema.parse(process.env);

export function getDatabaseUrl() {
  return env.DATABASE_URL || env.DIRECT_URL;
}

export function getAdminEmailAllowlist() {
  return (env.ADMIN_EMAILS || "tech@thechronicyogini.com,shruti@shrutiturner.com")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function getBaseSiteUrlFromEnv() {
  return env.NEXT_PUBLIC_APP_URL || env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
