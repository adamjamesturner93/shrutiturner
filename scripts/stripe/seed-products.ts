import Stripe from "stripe";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

type CreditBundleKey = "1" | "3" | "10";

type SeedItem = {
  key: string;
  envVar: string;
  productName: string;
  productDescription: string;
  productSku: string;
  lookupKey: string;
  unitAmount: number;
  currency: string;
  recurring?: {
    interval: "month" | "year";
  };
};

const STRIPE_API_VERSION: Stripe.LatestApiVersion = "2025-08-27.basil";

const MEMBERSHIP_MONTHLY_AMOUNT_GBP = 2900;
const MEMBERSHIP_ANNUAL_AMOUNT_GBP = 29000;

const CREDIT_BUNDLE_AMOUNTS_GBP: Record<CreditBundleKey, number> = {
  1: 900,
  3: 2400,
  10: 7000,
};

const CURRENCY = "gbp";
const APP_PREFIX = "strength-yoga";

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;

  const raw = readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function loadLocalEnvFiles() {
  loadEnvFile(path.resolve(process.cwd(), ".env.local"));
  loadEnvFile(path.resolve(process.cwd(), ".env"));
}

const MEMBERSHIP_ITEMS: SeedItem[] = [
  {
    key: "membership_movewell_monthly",
    envVar: "STRIPE_PRICE_MEMBERSHIP_MOVEWELL_MONTHLY",
    productName: "Move Well Membership",
    productDescription: "Monthly membership with unlimited weekly classes.",
    productSku: `${APP_PREFIX}_membership_movewell`,
    lookupKey: `${APP_PREFIX}_membership_movewell_monthly`,
    unitAmount: MEMBERSHIP_MONTHLY_AMOUNT_GBP,
    currency: CURRENCY,
    recurring: { interval: "month" },
  },
  {
    key: "membership_movewell_annual",
    envVar: "STRIPE_PRICE_MEMBERSHIP_MOVEWELL_ANNUAL",
    productName: "Move Well Membership (Annual)",
    productDescription: "Annual membership with unlimited weekly classes.",
    productSku: `${APP_PREFIX}_membership_movewell`,
    lookupKey: `${APP_PREFIX}_membership_movewell_annual`,
    unitAmount: MEMBERSHIP_ANNUAL_AMOUNT_GBP,
    currency: CURRENCY,
    recurring: { interval: "year" },
  },
];

const CREDIT_ITEMS: SeedItem[] = [
  {
    key: "credits_1",
    envVar: "STRIPE_PRICE_CREDITS_1",
    productName: "Class Credits - Drop-in (1 class)",
    productDescription: "Single class credit.",
    productSku: `${APP_PREFIX}_credits_1`,
    lookupKey: `${APP_PREFIX}_credits_1_once`,
    unitAmount: CREDIT_BUNDLE_AMOUNTS_GBP["1"],
    currency: CURRENCY,
  },
  {
    key: "credits_3",
    envVar: "STRIPE_PRICE_CREDITS_3",
    productName: "Class Credits - 3 Class Bundle",
    productDescription: "Three class credits.",
    productSku: `${APP_PREFIX}_credits_3`,
    lookupKey: `${APP_PREFIX}_credits_3_once`,
    unitAmount: CREDIT_BUNDLE_AMOUNTS_GBP["3"],
    currency: CURRENCY,
  },
  {
    key: "credits_10",
    envVar: "STRIPE_PRICE_CREDITS_10",
    productName: "Class Credits - 10 Class Bundle",
    productDescription: "Ten class credits.",
    productSku: `${APP_PREFIX}_credits_10`,
    lookupKey: `${APP_PREFIX}_credits_10_once`,
    unitAmount: CREDIT_BUNDLE_AMOUNTS_GBP["10"],
    currency: CURRENCY,
  },
];

async function findOrCreateProduct(stripe: Stripe, item: SeedItem) {
  const products = await stripe.products.list({ active: true, limit: 100 });
  const existing = products.data.find((product) => product.metadata?.sku === item.productSku);
  if (existing) {
    return existing;
  }

  return stripe.products.create({
    name: item.productName,
    description: item.productDescription,
    metadata: {
      app: APP_PREFIX,
      sku: item.productSku,
    },
  });
}

async function findCurrentPriceByLookup(stripe: Stripe, lookupKey: string) {
  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    expand: ["data.product"],
    limit: 1,
  });
  return prices.data[0] || null;
}

function recurringMatches(a: Stripe.Price.Recurring | null, b: SeedItem["recurring"] | undefined) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.interval === b.interval;
}

async function ensurePrice(stripe: Stripe, product: Stripe.Product, item: SeedItem) {
  const existing = await findCurrentPriceByLookup(stripe, item.lookupKey);
  if (
    existing &&
    existing.product &&
    typeof existing.product !== "string" &&
    existing.product.id === product.id &&
    existing.currency === item.currency &&
    existing.unit_amount === item.unitAmount &&
    recurringMatches(existing.recurring, item.recurring)
  ) {
    return existing;
  }

  return stripe.prices.create({
    product: product.id,
    currency: item.currency,
    unit_amount: item.unitAmount,
    recurring: item.recurring,
    lookup_key: item.lookupKey,
    transfer_lookup_key: true,
    metadata: {
      app: APP_PREFIX,
      key: item.key,
      envVar: item.envVar,
    },
  });
}

async function main() {
  loadLocalEnvFiles();

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
  });

  const seedItems = [...MEMBERSHIP_ITEMS, ...CREDIT_ITEMS];
  const envOutput: Array<{ envVar: string; priceId: string }> = [];

  for (const item of seedItems) {
    const product = await findOrCreateProduct(stripe, item);
    const price = await ensurePrice(stripe, product, item);
    envOutput.push({ envVar: item.envVar, priceId: price.id });
    // Keep concise but visible progress.
    console.log(`Seeded ${item.key}: ${price.id}`);
  }

  console.log("\nCopy into your .env:");
  for (const row of envOutput) {
    console.log(`${row.envVar}=${row.priceId}`);
  }
}

main().catch((error) => {
  console.error("Stripe seed failed:", error);
  process.exit(1);
});
