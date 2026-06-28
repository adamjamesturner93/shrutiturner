import Stripe from "stripe";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { STRIPE_API_VERSION } from "../../src/lib/billing/stripe-config";

type CoachingPriceKey =
  | "guided_accountability"
  | "independent_training_plan"
  | "guided_training_plan"
  | "one_to_one_coaching";

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

const COACHING_AMOUNTS_GBP: Record<CoachingPriceKey, number> = {
  guided_accountability: 7000,
  independent_training_plan: 9500,
  guided_training_plan: 13000,
  one_to_one_coaching: 18000,
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

const COACHING_ITEMS: SeedItem[] = [
  {
    key: "coaching_guided_accountability_monthly",
    envVar: "STRIPE_PRICE_COACHING_GUIDED_ACCOUNTABILITY_MONTHLY",
    productName: "1:1 Offers - Guided Accountability",
    productDescription: "Monthly Guided Accountability subscription.",
    productSku: `${APP_PREFIX}_coaching_guided_accountability`,
    lookupKey: `${APP_PREFIX}_coaching_guided_accountability_monthly`,
    unitAmount: COACHING_AMOUNTS_GBP.guided_accountability,
    currency: CURRENCY,
    recurring: { interval: "month" },
  },
  {
    key: "coaching_independent_training_plan_monthly",
    envVar: "STRIPE_PRICE_COACHING_INDEPENDENT_TRAINING_PLAN_MONTHLY",
    productName: "1:1 Offers - Independent Training Plan",
    productDescription: "Monthly Independent Training Plan subscription.",
    productSku: `${APP_PREFIX}_coaching_independent_training_plan`,
    lookupKey: `${APP_PREFIX}_coaching_independent_training_plan_monthly`,
    unitAmount: COACHING_AMOUNTS_GBP.independent_training_plan,
    currency: CURRENCY,
    recurring: { interval: "month" },
  },
  {
    key: "coaching_guided_training_plan_monthly",
    envVar: "STRIPE_PRICE_COACHING_GUIDED_TRAINING_PLAN_MONTHLY",
    productName: "1:1 Offers - Guided Training Plan",
    productDescription: "Monthly Guided Training Plan subscription.",
    productSku: `${APP_PREFIX}_coaching_guided_training_plan`,
    lookupKey: `${APP_PREFIX}_coaching_guided_training_plan_monthly`,
    unitAmount: COACHING_AMOUNTS_GBP.guided_training_plan,
    currency: CURRENCY,
    recurring: { interval: "month" },
  },
  {
    key: "coaching_one_to_one_coaching_monthly",
    envVar: "STRIPE_PRICE_COACHING_ONE_TO_ONE_COACHING_MONTHLY",
    productName: "1:1 Offers - 1:1 Coaching",
    productDescription: "Monthly 1:1 Coaching subscription.",
    productSku: `${APP_PREFIX}_coaching_one_to_one_coaching`,
    lookupKey: `${APP_PREFIX}_coaching_one_to_one_coaching_monthly`,
    unitAmount: COACHING_AMOUNTS_GBP.one_to_one_coaching,
    currency: CURRENCY,
    recurring: { interval: "month" },
  },
];

async function findOrCreateProduct(stripe: Stripe, item: SeedItem) {
  const products = await stripe.products.list({ active: true, limit: 100 });
  const existing = products.data.find((product) => product.metadata?.sku === item.productSku);
  if (existing) {
    if (existing.name !== item.productName || existing.description !== item.productDescription) {
      return stripe.products.update(existing.id, {
        name: item.productName,
        description: item.productDescription,
      });
    }
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

  const seedItems = [...COACHING_ITEMS];
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
