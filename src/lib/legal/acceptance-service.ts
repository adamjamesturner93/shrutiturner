import { AcceptanceType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentPolicyVersion, getCurrentPolicyVersions } from "@/lib/legal/policy-service";

export type AcceptanceRequirement = {
  type: AcceptanceType;
  surface: string;
};

export type AcceptanceRequirementState = {
  type: AcceptanceType;
  surface: string;
  currentVersion: string;
  acceptedVersion: string | null;
  policyVersionId: string;
  acceptanceEventId: string | null;
  isCurrent: boolean;
};

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

    return {
      type: requirement.type,
      surface: requirement.surface,
      currentVersion: policy.version,
      acceptedVersion: accepted?.version || null,
      policyVersionId: policy.id,
      acceptanceEventId: accepted?.id || null,
      isCurrent: accepted?.version === policy.version,
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
