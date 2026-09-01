import {
  AcceptanceType,
  GiftPurchaseStatus,
  Prisma,
  SmallGroupEnrollmentStatus,
  SmallGroupProgrammeStatus,
  SmallGroupSessionStatus,
} from "@prisma/client";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { buildAbsoluteUrl } from "@/lib/app-url";
import { assertNoUserCheckoutDisputeHold } from "@/lib/billing/dispute-service";
import { getStripeClient } from "@/lib/billing/stripe-client";
import { assertCurrentAcceptances } from "@/lib/legal/acceptance-service";
import { getCurrentPolicyVersion } from "@/lib/legal/policy-service";
import {
  getSmallGroupTemplateBySlug,
  getSmallGroupTemplates,
  type SmallGroupProgrammeWeekContent,
  type SmallGroupTemplateContent,
} from "@/lib/content";
import {
  buildAdminSmallGroupRunHref,
  buildSmallGroupTemplateCheckoutHref,
  buildSmallGroupTemplateHref,
} from "./routes";

const PROGRAMME_PAYMENT_WINDOW_MS = 30 * 60 * 1000;

type SmallGroupRunAvailability = {
  spotsFilled: number;
  spotsRemaining: number;
};

type SmallGroupRunSummary = {
  id: string;
  runSlug: string;
  templateSlug: string;
  durationLabel: string;
  startDate: string | null;
  endDate: string | null;
  scheduleLabel: string | null;
  priceLabel: string;
  pricePence: number;
  status: SmallGroupProgrammeStatus;
  cohortSize: number;
  spotsFilled: number;
  spotsRemaining: number;
  badge: string | null;
  canCheckout: boolean;
  canGift: boolean;
  checkoutHref: string;
  giftCheckoutHref: string;
};

export type SmallGroupTemplateOption = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  durationWeeks: number | null;
  cohortSize: number;
  sessionsPerWeek: number | null;
  defaultPricePence: number | null;
};

export type PublicSmallGroupTemplateListItem = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  shortSummary: string;
  durationLabel: string;
  durationWeeks: number | null;
  cohortSize: number;
  sessionsPerWeek: number | null;
  detailHref: string;
  featuredRun: SmallGroupRunSummary | null;
  runCount: number;
};

export type PublicSmallGroupTemplateDetail = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  shortSummary: string;
  longDescription: string | null;
  durationLabel: string;
  durationWeeks: number | null;
  cohortSize: number;
  sessionsPerWeek: number | null;
  defaultPricePence: number | null;
  outcomes: string[];
  whoItsFor: string[];
  equipment: string[];
  inclusions: string[];
  weekByWeek: SmallGroupProgrammeWeekContent[];
  detailHref: string;
  runs: SmallGroupRunSummary[];
};

export type MemberSmallGroupSummary = SmallGroupRunSummary & {
  title: string;
  subtitle: string | null;
  shortSummary: string;
  enrolled: boolean;
  enrolmentId: string | null;
  enrolmentStatus: SmallGroupEnrollmentStatus | null;
  sessionsAttended: number;
  nextSessionStartsAt: string | null;
  progressSummary: string | null;
  publicHref: string;
};

export type MemberSmallGroupDetail = MemberSmallGroupSummary & {
  longDescription: string | null;
  outcomes: string[];
  whoItsFor: string[];
  equipment: string[];
  inclusions: string[];
  weekByWeek: SmallGroupProgrammeWeekContent[];
  sessions: Array<{
    id: string;
    title: string;
    sequenceNumber: number;
    startsAt: string;
    endsAt: string | null;
    status: SmallGroupSessionStatus;
  }>;
};

export type AdminSmallGroupSummary = SmallGroupRunSummary & {
  title: string;
  subtitle: string | null;
  shortSummary: string;
  runHref: string;
  enrolmentCount: number;
  activeEnrolmentCount: number;
  sessionCount: number;
  completedSessionCount: number;
};

export type AdminSmallGroupDetail = AdminSmallGroupSummary & {
  longDescription: string | null;
  outcomes: string[];
  whoItsFor: string[];
  equipment: string[];
  inclusions: string[];
  weekByWeek: SmallGroupProgrammeWeekContent[];
  enrolments: Array<{
    id: string;
    userId: string | null;
    attendeeName: string;
    attendeeEmail: string;
    status: SmallGroupEnrollmentStatus;
    sessionsAttended: number;
    progressSummary: string | null;
  }>;
  sessions: Array<{
    id: string;
    title: string;
    sequenceNumber: number;
    startsAt: string;
    endsAt: string | null;
    status: SmallGroupSessionStatus;
  }>;
};

export type PublicProgrammeCheckoutState = {
  template: PublicSmallGroupTemplateDetail | null;
  run: SmallGroupRunSummary | null;
};

type SmallGroupRunRow = Awaited<ReturnType<typeof getRunByRunSlug>>;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeText(value: string, max: number) {
  return value.trim().slice(0, max);
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function parseWeekByWeek(value: unknown): SmallGroupProgrammeWeekContent[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const week = item as Record<string, unknown>;
    const weekNumber = Number(week.weekNumber);
    if (!Number.isFinite(weekNumber) || weekNumber <= 0) return [];
    return [
      {
        weekNumber,
        title: typeof week.title === "string" ? week.title : `Week ${weekNumber}`,
        focus: typeof week.focus === "string" ? week.focus : undefined,
        sessionTitles: parseStringArray(week.sessionTitles),
      },
    ];
  });
}

function formatPriceLabel(pricePence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(pricePence / 100);
}

function deriveRunBadge(
  status: SmallGroupProgrammeStatus,
  availability: SmallGroupRunAvailability
) {
  if (status === SmallGroupProgrammeStatus.waitlist) return "Waitlist open";
  if (status === SmallGroupProgrammeStatus.completed) return "Completed";
  if (availability.spotsRemaining <= 0) return "Waitlist open";
  if (availability.spotsRemaining <= 2)
    return `Only ${availability.spotsRemaining} spot${availability.spotsRemaining === 1 ? "" : "s"} left`;
  if (status === SmallGroupProgrammeStatus.upcoming) return "Next intake";
  if (status === SmallGroupProgrammeStatus.in_progress) return "In progress";
  return null;
}

function isPrismaConnectionError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("connect EPERM") ||
    error.message.includes("Can't reach database server") ||
    error.message.includes("Connection refused")
  );
}

async function listPublicRunRows(where?: Prisma.SmallGroupProgrammeWhereInput) {
  try {
    return await db.smallGroupProgramme.findMany({
      where,
      orderBy: [{ startDate: "asc" }, { title: "asc" }],
    });
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      console.error("Small group run lookup failed; falling back to template-only content.", error);
      return [];
    }
    throw error;
  }
}

function calculateAvailability(params: {
  cohortSize: number;
  enrolmentCount: number;
  giftCount: number;
}): SmallGroupRunAvailability {
  const spotsFilled = params.enrolmentCount + params.giftCount;
  return {
    spotsFilled,
    spotsRemaining: Math.max(params.cohortSize - spotsFilled, 0),
  };
}

async function getReservedRunCounts(programmeId: string) {
  const now = new Date();
  const [enrolmentCount, giftCount] = await Promise.all([
    db.smallGroupProgrammeEnrollment.count({
      where: {
        programmeId,
        OR: [
          {
            status: {
              in: [
                SmallGroupEnrollmentStatus.active,
                SmallGroupEnrollmentStatus.completed,
                SmallGroupEnrollmentStatus.waitlist,
              ],
            },
          },
          {
            status: SmallGroupEnrollmentStatus.pending_payment,
            OR: [{ paymentWindowExpiresAt: null }, { paymentWindowExpiresAt: { gt: now } }],
          },
        ],
      },
    }),
    db.giftPurchase.count({
      where: {
        smallGroupProgrammeId: programmeId,
        OR: [
          { status: GiftPurchaseStatus.purchased },
          {
            status: GiftPurchaseStatus.pending_payment,
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        ],
      },
    }),
  ]);

  return { enrolmentCount, giftCount };
}

function rankRun(row: {
  status: SmallGroupProgrammeStatus;
  startDate: Date | null;
  spotsRemaining?: number;
}) {
  const statusScore =
    row.status === SmallGroupProgrammeStatus.open
      ? 0
      : row.status === SmallGroupProgrammeStatus.upcoming
        ? 1
        : row.status === SmallGroupProgrammeStatus.waitlist
          ? 2
          : row.status === SmallGroupProgrammeStatus.in_progress
            ? 3
            : 4;
  return `${statusScore}-${row.startDate?.toISOString() || "9999"}`;
}

function buildTemplateFromRun(row: NonNullable<SmallGroupRunRow>): SmallGroupTemplateContent {
  return {
    id: row.templateContentfulEntryId || row.id,
    slug: row.templateSlug,
    title: row.title,
    subtitle: row.subtitle || undefined,
    shortSummary: row.shortDescription,
    fullDescription: row.description || undefined,
    longDescription: row.longDescription || undefined,
    outcomes: [],
    durationLabel: row.durationLabel,
    durationWeeks: row.durationWeeks ?? undefined,
    cohortSize: row.cohortSize,
    sessionsPerWeek: row.sessionsPerWeek ?? undefined,
    defaultPricePence: row.pricePence,
    whoItsFor: parseStringArray(row.whoItsForJson),
    equipment: parseStringArray(row.equipmentJson),
    inclusions: parseStringArray(row.inclusionsJson),
    weekByWeek: parseWeekByWeek(row.weekByWeekJson),
  };
}

function getTemplateNarrative(
  template: SmallGroupTemplateContent | null,
  fallbackRun?: NonNullable<SmallGroupRunRow> | null
) {
  if (template) return template;
  if (fallbackRun) return buildTemplateFromRun(fallbackRun);
  return null;
}

function toRunSummary(
  row: NonNullable<SmallGroupRunRow>,
  availability: SmallGroupRunAvailability
): SmallGroupRunSummary {
  const canCheckout =
    (row.status === SmallGroupProgrammeStatus.open ||
      row.status === SmallGroupProgrammeStatus.upcoming) &&
    availability.spotsRemaining > 0;
  const canGift = canCheckout;

  return {
    id: row.id,
    runSlug: row.runSlug,
    templateSlug: row.templateSlug,
    durationLabel: row.durationLabel,
    startDate: row.startDate?.toISOString() || null,
    endDate: row.endDate?.toISOString() || null,
    scheduleLabel: row.scheduleLabel,
    priceLabel: formatPriceLabel(row.pricePence),
    pricePence: row.pricePence,
    status: row.status,
    cohortSize: row.cohortSize,
    spotsFilled: availability.spotsFilled,
    spotsRemaining: availability.spotsRemaining,
    badge: deriveRunBadge(row.status, availability),
    canCheckout,
    canGift,
    checkoutHref: buildSmallGroupTemplateCheckoutHref(row.templateSlug, row.runSlug),
    giftCheckoutHref: buildSmallGroupTemplateCheckoutHref(row.templateSlug, row.runSlug, {
      gift: true,
    }),
  };
}

async function getRunByRunSlug(runSlug: string) {
  return db.smallGroupProgramme.findFirst({
    where: {
      OR: [{ runSlug }, { slug: runSlug }],
    },
  });
}

async function mapRunRowsWithAvailability(rows: Array<NonNullable<SmallGroupRunRow>>) {
  return Promise.all(
    rows.map(async (row) => {
      const availability = calculateAvailability({
        cohortSize: row.cohortSize,
        ...(await getReservedRunCounts(row.id)),
      });
      return {
        row,
        availability,
        summary: toRunSummary(row, availability),
      };
    })
  );
}

function sortRunSummaries(a: SmallGroupRunSummary, b: SmallGroupRunSummary) {
  const score = rankRun({
    status: a.status,
    startDate: a.startDate ? new Date(a.startDate) : null,
    spotsRemaining: a.spotsRemaining,
  }).localeCompare(
    rankRun({
      status: b.status,
      startDate: b.startDate ? new Date(b.startDate) : null,
      spotsRemaining: b.spotsRemaining,
    })
  );
  if (score !== 0) return score;
  return a.templateSlug.localeCompare(b.templateSlug);
}

function parseTimeLocal(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    throw new Error("INVALID_TIME");
  }
  return { hours: Number(match[1]), minutes: Number(match[2]) };
}

function uniqueSortedWeekdays(values: number[], fallbackWeekday: number) {
  const items = values.filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);
  const deduped = Array.from(new Set(items.length > 0 ? items : [fallbackWeekday]));
  return deduped.sort((a, b) => a - b);
}

function weekdayLabel(value: number) {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][value];
}

function buildScheduleLabel(weekdays: number[], timeLocal: string) {
  const dayLabels = weekdays.map((day) => `${weekdayLabel(day)}s`);
  const dayText =
    dayLabels.length === 1
      ? dayLabels[0]
      : `${dayLabels.slice(0, -1).join(", ")} & ${dayLabels[dayLabels.length - 1]}`;
  return `${dayText}, ${timeLocal} GMT`;
}

function buildRunSlugBase(templateSlug: string, startDate: string) {
  return `${templateSlug}-${startDate.replaceAll("-", "")}`;
}

async function generateUniqueRunSlug(templateSlug: string, startDate: string) {
  const base = buildRunSlugBase(templateSlug, startDate);
  let candidate = base;
  let suffix = 2;
  while (
    await db.smallGroupProgramme.findFirst({
      where: { OR: [{ runSlug: candidate }, { slug: candidate }] },
      select: { id: true },
    })
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function buildProgrammeSessionDates(input: {
  startDate: string;
  timeLocal: string;
  weekdays: number[];
  repeatWeeks: number;
  durationMinutes: number;
}) {
  const { hours, minutes } = parseTimeLocal(input.timeLocal);
  const firstDate = new Date(`${input.startDate}T00:00:00Z`);
  if (Number.isNaN(firstDate.getTime())) throw new Error("INVALID_START_DATE");

  const weekdays = uniqueSortedWeekdays(input.weekdays, firstDate.getUTCDay());
  const sessions: Array<{ startsAt: Date; endsAt: Date; sequenceNumber: number }> = [];

  for (let weekIndex = 0; weekIndex < input.repeatWeeks; weekIndex += 1) {
    for (const weekday of weekdays) {
      const occurrence = new Date(firstDate);
      occurrence.setUTCDate(firstDate.getUTCDate() + weekIndex * 7);
      const offset = weekday - occurrence.getUTCDay();
      occurrence.setUTCDate(occurrence.getUTCDate() + offset);
      occurrence.setUTCHours(hours, minutes, 0, 0);
      if (occurrence < new Date(`${input.startDate}T${input.timeLocal}:00Z`)) continue;
      const endsAt = new Date(occurrence);
      endsAt.setUTCMinutes(endsAt.getUTCMinutes() + input.durationMinutes);
      sessions.push({
        startsAt: occurrence,
        endsAt,
        sequenceNumber: sessions.length + 1,
      });
    }
  }

  return sessions.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

export async function listSmallGroupTemplateOptions(): Promise<SmallGroupTemplateOption[]> {
  const templates = await getSmallGroupTemplates();
  return templates
    .map((template) => ({
      id: template.id,
      slug: template.slug,
      title: template.title,
      subtitle: template.subtitle ?? null,
      durationWeeks: template.durationWeeks ?? null,
      cohortSize: template.cohortSize,
      sessionsPerWeek: template.sessionsPerWeek ?? null,
      defaultPricePence: template.defaultPricePence ?? null,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function createSmallGroupRun(input: {
  templateSlug: string;
  startDate: string;
  timeLocal: string;
  weekdays?: number[];
  repeatWeeks?: number;
  durationMinutes?: number;
  cohortSize?: number;
  pricePence?: number;
  status?: SmallGroupProgrammeStatus;
}) {
  const template = await getSmallGroupTemplateBySlug(input.templateSlug);
  if (!template) throw new Error("TEMPLATE_NOT_FOUND");

  const repeatWeeks = Math.max(1, Number(input.repeatWeeks || template.durationWeeks || 1));
  const durationMinutes = Math.max(30, Number(input.durationMinutes || 60));
  const firstDate = new Date(`${input.startDate}T00:00:00Z`);
  if (Number.isNaN(firstDate.getTime())) throw new Error("INVALID_START_DATE");
  const weekdays = uniqueSortedWeekdays(input.weekdays || [], firstDate.getUTCDay());
  const scheduleLabel = buildScheduleLabel(weekdays, input.timeLocal);
  const runSlug = await generateUniqueRunSlug(template.slug, input.startDate);
  const sessions = buildProgrammeSessionDates({
    startDate: input.startDate,
    timeLocal: input.timeLocal,
    weekdays,
    repeatWeeks,
    durationMinutes,
  });
  if (sessions.length === 0) throw new Error("INVALID_SCHEDULE");

  const programme = await db.smallGroupProgramme.create({
    data: {
      slug: runSlug,
      runSlug,
      templateSlug: template.slug,
      templateContentfulEntryId: template.id,
      title: template.title,
      subtitle: template.subtitle ?? null,
      shortDescription: template.shortSummary,
      description: template.fullDescription || template.shortSummary,
      longDescription: template.longDescription || template.fullDescription || null,
      durationLabel: template.durationLabel,
      durationWeeks: repeatWeeks,
      cohortSize: Number(input.cohortSize || template.cohortSize || 0),
      startDate: sessions[0]?.startsAt || null,
      endDate: sessions[sessions.length - 1]?.endsAt || null,
      scheduleLabel,
      pricePence: Number(input.pricePence || template.defaultPricePence || 0),
      sessionsPerWeek: weekdays.length,
      totalSessions: sessions.length,
      status: input.status || SmallGroupProgrammeStatus.upcoming,
      whoItsForJson: template.whoItsFor ?? [],
      equipmentJson: template.equipment ?? [],
      inclusionsJson: template.inclusions ?? [],
      weekByWeekJson: (template.weekByWeek ?? []) as unknown as Prisma.JsonArray,
      contentfulEntryId: runSlug,
      sessions: {
        create: sessions.map((session) => ({
          title:
            template.weekByWeek?.[session.sequenceNumber - 1]?.title ||
            `Week ${session.sequenceNumber}`,
          startsAt: session.startsAt,
          endsAt: session.endsAt,
          sequenceNumber: session.sequenceNumber,
          status:
            session.endsAt < new Date()
              ? SmallGroupSessionStatus.completed
              : SmallGroupSessionStatus.scheduled,
        })),
      },
    },
  });

  return programme;
}

export async function listSmallGroupCatalogue(): Promise<PublicSmallGroupTemplateListItem[]> {
  const [templates, rows] = await Promise.all([
    getSmallGroupTemplates(),
    listPublicRunRows({
      status: {
        notIn: [SmallGroupProgrammeStatus.draft, SmallGroupProgrammeStatus.archived],
      },
    }),
  ]);

  const runsWithAvailability = await mapRunRowsWithAvailability(rows);
  const runsByTemplate = new Map<string, SmallGroupRunSummary[]>();
  for (const item of runsWithAvailability) {
    const existing = runsByTemplate.get(item.row.templateSlug) || [];
    existing.push(item.summary);
    runsByTemplate.set(item.row.templateSlug, existing);
  }

  return templates
    .map((template) => {
      const runs = (runsByTemplate.get(template.slug) || []).sort(sortRunSummaries);
      return {
        id: template.id,
        slug: template.slug,
        title: template.title,
        subtitle: template.subtitle ?? null,
        shortSummary: template.shortSummary,
        durationLabel: template.durationLabel,
        durationWeeks: template.durationWeeks ?? null,
        cohortSize: template.cohortSize,
        sessionsPerWeek: template.sessionsPerWeek ?? null,
        detailHref: buildSmallGroupTemplateHref(template.slug),
        featuredRun: runs[0] || null,
        runCount: runs.length,
      };
    })
    .filter((template) => template.runCount > 0)
    .sort((a, b) => {
      if (a.featuredRun?.startDate && b.featuredRun?.startDate) {
        return a.featuredRun.startDate.localeCompare(b.featuredRun.startDate);
      }
      return a.title.localeCompare(b.title);
    });
}

export async function getPublicSmallGroupProgrammeBySlug(
  templateSlug: string
): Promise<PublicSmallGroupTemplateDetail | null> {
  const [templateFromContent, rows] = await Promise.all([
    getSmallGroupTemplateBySlug(templateSlug),
    listPublicRunRows({
      templateSlug,
      status: {
        notIn: [SmallGroupProgrammeStatus.draft, SmallGroupProgrammeStatus.archived],
      },
    }),
  ]);

  const runsWithAvailability = await mapRunRowsWithAvailability(rows);
  const fallbackTemplate = runsWithAvailability[0]?.row || null;
  const template = getTemplateNarrative(
    templateFromContent || (fallbackTemplate ? buildTemplateFromRun(fallbackTemplate) : null),
    fallbackTemplate
  );
  if (!template) return null;

  return {
    id: template.id,
    slug: template.slug,
    title: template.title,
    subtitle: template.subtitle ?? null,
    shortSummary: template.shortSummary,
    longDescription: template.longDescription || template.fullDescription || null,
    durationLabel: template.durationLabel,
    durationWeeks: template.durationWeeks ?? null,
    cohortSize: template.cohortSize,
    sessionsPerWeek: template.sessionsPerWeek ?? null,
    defaultPricePence: template.defaultPricePence ?? null,
    outcomes: template.outcomes,
    whoItsFor: template.whoItsFor ?? [],
    equipment: template.equipment ?? [],
    inclusions: template.inclusions ?? [],
    weekByWeek: template.weekByWeek ?? [],
    detailHref: buildSmallGroupTemplateHref(template.slug),
    runs: runsWithAvailability.map((item) => item.summary).sort(sortRunSummaries),
  };
}

export async function getPublicProgrammeCheckoutState(
  templateSlug: string,
  runSlug?: string | null
): Promise<PublicProgrammeCheckoutState> {
  const template = await getPublicSmallGroupProgrammeBySlug(templateSlug);
  if (!template) {
    return { template: null, run: null };
  }

  const selectedRun =
    (runSlug ? template.runs.find((run) => run.runSlug === runSlug) : null) ||
    template.runs.find((run) => run.canCheckout) ||
    template.runs[0] ||
    null;

  return {
    template,
    run: selectedRun,
  };
}

async function getOrCreateStripeCustomer(input: { userId: string; email: string; name: string }) {
  const existing = await db.user.findUnique({
    where: { id: input.userId },
    select: { stripeCustomerId: true },
  });
  if (!existing) throw new Error("USER_NOT_FOUND");
  if (existing.stripeCustomerId) return existing.stripeCustomerId;

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: input.email,
    name: input.name,
    metadata: { userId: input.userId },
  });

  await db.user.update({
    where: { id: input.userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function createSmallGroupCheckout(input: {
  templateSlug: string;
  runSlug: string;
  purchaseMode: "self" | "gift";
  userId?: string | null;
  purchaserFirstName: string;
  purchaserLastName: string;
  purchaserEmail: string;
  attendeeFirstName?: string;
  attendeeLastName?: string;
  attendeeEmail?: string;
  recipientFirstName?: string;
  recipientLastName?: string;
  recipientEmail?: string;
  recipientMessage?: string;
  deliveryTarget?: "recipient" | "buyer";
  acceptedTermsVersion?: string | null;
}) {
  const requiresMemberCompliance = input.purchaseMode === "self";
  if (requiresMemberCompliance && !input.userId) {
    throw new Error("AUTH_REQUIRED_FOR_PROGRAMME_CHECKOUT");
  }

  if (input.userId) {
    await assertNoUserCheckoutDisputeHold(input.userId);
  }

  const acceptanceStates = input.userId
    ? await assertCurrentAcceptances(
        input.userId,
        input.purchaseMode === "gift"
          ? [{ type: AcceptanceType.terms, surface: "small_group_gift_checkout" }]
          : [
              { type: AcceptanceType.terms, surface: "small_group_checkout" },
              { type: AcceptanceType.health_waiver, surface: "small_group_checkout" },
            ]
      )
    : null;
  const guestGiftTermsPolicy =
    input.purchaseMode === "gift" && !input.userId
      ? await getCurrentPolicyVersion(AcceptanceType.terms)
      : null;
  if (guestGiftTermsPolicy && input.acceptedTermsVersion !== guestGiftTermsPolicy.version) {
    throw new Error("PROGRAMME_LEGAL_ACCEPTANCE_REQUIRED");
  }

  const programme = await getRunByRunSlug(input.runSlug);
  if (!programme || programme.templateSlug !== input.templateSlug) {
    throw new Error("PROGRAMME_NOT_FOUND");
  }

  const availability = calculateAvailability({
    cohortSize: programme.cohortSize,
    ...(await getReservedRunCounts(programme.id)),
  });
  const isOpenForSale =
    (programme.status === SmallGroupProgrammeStatus.open ||
      programme.status === SmallGroupProgrammeStatus.upcoming) &&
    availability.spotsRemaining > 0;

  if (!isOpenForSale) {
    throw new Error("PROGRAMME_UNAVAILABLE");
  }

  const purchaserFirstName = normalizeText(input.purchaserFirstName, 80);
  const purchaserLastName = normalizeText(input.purchaserLastName, 80);
  const purchaserEmail = normalizeEmail(input.purchaserEmail);
  const stripe = getStripeClient();
  const purchaserName = `${purchaserFirstName} ${purchaserLastName}`.trim();
  const customerId = input.userId
    ? await getOrCreateStripeCustomer({
        userId: input.userId,
        email: purchaserEmail,
        name: purchaserName,
      })
    : undefined;
  const successUrl = buildAbsoluteUrl(
    buildSmallGroupTemplateCheckoutHref(programme.templateSlug, programme.runSlug, {
      gift: input.purchaseMode === "gift",
      checkoutState: "success",
    })
  );
  const cancelUrl = buildAbsoluteUrl(
    buildSmallGroupTemplateCheckoutHref(programme.templateSlug, programme.runSlug, {
      gift: input.purchaseMode === "gift",
      checkoutState: "cancelled",
    })
  );

  if (input.purchaseMode === "gift") {
    const recipientFirstName = normalizeText(input.recipientFirstName || "", 80);
    const recipientLastName = normalizeText(input.recipientLastName || "", 80);
    const recipientEmail = normalizeEmail(input.recipientEmail || "");
    if (!recipientFirstName || !recipientLastName || !recipientEmail) {
      throw new Error("RECIPIENT_REQUIRED");
    }

    const gift = await db.giftPurchase.create({
      data: {
        code: `GIFT-SG-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        type: "small_group",
        status: GiftPurchaseStatus.pending_payment,
        purchaserUserId: input.userId || undefined,
        purchaserFirstName,
        purchaserLastName,
        purchaserEmail,
        recipientFirstName,
        recipientLastName,
        recipientEmail,
        recipientMessage: normalizeText(input.recipientMessage || "", 1000) || null,
        deliveryTarget: input.deliveryTarget === "buyer" ? "buyer" : "recipient",
        productSlug: programme.templateSlug,
        productTitleSnapshot: programme.title,
        smallGroupProgrammeId: programme.id,
        currency: "GBP",
        totalPaidPence: programme.pricePence,
        expiresAt: new Date(Date.now() + PROGRAMME_PAYMENT_WINDOW_MS),
      },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      customer_email: customerId ? undefined : purchaserEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      billing_address_collection: "auto",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `${programme.title} gift`,
              description: "Reserved place in a small group programme",
            },
            unit_amount: programme.pricePence,
          },
          quantity: 1,
        },
      ],
      metadata: {
        kind: "small_group_gift",
        giftPurchaseId: gift.id,
        programmeRunSlug: programme.runSlug,
        templateSlug: programme.templateSlug,
        userId: input.userId || "",
      },
    });

    if (!session.url) throw new Error("STRIPE_CHECKOUT_URL_MISSING");

    await db.giftPurchase.update({
      where: { id: gift.id },
      data: { stripeCheckoutSessionId: session.id },
    });

    if (!input.userId) {
      if (!guestGiftTermsPolicy) throw new Error("PROGRAMME_LEGAL_ACCEPTANCE_REQUIRED");
      await db.guestAcceptanceEvent.create({
        data: {
          purchaserEmail,
          type: AcceptanceType.terms,
          policyVersionId: guestGiftTermsPolicy.id,
          version: guestGiftTermsPolicy.version,
          acceptanceSurface: "small_group_gift_checkout_guest",
          acceptedAt: new Date(),
          giftPurchaseId: gift.id,
          metadataJson: {
            purchaseMode: "gift",
            templateSlug: programme.templateSlug,
            programmeId: programme.id,
          },
        },
      });
    }

    return { checkoutUrl: session.url, giftPurchaseId: gift.id };
  }

  const attendeeFirstName = normalizeText(input.attendeeFirstName || input.purchaserFirstName, 80);
  const attendeeLastName = normalizeText(input.attendeeLastName || input.purchaserLastName, 80);
  const attendeeEmail = normalizeEmail(input.attendeeEmail || purchaserEmail);

  if (!attendeeFirstName || !attendeeLastName || !attendeeEmail) {
    throw new Error("ATTENDEE_REQUIRED");
  }

  const enrollment = await db.smallGroupProgrammeEnrollment.create({
    data: {
      programmeId: programme.id,
      userId: input.userId || undefined,
      attendeeName: `${attendeeFirstName} ${attendeeLastName}`.trim(),
      attendeeEmail,
      status: SmallGroupEnrollmentStatus.pending_payment,
      pricePaidPence: programme.pricePence,
      currency: "GBP",
      paymentWindowExpiresAt: new Date(Date.now() + PROGRAMME_PAYMENT_WINDOW_MS),
      complianceSnapshotJson: acceptanceStates
        ? {
            acceptanceStates: acceptanceStates.map((state) => ({
              type: state.type,
              policyVersionId: state.policyVersionId,
              acceptanceEventId: state.acceptanceEventId,
              version: state.currentVersion,
              surface: state.surface,
            })),
            programmeId: programme.id,
          }
        : undefined,
    },
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    customer_email: customerId ? undefined : purchaserEmail,
    success_url: successUrl,
    cancel_url: cancelUrl,
    billing_address_collection: "auto",
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: {
            name: programme.title,
            description: programme.durationLabel,
          },
          unit_amount: programme.pricePence,
        },
        quantity: 1,
      },
    ],
    metadata: {
      kind: "small_group_purchase",
      enrolmentId: enrollment.id,
      programmeRunSlug: programme.runSlug,
      templateSlug: programme.templateSlug,
      userId: input.userId || "",
    },
  });

  if (!session.url) throw new Error("STRIPE_CHECKOUT_URL_MISSING");

  await db.smallGroupProgrammeEnrollment.update({
    where: { id: enrollment.id },
    data: { stripeCheckoutSessionId: session.id },
  });

  return { checkoutUrl: session.url, enrolmentId: enrollment.id };
}

export async function processSmallGroupCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.metadata?.kind !== "small_group_purchase") {
    return false;
  }
  const enrolmentId = session.metadata?.enrolmentId;
  if (!enrolmentId) return false;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  await db.smallGroupProgrammeEnrollment.update({
    where: { id: enrolmentId },
    data: {
      status: SmallGroupEnrollmentStatus.active,
      stripePaymentIntentId: paymentIntentId || undefined,
      paymentWindowExpiresAt: null,
    },
  });

  return true;
}

async function resolveTemplateForRun(row: NonNullable<SmallGroupRunRow>) {
  return (await getSmallGroupTemplateBySlug(row.templateSlug)) || buildTemplateFromRun(row);
}

export async function listMySmallGroupProgrammes(
  userId: string
): Promise<MemberSmallGroupSummary[]> {
  const rows = await db.smallGroupProgramme.findMany({
    orderBy: [{ startDate: "asc" }, { title: "asc" }],
    include: {
      sessions: {
        orderBy: { startsAt: "asc" },
      },
      enrollments: {
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return Promise.all(
    rows.map(async (row) => {
      const template = await resolveTemplateForRun(row);
      const enrolment = row.enrollments[0] || null;
      const nextSession = row.sessions.find((session) => session.startsAt >= new Date()) || null;
      const availability = calculateAvailability({
        cohortSize: row.cohortSize,
        ...(await getReservedRunCounts(row.id)),
      });
      const summary = toRunSummary(row, availability);

      return {
        ...summary,
        title: template.title,
        subtitle: template.subtitle ?? null,
        shortSummary: template.shortSummary,
        enrolled: Boolean(enrolment),
        enrolmentId: enrolment?.id || null,
        enrolmentStatus: enrolment?.status || null,
        sessionsAttended: enrolment?.sessionsAttended || 0,
        nextSessionStartsAt: nextSession?.startsAt.toISOString() || null,
        progressSummary: enrolment?.progressSummary || null,
        publicHref: buildSmallGroupTemplateHref(row.templateSlug),
      };
    })
  );
}

export async function getMySmallGroupProgrammeDetail(
  userId: string,
  idOrRunSlug: string
): Promise<MemberSmallGroupDetail | null> {
  const row = await db.smallGroupProgramme.findFirst({
    where: {
      OR: [{ id: idOrRunSlug }, { runSlug: idOrRunSlug }, { slug: idOrRunSlug }],
    },
    include: {
      sessions: {
        orderBy: { startsAt: "asc" },
      },
      enrollments: {
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!row) return null;

  const template = await resolveTemplateForRun(row);
  const enrolment = row.enrollments[0] || null;
  const nextSession = row.sessions.find((session) => session.startsAt >= new Date()) || null;
  const availability = calculateAvailability({
    cohortSize: row.cohortSize,
    ...(await getReservedRunCounts(row.id)),
  });
  const summary = toRunSummary(row, availability);

  return {
    ...summary,
    title: template.title,
    subtitle: template.subtitle ?? null,
    shortSummary: template.shortSummary,
    enrolled: Boolean(enrolment),
    enrolmentId: enrolment?.id || null,
    enrolmentStatus: enrolment?.status || null,
    sessionsAttended: enrolment?.sessionsAttended || 0,
    nextSessionStartsAt: nextSession?.startsAt.toISOString() || null,
    progressSummary: enrolment?.progressSummary || null,
    publicHref: buildSmallGroupTemplateHref(row.templateSlug),
    longDescription:
      template.longDescription || template.fullDescription || row.description || null,
    outcomes: template.outcomes,
    whoItsFor: template.whoItsFor ?? [],
    equipment: template.equipment ?? [],
    inclusions: template.inclusions ?? [],
    weekByWeek: template.weekByWeek ?? [],
    sessions: row.sessions.map((session) => ({
      id: session.id,
      title: session.title,
      sequenceNumber: session.sequenceNumber,
      startsAt: session.startsAt.toISOString(),
      endsAt: session.endsAt?.toISOString() || null,
      status: session.status,
    })),
  };
}

export async function listAdminSmallGroupProgrammes(): Promise<AdminSmallGroupSummary[]> {
  const rows = await db.smallGroupProgramme.findMany({
    orderBy: [{ startDate: "asc" }, { title: "asc" }],
    include: {
      sessions: true,
      enrollments: true,
    },
  });

  return Promise.all(
    rows.map(async (row) => {
      const template = await resolveTemplateForRun(row);
      const availability = calculateAvailability({
        cohortSize: row.cohortSize,
        ...(await getReservedRunCounts(row.id)),
      });
      const summary = toRunSummary(row, availability);
      return {
        ...summary,
        title: template.title,
        subtitle: template.subtitle ?? null,
        shortSummary: template.shortSummary,
        runHref: buildAdminSmallGroupRunHref(row.runSlug),
        enrolmentCount: row.enrollments.length,
        activeEnrolmentCount: row.enrollments.filter(
          (item) =>
            item.status === SmallGroupEnrollmentStatus.active ||
            item.status === SmallGroupEnrollmentStatus.completed
        ).length,
        sessionCount: row.sessions.length,
        completedSessionCount: row.sessions.filter(
          (session) => session.status === SmallGroupSessionStatus.completed
        ).length,
      };
    })
  );
}

export async function getAdminSmallGroupProgrammeDetail(
  idOrRunSlug: string
): Promise<AdminSmallGroupDetail | null> {
  const row = await db.smallGroupProgramme.findFirst({
    where: {
      OR: [{ id: idOrRunSlug }, { runSlug: idOrRunSlug }, { slug: idOrRunSlug }],
    },
    include: {
      sessions: {
        orderBy: { startsAt: "asc" },
      },
      enrollments: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!row) return null;

  const template = await resolveTemplateForRun(row);
  const availability = calculateAvailability({
    cohortSize: row.cohortSize,
    ...(await getReservedRunCounts(row.id)),
  });
  const summary = toRunSummary(row, availability);

  return {
    ...summary,
    title: template.title,
    subtitle: template.subtitle ?? null,
    shortSummary: template.shortSummary,
    runHref: buildAdminSmallGroupRunHref(row.runSlug),
    enrolmentCount: row.enrollments.length,
    activeEnrolmentCount: row.enrollments.filter(
      (item) =>
        item.status === SmallGroupEnrollmentStatus.active ||
        item.status === SmallGroupEnrollmentStatus.completed
    ).length,
    sessionCount: row.sessions.length,
    completedSessionCount: row.sessions.filter(
      (session) => session.status === SmallGroupSessionStatus.completed
    ).length,
    longDescription:
      template.longDescription || template.fullDescription || row.description || null,
    outcomes: template.outcomes,
    whoItsFor: template.whoItsFor ?? [],
    equipment: template.equipment ?? [],
    inclusions: template.inclusions ?? [],
    weekByWeek: template.weekByWeek ?? [],
    enrolments: row.enrollments.map((item) => ({
      id: item.id,
      userId: item.userId,
      attendeeName: item.attendeeName,
      attendeeEmail: item.attendeeEmail,
      status: item.status,
      sessionsAttended: item.sessionsAttended,
      progressSummary: item.progressSummary,
    })),
    sessions: row.sessions.map((session) => ({
      id: session.id,
      title: session.title,
      sequenceNumber: session.sequenceNumber,
      startsAt: session.startsAt.toISOString(),
      endsAt: session.endsAt?.toISOString() || null,
      status: session.status,
    })),
  };
}
