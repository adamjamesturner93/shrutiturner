import { AcceptanceType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentPolicyVersion, getCurrentPolicyVersions } from "@/lib/legal/policy-service";

export type AcceptanceRequirement = {
  type: AcceptanceType;
  surface: string;
  maxAgeDays?: number;
};

export type AcceptanceRequirementState = {
  type: AcceptanceType;
  surface: string;
  currentVersion: string;
  acceptedVersion: string | null;
  acceptedAt: string | null;
  expiresAt: string | null;
  policyVersionId: string;
  acceptanceEventId: string | null;
  isCurrent: boolean;
  staleReason: "missing" | "version" | "expired" | null;
};

export const PHYSICAL_SERVICE_HEALTH_WAIVER_MAX_AGE_DAYS = 365;

const DAY_MS = 24 * 60 * 60 * 1000;

export function isAcceptanceDateFresh(
  acceptedAt: Date | string | null | undefined,
  maxAgeDays?: number,
  now = new Date()
) {
  if (!acceptedAt) return false;
  if (!maxAgeDays) return true;

  const acceptedDate = typeof acceptedAt === "string" ? new Date(acceptedAt) : acceptedAt;
  if (Number.isNaN(acceptedDate.getTime())) return false;

  return now.getTime() - acceptedDate.getTime() < maxAgeDays * DAY_MS;
}

export function getPhysicalServiceAcceptanceRequirements(surface: string): AcceptanceRequirement[] {
  return [
    { type: AcceptanceType.terms, surface },
    {
      type: AcceptanceType.health_waiver,
      surface,
      maxAgeDays: PHYSICAL_SERVICE_HEALTH_WAIVER_MAX_AGE_DAYS,
    },
    { type: AcceptanceType.health_data, surface },
  ];
}

export class AcceptanceRequiredError extends Error {
  details: {
    code: "LEGAL_ACCEPTANCE_REQUIRED";
    requiredAcceptances: AcceptanceRequirementState[];
  };

  constructor(requiredAcceptances: AcceptanceRequirementState[]) {
    super("LEGAL_ACCEPTANCE_REQUIRED");
    this.details = {
      code: "LEGAL_ACCEPTANCE_REQUIRED",
      requiredAcceptances,
    };
  }
}

function summaryUserAcceptanceUpdate(
  type: AcceptanceType,
  currentVersion: string,
  acceptedAt: Date
): Prisma.UserUpdateInput {
  if (type === AcceptanceType.terms) {
    return {
      hasAgreedToTerms: true,
      acceptedTermsVersion: currentVersion,
      termsAgreedAt: acceptedAt,
    };
  }

  if (type === AcceptanceType.health_waiver) {
    return {
      hasAgreedToHealth: true,
      acceptedHealthWaiverVersion: currentVersion,
      healthAgreedAt: acceptedAt,
    };
  }

  if (type === AcceptanceType.health_data) {
    return {
      hasConsentedToHealthData: true,
      acceptedHealthDataConsentVersion: currentVersion,
      healthDataConsentedAt: acceptedAt,
    };
  }

  return {};
}

export async function recordAcceptanceEvent(input: {
  userId: string;
  type: AcceptanceType;
  surface: string;
  actorUserId?: string | null;
  metadataJson?: Prisma.InputJsonValue;
}) {
  const policy = await getCurrentPolicyVersion(input.type);
  const acceptedAt = new Date();

  return db.$transaction(async (tx) => {
    const event = await tx.acceptanceEvent.create({
      data: {
        userId: input.userId,
        actorUserId: input.actorUserId || input.userId,
        type: input.type,
        policyVersionId: policy.id,
        version: policy.version,
        acceptanceSurface: input.surface,
        acceptedAt,
        metadataJson: input.metadataJson,
      },
    });

    const userUpdate = summaryUserAcceptanceUpdate(input.type, policy.version, acceptedAt);
    if (Object.keys(userUpdate).length > 0) {
      await tx.user.update({
        where: { id: input.userId },
        data: userUpdate,
      });
    }

    return event;
  });
}

export class AcceptanceVersionChangedError extends Error {
  constructor() {
    super("ACCEPTANCE_VERSION_CHANGED");
  }
}

export async function recordAcknowledgedAcceptances(input: {
  userId: string;
  surface: string;
  acceptances: Array<{
    type: AcceptanceType;
    policyVersionId: string;
    version: string;
    acknowledged: true;
  }>;
}) {
  if (input.acceptances.length === 0) return [];
  const policies = await getCurrentPolicyVersions(input.acceptances.map((item) => item.type));
  for (const [index, acceptance] of input.acceptances.entries()) {
    const policy = policies[index];
    if (
      !policy ||
      policy.id !== acceptance.policyVersionId ||
      policy.version !== acceptance.version ||
      acceptance.acknowledged !== true
    ) {
      throw new AcceptanceVersionChangedError();
    }
  }

  const acceptedAt = new Date();
  return db.$transaction(async (tx) => {
    const events: Array<{
      id: string;
      type: AcceptanceType;
      version: string;
      acceptedAt: Date;
    }> = [];
    let userUpdate: Prisma.UserUpdateInput = {};
    for (const [index, acceptance] of input.acceptances.entries()) {
      const policy = policies[index];
      const event = await tx.acceptanceEvent.create({
        data: {
          userId: input.userId,
          actorUserId: input.userId,
          type: acceptance.type,
          policyVersionId: policy.id,
          version: policy.version,
          acceptanceSurface: input.surface,
          acceptedAt,
          metadataJson: {
            acknowledgementMethod: "explicit_checkbox",
            acknowledged: true,
          },
        },
      });
      events.push(event);
      userUpdate = {
        ...userUpdate,
        ...summaryUserAcceptanceUpdate(acceptance.type, policy.version, acceptedAt),
      };
    }
    if (Object.keys(userUpdate).length > 0) {
      await tx.user.update({ where: { id: input.userId }, data: userUpdate });
    }
    return events;
  });
}

export async function getAcceptanceRequirementStates(
  userId: string,
  requirements: AcceptanceRequirement[]
) {
  const policies = await getCurrentPolicyVersions(
    requirements.map((requirement) => requirement.type)
  );
  const events = await db.acceptanceEvent.findMany({
    where: {
      userId,
      type: { in: requirements.map((requirement) => requirement.type) },
    },
    orderBy: { acceptedAt: "desc" },
  });

  const latestByType = new Map<AcceptanceType, (typeof events)[number]>();
  for (const event of events) {
    if (!latestByType.has(event.type)) {
      latestByType.set(event.type, event);
    }
  }

  return requirements.map((requirement, index) => {
    const policy = policies[index];
    const accepted = latestByType.get(requirement.type) || null;
    const hasCurrentVersion = accepted?.version === policy.version;
    const isFresh = isAcceptanceDateFresh(accepted?.acceptedAt, requirement.maxAgeDays);
    const expiresAt =
      accepted?.acceptedAt && requirement.maxAgeDays
        ? new Date(accepted.acceptedAt.getTime() + requirement.maxAgeDays * DAY_MS)
        : null;
    const isCurrent = hasCurrentVersion && isFresh;
    const staleReason: AcceptanceRequirementState["staleReason"] = !accepted
      ? "missing"
      : !hasCurrentVersion
        ? "version"
        : !isFresh
          ? "expired"
          : null;

    return {
      type: requirement.type,
      surface: requirement.surface,
      currentVersion: policy.version,
      acceptedVersion: accepted?.version || null,
      acceptedAt: accepted?.acceptedAt.toISOString() || null,
      expiresAt: expiresAt?.toISOString() || null,
      policyVersionId: policy.id,
      acceptanceEventId: accepted?.id || null,
      isCurrent,
      staleReason,
    };
  });
}

export async function assertCurrentAcceptances(
  userId: string,
  requirements: AcceptanceRequirement[]
) {
  if (requirements.length === 0) return [];

  const states = await getAcceptanceRequirementStates(userId, requirements);
  const missing = states.filter((state) => !state.isCurrent);

  if (missing.length > 0) {
    throw new AcceptanceRequiredError(missing);
  }

  return states;
}

export function isAcceptanceRequiredError(error: unknown): error is AcceptanceRequiredError {
  return (
    error instanceof AcceptanceRequiredError ||
    (error instanceof Error && error.message === "LEGAL_ACCEPTANCE_REQUIRED" && "details" in error)
  );
}
