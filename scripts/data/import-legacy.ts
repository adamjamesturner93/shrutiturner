import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { CreditEntryType, MembershipPlan, Prisma, PrismaClient } from "@prisma/client";

export type LegacyValue = string | null;
export type LegacyRow = Record<string, LegacyValue>;
export type LegacyDump = Map<string, LegacyRow[]>;

type ImportTarget = "local" | "staging" | "prod";

type ImportOptions = {
  apply: boolean;
  source: string;
  target: ImportTarget;
};

type ImportStats = {
  source: string;
  target: ImportTarget;
  mode: "dry-run" | "apply";
  parsedTables: Record<string, number>;
  users: {
    sourceRows: number;
    normalizedUsers: number;
    skippedWithoutEmail: number;
    duplicateEmailsMerged: number;
  };
  newsletterSubscribers: number;
  healthProfiles: number;
  healthSelections: number;
  membershipSubscriptions: number;
  activeCreditBalances: number;
  billingEvents: number;
  emailCampaigns: number;
  skippedRetiredProductRows: Record<string, number>;
};

type NormalizedUser = {
  id: string;
  legacyIds: string[];
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  emailVerified: Date | null;
  image: string | null;
  dob: Date | null;
  gender: string | null;
  ethnicity: string | null;
  timezone: string;
  dateFormat: string;
  role: "student" | "admin" | "member" | "owner_admin";
  isOnboarded: boolean;
  hasAgreedToTerms: boolean;
  termsAgreedAt: Date | null;
  hasAgreedToHealth: boolean;
  healthAgreedAt: Date | null;
  hasConsentedToHealthData: boolean;
  healthDataConsentedAt: Date | null;
  stripeCustomerId: string | null;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  marketing: boolean;
  marketingSignedOn: Date | null;
};

type UserMapping = {
  users: NormalizedUser[];
  userIdByLegacyId: Map<string, string>;
  userIdByStripeCustomerId: Map<string, string>;
  skippedWithoutEmail: number;
  duplicateEmailsMerged: number;
};

const DEFAULT_SOURCE = "prisma/legacy.sql";
const DEFAULT_DATE_FORMAT = "DD/MM/YYYY";
const DEFAULT_TIMEZONE = "Europe/London";
const IMPORTED_AT = new Date();
const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);
const CURRENT_HEALTH_KEYS = new Set([
  "ankle_pain_injury",
  "knee_pain_injury",
  "hip_pain_injury",
  "back_pain_injury",
  "neck_pain_injury",
  "shoulder_pain_injury",
  "elbow_pain_injury",
  "wrist_pain_injury",
  "asthma",
  "low_blood_pressure",
  "high_blood_pressure",
  "osteoarthritis",
  "autoimmune",
  "physical_other",
  "diabetes",
  "heart_condition",
  "pregnant",
  "postpartum",
  "diastasis_recti",
  "ptsd",
  "anxiety",
  "depression",
  "stress_burnout",
  "seasonal_affective_disorder",
  "mental_other",
  "limb_difference",
  "adhd",
  "asd",
  "bipolar",
  "bpd",
  "ds",
  "dyscalculia",
  "dyslexia",
  "dyspraxia",
  "epilepsy",
  "neuro_other",
  "ocd",
  "tourettes",
]);
const DETAIL_FIELDS: Record<string, string> = {
  autoimmune: "autoimmune_details",
  physical_other: "physical_other_details",
  mental_other: "mental_other_details",
  limb_difference: "limb_difference_details",
  neuro_other: "neuro_other_details",
};
const RETIRED_PRODUCT_TABLES = [
  "FavouritedClasses",
  "InPersonClass",
  "InPersonMember",
  "InPersonVenue",
  "LiveOnlineClass",
  "OnDemandClass",
  "OnDemandWatchLog",
  "Retreat",
  "RetreatBooking",
  "Schedule",
];

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;

  const raw = readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function loadEnvForTarget(target: ImportTarget) {
  if (target === "local") {
    loadEnvFile(path.resolve(process.cwd(), ".env.local"));
    loadEnvFile(path.resolve(process.cwd(), ".env"));
    return;
  }
  loadEnvFile(path.resolve(process.cwd(), `.env.${target}`));
}

function getConnectionString() {
  const raw = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!raw) throw new Error("Missing DIRECT_URL or DATABASE_URL.");
  return raw.trim().replace(/^['"]|['"]$/g, "");
}

export function parsePgDump(raw: string): LegacyDump {
  const tables: LegacyDump = new Map();
  const lines = raw.split(/\r?\n/);
  let index = 0;

  while (index < lines.length) {
    const header = lines[index];
    const match = header.match(/^COPY public\."([^"]+)" \((.*)\) FROM stdin;$/);
    if (!match) {
      index += 1;
      continue;
    }

    const table = match[1];
    const columns = parseCopyColumns(match[2]);
    const rows: LegacyRow[] = [];
    index += 1;

    while (index < lines.length && lines[index] !== "\\.") {
      const values = splitCopyRow(lines[index]);
      const row: LegacyRow = {};
      columns.forEach((column, columnIndex) => {
        row[column] = values[columnIndex] ?? null;
      });
      rows.push(row);
      index += 1;
    }

    tables.set(table, rows);
    index += 1;
  }

  return tables;
}

function parseCopyColumns(raw: string) {
  return raw.split(",").map((column) => column.trim().replace(/^"|"$/g, ""));
}

export function splitCopyRow(row: string): LegacyValue[] {
  return row.split("\t").map((value) => {
    if (value === "\\N") return null;
    return unescapeCopyValue(value);
  });
}

function unescapeCopyValue(value: string) {
  return value.replace(/\\([\\tnr])/g, (_match, escaped: string) => {
    if (escaped === "t") return "\t";
    if (escaped === "n") return "\n";
    if (escaped === "r") return "\r";
    return "\\";
  });
}

function getRows(dump: LegacyDump, table: string) {
  return dump.get(table) || [];
}

function truthy(value: LegacyValue) {
  return value === "t" || value === "true" || value === "1";
}

function text(value: LegacyValue) {
  const normalized = value?.trim();
  return normalized || null;
}

function parseDate(value: LegacyValue) {
  const normalized = text(value);
  if (!normalized) return null;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseNumber(value: LegacyValue) {
  const normalized = text(value);
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeEmail(value: LegacyValue) {
  const normalized = text(value)?.toLowerCase();
  if (!normalized || !normalized.includes("@")) return null;
  return normalized;
}

function splitName(name: string | null) {
  if (!name) return { firstName: null, lastName: null };
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: null, lastName: null };
  return {
    firstName: parts[0],
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : null,
  };
}

function earliest(...dates: Array<Date | null>) {
  return dates.filter(Boolean).sort((a, b) => a!.getTime() - b!.getTime())[0] || null;
}

function latest(...dates: Array<Date | null>) {
  return dates.filter(Boolean).sort((a, b) => b!.getTime() - a!.getTime())[0] || null;
}

function roleForUser(row: LegacyRow, hasSubscription: boolean) {
  const email = normalizeEmail(row.email);
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  if (email && admins.includes(email)) return "owner_admin" as const;
  return hasSubscription || Boolean(text(row.stripeCustomerId))
    ? ("member" as const)
    : ("student" as const);
}

export function buildUserMapping(rows: LegacyRow[], subscriptionRows: LegacyRow[]): UserMapping {
  const subscriptionUserIds = new Set(
    subscriptionRows.map((row) => text(row.userId)).filter((id): id is string => Boolean(id))
  );
  const byEmail = new Map<string, LegacyRow[]>();
  let skippedWithoutEmail = 0;

  for (const row of rows) {
    const email = normalizeEmail(row.email);
    if (!email) {
      skippedWithoutEmail += 1;
      continue;
    }
    const group = byEmail.get(email) || [];
    group.push(row);
    byEmail.set(email, group);
  }

  const users: NormalizedUser[] = [];
  const userIdByLegacyId = new Map<string, string>();
  const userIdByStripeCustomerId = new Map<string, string>();
  let duplicateEmailsMerged = 0;

  for (const [email, group] of byEmail.entries()) {
    duplicateEmailsMerged += Math.max(0, group.length - 1);
    const primary = [...group].sort((a, b) => {
      const aStripe = text(a.stripeCustomerId) ? 1 : 0;
      const bStripe = text(b.stripeCustomerId) ? 1 : 0;
      if (aStripe !== bStripe) return bStripe - aStripe;
      return (parseDate(b.updatedAt)?.getTime() || 0) - (parseDate(a.updatedAt)?.getTime() || 0);
    })[0];

    const createdAt = earliest(...group.map((row) => parseDate(row.createdAt))) || IMPORTED_AT;
    const updatedAt = latest(...group.map((row) => parseDate(row.updatedAt))) || createdAt;
    const name = text(primary.name);
    const split = splitName(name);
    const stripeCustomerId = text(primary.stripeCustomerId);
    const hasSubscription = group.some((row) => subscriptionUserIds.has(text(row.id) || ""));
    const legacyIds = group.map((row) => text(row.id)).filter((id): id is string => Boolean(id));
    const mergedIds = legacyIds.length > 1 ? legacyIds.join(", ") : null;

    const normalized: NormalizedUser = {
      id: text(primary.id) || `legacy-user-${email}`,
      legacyIds,
      email,
      name,
      firstName: split.firstName,
      lastName: split.lastName,
      emailVerified: parseDate(primary.emailVerified),
      image: text(primary.image),
      dob: parseDate(primary.dob),
      gender: text(primary.gender),
      ethnicity: text(primary.ethnicity),
      timezone: text(primary.timezone) || DEFAULT_TIMEZONE,
      dateFormat: DEFAULT_DATE_FORMAT,
      role: roleForUser(primary, hasSubscription),
      isOnboarded: group.some(
        (row) => truthy(row.terms) || truthy(row.waiver) || truthy(row.medical_consent)
      ),
      hasAgreedToTerms: group.some((row) => truthy(row.terms)),
      termsAgreedAt: earliest(...group.map((row) => parseDate(row.terms_signed_on))),
      hasAgreedToHealth: group.some((row) => truthy(row.waiver)),
      healthAgreedAt: earliest(...group.map((row) => parseDate(row.waiver_signed_on))),
      hasConsentedToHealthData: group.some((row) => truthy(row.medical_consent)),
      healthDataConsentedAt: earliest(
        ...group.map((row) => parseDate(row.medical_consent_signed_on))
      ),
      stripeCustomerId,
      adminNotes: mergedIds ? `Legacy duplicate user rows merged: ${mergedIds}` : null,
      createdAt,
      updatedAt,
      marketing: group.some((row) => truthy(row.marketing)),
      marketingSignedOn: earliest(...group.map((row) => parseDate(row.marketing_signed_on))),
    };

    for (const id of legacyIds) userIdByLegacyId.set(id, normalized.id);
    if (stripeCustomerId) userIdByStripeCustomerId.set(stripeCustomerId, normalized.id);
    users.push(normalized);
  }

  return {
    users,
    userIdByLegacyId,
    userIdByStripeCustomerId,
    skippedWithoutEmail,
    duplicateEmailsMerged,
  };
}

function buildUserCreates(mapping: UserMapping): Prisma.UserCreateManyInput[] {
  const seenStripeCustomers = new Set<string>();
  return mapping.users.map((user) => {
    const stripeCustomerId =
      user.stripeCustomerId && !seenStripeCustomers.has(user.stripeCustomerId)
        ? user.stripeCustomerId
        : null;
    if (stripeCustomerId) seenStripeCustomers.add(stripeCustomerId);
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      role: user.role,
      dob: user.dob,
      gender: user.gender,
      ethnicity: user.ethnicity,
      timezone: user.timezone,
      dateFormat: user.dateFormat,
      isOnboarded: user.isOnboarded,
      hasAgreedToTerms: user.hasAgreedToTerms,
      hasAgreedToHealth: user.hasAgreedToHealth,
      termsAgreedAt: user.termsAgreedAt,
      healthAgreedAt: user.healthAgreedAt,
      hasConsentedToHealthData: user.hasConsentedToHealthData,
      healthDataConsentedAt: user.healthDataConsentedAt,
      stripeCustomerId,
      adminNotes: user.adminNotes,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  });
}

function tokenForNewsletter(email: string) {
  return `legacy-${Buffer.from(email).toString("base64url").slice(0, 48)}`;
}

function buildNewsletterSubscribers(
  mapping: UserMapping
): Prisma.NewsletterSubscriberCreateManyInput[] {
  return mapping.users
    .filter((user) => user.marketing)
    .map((user) => ({
      email: user.email,
      firstName: user.firstName,
      userId: user.id,
      status: "subscribed",
      source: "legacy_import",
      token: tokenForNewsletter(user.email),
      consentedAt: user.marketingSignedOn || user.createdAt,
      subscribedAt: user.marketingSignedOn || user.createdAt,
      verifiedAt: user.marketingSignedOn || user.createdAt,
      createdAt: user.marketingSignedOn || user.createdAt,
      updatedAt: user.updatedAt,
    }));
}

function buildEmailCampaigns(rows: LegacyRow[]): Prisma.EmailCampaignCreateManyInput[] {
  return rows.map((row) => ({
    providerCampaignId: `legacy-newsletter-${text(row.id) || cryptoSafeKey(text(row.subject) || "unknown")}`,
    subject: text(row.subject) || "Legacy newsletter",
    stream: "broadcast",
    status: "sent",
    audienceType: "legacy_newsletter",
    triggeredBy: "legacy_import",
    sentCount: 0,
    failedCount: 0,
    sentAt: parseDate(row.sentAt),
    metadataJson: {
      legacyId: text(row.id),
      content: text(row.content),
      createdAt: text(row.createdAt),
      updatedAt: text(row.updatedAt),
    },
    createdAt: parseDate(row.createdAt) || parseDate(row.sentAt) || IMPORTED_AT,
    updatedAt: parseDate(row.updatedAt) || parseDate(row.sentAt) || IMPORTED_AT,
  }));
}

function cryptoSafeKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function latestRowsByUser(rows: LegacyRow[], mapping: UserMapping) {
  const byUserId = new Map<string, LegacyRow[]>();
  for (const row of rows) {
    const legacyUserId = text(row.userId);
    const userId = legacyUserId ? mapping.userIdByLegacyId.get(legacyUserId) : null;
    if (!userId) continue;
    const group = byUserId.get(userId) || [];
    group.push(row);
    byUserId.set(userId, group);
  }

  return Array.from(byUserId.entries()).map(([userId, group]) => ({
    userId,
    rows: group.sort(
      (a, b) => (parseDate(b.createdAt)?.getTime() || 0) - (parseDate(a.createdAt)?.getTime() || 0)
    ),
  }));
}

function selectedHealthConditions(row: LegacyRow) {
  const selections: Array<{ conditionKey: string; detail: string | null }> = [];
  for (const key of CURRENT_HEALTH_KEYS) {
    if (!truthy(row[key])) continue;
    selections.push({
      conditionKey: key,
      detail: text(row[DETAIL_FIELDS[key] || ""]),
    });
  }
  return selections;
}

function goalSummary(rows: LegacyRow[]) {
  const labels: Record<string, string> = {
    me_time: "me time",
    balance: "balance",
    calm: "calm",
    empowered: "feeling empowered",
    energy: "energy",
    flexibililty: "flexibility",
    healthCondition: "support with a health condition",
    quad: "quad strength",
    recovery: "recovery",
    sleep: "sleep",
    strength: "strength",
    stress: "stress management",
    weight: "weight management",
  };
  const selected = new Set<string>();
  for (const row of rows) {
    for (const [key, label] of Object.entries(labels)) {
      if (truthy(row[key])) selected.add(label);
    }
  }
  return Array.from(selected).join(", ");
}

function buildHealthImport(dump: LegacyDump, mapping: UserMapping) {
  const goalRowsByUser = latestRowsByUser(getRows(dump, "Goals"), mapping);
  const goals = new Map(goalRowsByUser.map((entry) => [entry.userId, goalSummary(entry.rows)]));
  const healthRowsByUser = latestRowsByUser(getRows(dump, "Health"), mapping);

  return healthRowsByUser.map((entry) => {
    const latest = entry.rows[0];
    const selected = selectedHealthConditions(latest);
    const summary = goals.get(entry.userId);
    const notes = [
      summary ? `Legacy goals: ${summary}.` : "",
      entry.rows.length > 1 ? `Legacy import merged ${entry.rows.length} health declarations.` : "",
    ]
      .filter(Boolean)
      .join("\n");

    return {
      userId: entry.userId,
      legacyRows: entry.rows,
      selected,
      profile: {
        userId: entry.userId,
        declarationStatus:
          selected.length || notes ? ("context_declared" as const) : ("none_declared" as const),
        tracksFlareCheckIns: selected.some((item) =>
          ["autoimmune", "physical_other", "stress_burnout"].includes(item.conditionKey)
        ),
        additionalNotes: notes,
        lastConfirmedAt: parseDate(latest.createdAt) || IMPORTED_AT,
        lastUpdatedAt: parseDate(latest.createdAt) || IMPORTED_AT,
        createdAt: parseDate(latest.createdAt) || IMPORTED_AT,
        updatedAt: parseDate(latest.createdAt) || IMPORTED_AT,
      },
      revision: {
        updatedByUserId: entry.userId,
        snapshotJson: {
          source: "legacy_import",
          legacyHealthRows: entry.rows,
          legacyGoals: summary || null,
          importedAt: IMPORTED_AT.toISOString(),
        },
        createdAt: parseDate(latest.createdAt) || IMPORTED_AT,
      },
    };
  });
}

function priceLookup(rows: LegacyRow[]) {
  return new Map(
    rows
      .map((row) => {
        const id = text(row.stripe_price_id);
        if (!id) return null;
        return [
          id,
          {
            pricePence: Math.round((parseNumber(row.price) || 0) * 100),
            billingPeriod: text(row.billing_period),
            title: text(row.title),
          },
        ] as const;
      })
      .filter(
        (
          entry
        ): entry is readonly [
          string,
          { pricePence: number; billingPeriod: string | null; title: string | null },
        ] => Boolean(entry)
      )
  );
}

function mapMembershipStatus(status: string | null, periodEnd: Date | null) {
  if (status === "canceled" || status === "cancelled") return "cancelled" as const;
  if (status === "past_due" || status === "unpaid") return "past_due" as const;
  if (status === "paused") return "paused" as const;
  if (status === "active" && periodEnd && periodEnd < IMPORTED_AT) return "expired" as const;
  return ACTIVE_STATUSES.has(status || "") ? ("active" as const) : ("expired" as const);
}

function mapBillingInterval(row: LegacyRow, price: { billingPeriod: string | null } | undefined) {
  const value = `${text(row.stripe_sub_type) || ""} ${price?.billingPeriod || ""}`.toLowerCase();
  if (value.includes("annual") || value.includes("annually") || value.includes("year")) {
    return "annual" as const;
  }
  return "monthly" as const;
}

function buildMembershipSubscriptions(
  subscriptionRows: LegacyRow[],
  membershipPriceRows: LegacyRow[],
  mapping: UserMapping
): Prisma.MembershipSubscriptionCreateManyInput[] {
  const prices = priceLookup(membershipPriceRows);
  const entries: Prisma.MembershipSubscriptionCreateManyInput[] = [];

  for (const row of subscriptionRows) {
    const legacyUserId = text(row.userId);
    const userId = legacyUserId ? mapping.userIdByLegacyId.get(legacyUserId) : null;
    const stripeSubscriptionId = text(row.stripe_subscription_id);
    if (!userId || !stripeSubscriptionId) continue;

    const stripePriceId = text(row.stripe_price_id);
    const price = stripePriceId ? prices.get(stripePriceId) : undefined;
    const periodEnd = parseDate(row.stripe_current_period_end);
    const status = mapMembershipStatus(text(row.status), periodEnd);
    entries.push({
      id: `legacy-membership-${stripeSubscriptionId}`.slice(0, 96),
      userId,
      plan: MembershipPlan.movewell,
      billingInterval: mapBillingInterval(row, price),
      status,
      pricePence: price?.pricePence || 0,
      currency: "GBP",
      classesPerWeek: 99,
      startsAt: parseDate(row.createdAt) || IMPORTED_AT,
      renewsAt: status === "active" ? periodEnd : null,
      endsAt: status === "active" ? null : periodEnd,
      cancelAtPeriodEnd: status === "cancelled",
      stripeSubscriptionId,
      stripePriceId,
      stripeCurrentPeriodEnd: periodEnd,
      complianceSnapshotJson: {
        source: "legacy_import",
        stripeSubType: text(row.stripe_sub_type),
        legacyStatus: text(row.status),
        priceTitle: price?.title || null,
      },
      createdAt: parseDate(row.createdAt) || IMPORTED_AT,
      updatedAt: parseDate(row.updatedAt) || IMPORTED_AT,
    });
  }

  return entries;
}

function buildCreditLedgerEntries(
  creditRows: LegacyRow[],
  mapping: UserMapping
): Prisma.CreditLedgerEntryCreateManyInput[] {
  const entries: Prisma.CreditLedgerEntryCreateManyInput[] = [];

  for (const row of creditRows) {
    const legacyUserId = text(row.userId);
    const userId = legacyUserId ? mapping.userIdByLegacyId.get(legacyUserId) : null;
    const remaining = parseNumber(row.remainingAmount) || 0;
    const expiresAt = parseDate(row.expiresAt);
    if (
      !userId ||
      remaining <= 0 ||
      truthy(row.isExpired) ||
      (expiresAt && expiresAt < IMPORTED_AT)
    ) {
      continue;
    }
    entries.push({
      id: `legacy-credit-${text(row.id) || cryptoSafeKey(userId)}`.slice(0, 96),
      userId,
      amount: remaining,
      type:
        text(row.reason) === "ADMIN" ? CreditEntryType.admin_adjustment : CreditEntryType.purchase,
      description: `Legacy remaining class credit balance (${text(row.reason) || "unknown reason"}).`,
      sourceRef: `legacy:Credit:${text(row.id) || "unknown"}`,
      expiresAt,
      stripePaymentIntentId: text(row.stripePaymentId)?.startsWith("pi_")
        ? text(row.stripePaymentId)
        : null,
      stripeCheckoutSessionId: text(row.stripePaymentId)?.startsWith("cs_")
        ? text(row.stripePaymentId)
        : null,
      createdAt: parseDate(row.issuedAt) || IMPORTED_AT,
    });
  }

  return entries;
}

function buildBillingEvents(
  dump: LegacyDump,
  mapping: UserMapping
): Prisma.BillingEventCreateManyInput[] {
  const events: Prisma.BillingEventCreateManyInput[] = [];
  const addEvent = (
    table: "Payments" | "Invoices" | "RetreatBooking",
    row: LegacyRow,
    idValue: string | null,
    userId: string | null,
    createdAt: Date | null
  ) => {
    if (!idValue) return;
    events.push({
      provider: "legacy",
      providerEventId: `legacy:${table}:${idValue}`,
      type: `legacy.${table}`,
      status: "processed",
      payloadJson: row,
      processedAt: IMPORTED_AT,
      userId,
      createdAt: createdAt || IMPORTED_AT,
    });
  };

  for (const row of getRows(dump, "Payments")) {
    const customerId = text(row.customer_id);
    addEvent(
      "Payments",
      row,
      text(row.id) || text(row.stripe_id),
      customerId ? mapping.userIdByStripeCustomerId.get(customerId) || null : null,
      parseDate(row.created) || parseDate(row.stripe_created)
    );
  }

  for (const row of getRows(dump, "Invoices")) {
    const legacyUserId = text(row.userId);
    addEvent(
      "Invoices",
      row,
      text(row.id),
      legacyUserId ? mapping.userIdByLegacyId.get(legacyUserId) || null : null,
      parseDate(row.invoiceDate)
    );
  }

  for (const row of getRows(dump, "RetreatBooking")) {
    const legacyUserId = text(row.userId);
    addEvent(
      "RetreatBooking",
      row,
      text(row.id),
      legacyUserId ? mapping.userIdByLegacyId.get(legacyUserId) || null : null,
      parseDate(row.createdAt)
    );
  }

  return events;
}

function tableCounts(dump: LegacyDump) {
  return Object.fromEntries(
    Array.from(dump.entries()).map(([table, rows]) => [table, rows.length])
  );
}

function retiredCounts(dump: LegacyDump) {
  return Object.fromEntries(
    RETIRED_PRODUCT_TABLES.map((table) => [table, getRows(dump, table).length])
  );
}

export function buildImportPlan(
  dump: LegacyDump,
  options: ImportOptions
): ImportStats & {
  userCreates: Prisma.UserCreateManyInput[];
  newsletterCreates: Prisma.NewsletterSubscriberCreateManyInput[];
  emailCampaignCreates: Prisma.EmailCampaignCreateManyInput[];
  healthImports: ReturnType<typeof buildHealthImport>;
  membershipCreates: Prisma.MembershipSubscriptionCreateManyInput[];
  creditCreates: Prisma.CreditLedgerEntryCreateManyInput[];
  billingEventCreates: Prisma.BillingEventCreateManyInput[];
} {
  const mapping = buildUserMapping(getRows(dump, "User"), getRows(dump, "Subscriptions"));
  const userCreates = buildUserCreates(mapping);
  const newsletterCreates = buildNewsletterSubscribers(mapping);
  const emailCampaignCreates = buildEmailCampaigns(getRows(dump, "Newsletter"));
  const healthImports = buildHealthImport(dump, mapping);
  const membershipCreates = buildMembershipSubscriptions(
    getRows(dump, "Subscriptions"),
    getRows(dump, "MembershipPrices"),
    mapping
  );
  const creditCreates = buildCreditLedgerEntries(getRows(dump, "Credit"), mapping);
  const billingEventCreates = buildBillingEvents(dump, mapping);
  const healthSelections = healthImports.reduce((sum, item) => sum + item.selected.length, 0);

  return {
    source: options.source,
    target: options.target,
    mode: options.apply ? "apply" : "dry-run",
    parsedTables: tableCounts(dump),
    users: {
      sourceRows: getRows(dump, "User").length,
      normalizedUsers: userCreates.length,
      skippedWithoutEmail: mapping.skippedWithoutEmail,
      duplicateEmailsMerged: mapping.duplicateEmailsMerged,
    },
    newsletterSubscribers: newsletterCreates.length,
    healthProfiles: healthImports.length,
    healthSelections,
    membershipSubscriptions: membershipCreates.length,
    activeCreditBalances: creditCreates.length,
    billingEvents: billingEventCreates.length,
    emailCampaigns: emailCampaignCreates.length,
    skippedRetiredProductRows: retiredCounts(dump),
    userCreates,
    newsletterCreates,
    emailCampaignCreates,
    healthImports,
    membershipCreates,
    creditCreates,
    billingEventCreates,
  };
}

async function applyPlan(
  db: PrismaClient,
  plan: ReturnType<typeof buildImportPlan>
): Promise<Record<string, number>> {
  const results: Record<string, number> = {};

  results.users = (
    await db.user.createMany({
      data: plan.userCreates,
      skipDuplicates: true,
    })
  ).count;

  const actualUserIdByPlannedId = await resolveActualUserIds(db, plan.userCreates);

  results.newsletterSubscribers = (
    await db.newsletterSubscriber.createMany({
      data: plan.newsletterCreates.map((entry) => ({
        ...entry,
        userId: entry.userId ? actualUserIdByPlannedId.get(entry.userId) || entry.userId : null,
      })),
      skipDuplicates: true,
    })
  ).count;

  results.emailCampaigns = (
    await db.emailCampaign.createMany({
      data: plan.emailCampaignCreates,
      skipDuplicates: true,
    })
  ).count;

  for (const item of plan.healthImports) {
    const actualUserId = actualUserIdByPlannedId.get(item.userId) || item.userId;
    const profile = await db.healthProfile.upsert({
      where: { userId: actualUserId },
      create: {
        ...item.profile,
        userId: actualUserId,
      },
      update: {
        declarationStatus: item.profile.declarationStatus,
        tracksFlareCheckIns: item.profile.tracksFlareCheckIns,
        additionalNotes: item.profile.additionalNotes,
        lastConfirmedAt: item.profile.lastConfirmedAt,
        lastUpdatedAt: item.profile.lastUpdatedAt,
      },
      select: { id: true },
    });

    await db.healthConditionSelection.deleteMany({ where: { profileId: profile.id } });
    if (item.selected.length) {
      await db.healthConditionSelection.createMany({
        data: item.selected.map((selection) => ({
          profileId: profile.id,
          conditionKey: selection.conditionKey,
          detail: selection.detail,
        })),
        skipDuplicates: true,
      });
    }

    const existingRevision = await db.healthProfileRevision.findFirst({
      where: {
        profileId: profile.id,
        createdAt: item.revision.createdAt,
      },
      select: { id: true },
    });

    if (!existingRevision) {
      await db.healthProfileRevision.create({
        data: {
          profileId: profile.id,
          updatedByUserId:
            actualUserIdByPlannedId.get(item.revision.updatedByUserId) ||
            item.revision.updatedByUserId,
          snapshotJson: item.revision.snapshotJson,
          createdAt: item.revision.createdAt,
        },
      });
    }
  }
  results.healthProfiles = plan.healthImports.length;

  results.membershipSubscriptions = (
    await db.membershipSubscription.createMany({
      data: plan.membershipCreates.map((entry) => ({
        ...entry,
        userId: actualUserIdByPlannedId.get(entry.userId) || entry.userId,
      })),
      skipDuplicates: true,
    })
  ).count;

  results.creditLedgerEntries = (
    await db.creditLedgerEntry.createMany({
      data: plan.creditCreates.map((entry) => ({
        ...entry,
        userId: actualUserIdByPlannedId.get(entry.userId) || entry.userId,
      })),
      skipDuplicates: true,
    })
  ).count;

  results.billingEvents = (
    await db.billingEvent.createMany({
      data: plan.billingEventCreates.map((entry) => ({
        ...entry,
        userId: entry.userId ? actualUserIdByPlannedId.get(entry.userId) || entry.userId : null,
      })),
      skipDuplicates: true,
    })
  ).count;

  return results;
}

async function resolveActualUserIds(
  db: PrismaClient,
  users: Prisma.UserCreateManyInput[]
): Promise<Map<string, string>> {
  const emailByPlannedId = new Map(
    users
      .map((user) => [user.id, user.email] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[0] && entry[1]))
  );
  const emails = Array.from(new Set(Array.from(emailByPlannedId.values())));
  const existingUsers = await db.user.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true },
  });
  const actualIdByEmail = new Map(existingUsers.map((user) => [user.email, user.id]));
  const actualUserIdByPlannedId = new Map<string, string>();

  for (const [plannedId, email] of emailByPlannedId.entries()) {
    actualUserIdByPlannedId.set(plannedId, actualIdByEmail.get(email) || plannedId);
  }

  return actualUserIdByPlannedId;
}

function parseArgs(argv: string[]): ImportOptions {
  let apply = false;
  let source = DEFAULT_SOURCE;
  let target: ImportTarget = "local";
  const args = argv.filter((arg) => arg !== "--");

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--apply") apply = true;
    else if (arg === "--dry-run") apply = false;
    else if (arg === "--source") {
      source = args[index + 1] || source;
      index += 1;
    } else if (arg === "--target") {
      const next = args[index + 1] as ImportTarget | undefined;
      if (next !== "local" && next !== "staging" && next !== "prod") {
        throw new Error("--target must be local, staging or prod.");
      }
      target = next;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (apply && target === "prod" && process.env.CONFIRM_LEGACY_IMPORT !== "import-prod") {
    throw new Error("Production import requires CONFIRM_LEGACY_IMPORT=import-prod.");
  }

  return { apply, source, target };
}

function printablePlan(plan: ReturnType<typeof buildImportPlan>) {
  const stats: Partial<ReturnType<typeof buildImportPlan>> = { ...plan };
  delete stats.userCreates;
  delete stats.newsletterCreates;
  delete stats.emailCampaignCreates;
  delete stats.healthImports;
  delete stats.membershipCreates;
  delete stats.creditCreates;
  delete stats.billingEventCreates;
  return stats;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  loadEnvForTarget(options.target);

  const sourcePath = path.resolve(process.cwd(), options.source);
  if (!existsSync(sourcePath)) throw new Error(`Legacy dump not found: ${sourcePath}`);
  const dump = parsePgDump(readFileSync(sourcePath, "utf8"));
  const plan = buildImportPlan(dump, options);

  console.log(JSON.stringify(printablePlan(plan), null, 2));

  if (!options.apply) {
    console.log("Dry run only. Re-run with --apply to write to the selected database.");
    return;
  }

  const adapter = new PrismaPg({ connectionString: getConnectionString() });
  const db = new PrismaClient({ adapter, log: ["error", "warn"] });
  try {
    const results = await applyPlan(db, plan);
    console.log(JSON.stringify({ applied: results }, null, 2));
  } finally {
    await db.$disconnect();
  }
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
