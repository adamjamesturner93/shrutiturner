import { AcceptanceType } from "@prisma/client";
import { db } from "@/lib/db";
import {
  CURRENT_HEALTH_DATA_CONSENT_VERSION,
  CURRENT_HEALTH_WAIVER_VERSION,
  CURRENT_COACHING_AGREEMENT_VERSION,
  CURRENT_TERMS_VERSION,
} from "@/data/legal-documents";

type PolicySeed = {
  type: AcceptanceType;
  slug: string;
  version: string;
  label: string;
  contentSource?: string;
};

const DEFAULT_POLICY_SEEDS: PolicySeed[] = [
  {
    type: AcceptanceType.terms,
    slug: "terms",
    version: CURRENT_TERMS_VERSION,
    label: "Terms and Conditions",
  },
  {
    type: AcceptanceType.health_waiver,
    slug: "health-declaration",
    version: CURRENT_HEALTH_WAIVER_VERSION,
    label: "Health Waiver",
  },
  {
    type: AcceptanceType.health_data,
    slug: "health-data-consent",
    version: CURRENT_HEALTH_DATA_CONSENT_VERSION,
    label: "Health Data Consent",
  },
  {
    type: AcceptanceType.coaching_agreement,
    slug: "coaching-agreement",
    version: CURRENT_COACHING_AGREEMENT_VERSION,
    label: "Coaching Agreement",
  },
  {
    type: AcceptanceType.recording_notice,
    slug: "recording-notice",
    version: "recording-notice.v1",
    label: "Recording Notice",
  },
  {
    type: AcceptanceType.immediate_start,
    slug: "immediate-start",
    version: "immediate-start.v1",
    label: "Immediate Start Acknowledgement",
  },
  {
    type: AcceptanceType.marketing,
    slug: "marketing-consent",
    version: "marketing-consent.v1",
    label: "Marketing Consent",
  },
];

let hasEnsuredCurrentPolicies = false;

export async function ensureCurrentPolicyVersions() {
  if (hasEnsuredCurrentPolicies) return;

  await db.$transaction(
    DEFAULT_POLICY_SEEDS.map((seed) =>
      db.policyDocumentVersion.upsert({
        where: {
          type_version: {
            type: seed.type,
            version: seed.version,
          },
        },
        create: {
          type: seed.type,
          slug: seed.slug,
          version: seed.version,
          label: seed.label,
          contentSource: seed.contentSource || "app",
          publishedAt: new Date(),
          isCurrent: true,
        },
        update: {
          slug: seed.slug,
          label: seed.label,
          contentSource: seed.contentSource || "app",
          isCurrent: true,
        },
      })
    )
  );

  await Promise.all(
    DEFAULT_POLICY_SEEDS.map((seed) =>
      db.policyDocumentVersion.updateMany({
        where: {
          type: seed.type,
          NOT: { version: seed.version },
        },
        data: {
          isCurrent: false,
        },
      })
    )
  );

  hasEnsuredCurrentPolicies = true;
}

export async function getCurrentPolicyVersion(type: AcceptanceType) {
  await ensureCurrentPolicyVersions();

  const policy = await db.policyDocumentVersion.findFirst({
    where: { type, isCurrent: true },
    orderBy: { publishedAt: "desc" },
  });

  if (!policy) {
    throw new Error(`CURRENT_POLICY_NOT_FOUND:${type}`);
  }

  return policy;
}

export async function getCurrentPolicyVersions(types: AcceptanceType[]) {
  await ensureCurrentPolicyVersions();

  const policies = await db.policyDocumentVersion.findMany({
    where: {
      type: { in: types },
      isCurrent: true,
    },
  });

  const byType = new Map(policies.map((policy) => [policy.type, policy]));

  return types.map((type) => {
    const policy = byType.get(type);
    if (!policy) {
      throw new Error(`CURRENT_POLICY_NOT_FOUND:${type}`);
    }
    return policy;
  });
}
