/* ──────────── Health Profile Data Model ──────────── */

export interface HealthConditionItem {
  key: string;
  label: string;
  hasDetails?: boolean;
  detailsPlaceholder?: string;
}

export interface HealthCategory {
  id: string;
  title: string;
  description: string;
  icon: string; // lucide icon name
  items: HealthConditionItem[];
}

export const HEALTH_CATEGORIES: HealthCategory[] = [
  {
    id: "pain_injury",
    title: "Pain & Injury Sites",
    description:
      "Current or recurring pain, or sites of previous injury that may affect your movement.",
    icon: "body",
    items: [
      { key: "ankle_pain_injury", label: "Ankle" },
      { key: "knee_pain_injury", label: "Knee" },
      { key: "hip_pain_injury", label: "Hip" },
      { key: "back_pain_injury", label: "Back" },
      { key: "neck_pain_injury", label: "Neck" },
      { key: "shoulder_pain_injury", label: "Shoulder" },
      { key: "elbow_pain_injury", label: "Elbow" },
      { key: "wrist_pain_injury", label: "Wrist" },
    ],
  },
  {
    id: "physical",
    title: "Physical Health",
    description: "Conditions that may affect how you move, breathe, or recover.",
    icon: "heart-pulse",
    items: [
      { key: "asthma", label: "Asthma" },
      { key: "low_blood_pressure", label: "Low blood pressure" },
      { key: "high_blood_pressure", label: "High blood pressure" },
      { key: "osteoarthritis", label: "Osteoarthritis" },
      { key: "diabetes", label: "Diabetes" },
      { key: "heart_condition", label: "Heart condition" },
      { key: "pregnant", label: "Pregnant" },
      { key: "postpartum", label: "Postpartum" },
      { key: "diastasis_recti", label: "Diastasis recti" },
      {
        key: "limb_difference",
        label: "Limb difference",
        hasDetails: true,
        detailsPlaceholder: "e.g. below-knee amputation, congenital...",
      },
      {
        key: "autoimmune",
        label: "Autoimmune condition",
        hasDetails: true,
        detailsPlaceholder: "e.g. rheumatoid arthritis, lupus, psoriatic arthritis, MS...",
      },
      {
        key: "physical_other",
        label: "Other physical condition",
        hasDetails: true,
        detailsPlaceholder: "Describe your condition...",
      },
    ],
  },
  {
    id: "mental",
    title: "Mental Health",
    description:
      "Conditions that may affect your energy, focus, or how you experience group settings.",
    icon: "brain",
    items: [
      { key: "ptsd", label: "PTSD" },
      { key: "anxiety", label: "Anxiety" },
      { key: "depression", label: "Depression" },
      { key: "stress_burnout", label: "Stress / burnout" },
      { key: "seasonal_affective_disorder", label: "Seasonal affective disorder (SAD)" },
      {
        key: "mental_other",
        label: "Other",
        hasDetails: true,
        detailsPlaceholder: "Describe if you'd like to...",
      },
    ],
  },
  {
    id: "neurodivergence",
    title: "Neurodivergence",
    description: "This helps Shruti adapt communication, pacing and sensory environment.",
    icon: "sparkles",
    items: [
      { key: "adhd", label: "ADHD" },
      { key: "asd", label: "Autism (ASD)" },
      { key: "bipolar", label: "Bipolar disorder" },
      { key: "bpd", label: "Borderline personality disorder (BPD)" },
      { key: "ds", label: "Down's syndrome" },
      { key: "dyscalculia", label: "Dyscalculia" },
      { key: "dyslexia", label: "Dyslexia" },
      { key: "dyspraxia", label: "Dyspraxia" },
      { key: "epilepsy", label: "Epilepsy" },
      { key: "ocd", label: "OCD" },
      { key: "tourettes", label: "Tourette's syndrome" },
      {
        key: "neuro_other",
        label: "Other",
        hasDetails: true,
        detailsPlaceholder: "Describe if you'd like to...",
      },
    ],
  },
];

// Flat map of all condition keys
export type HealthConditionKey = string;

export interface HealthProfile {
  declarationStatus: "incomplete" | "none_declared" | "context_declared";
  conditions: Record<string, boolean>;
  details: Record<string, string>;
  tracksFlareCheckIns: boolean;
  additionalNotes: string;
  lastConfirmedAt: string;
  lastUpdated: string;
  needsReview?: boolean;
}

export const EMPTY_HEALTH_PROFILE: HealthProfile = {
  declarationStatus: "incomplete",
  conditions: {},
  details: {},
  tracksFlareCheckIns: false,
  additionalNotes: "",
  lastConfirmedAt: "",
  lastUpdated: "",
  needsReview: false,
};

export function normalizeHealthProfile(profile?: Partial<HealthProfile> | null): HealthProfile {
  return {
    ...EMPTY_HEALTH_PROFILE,
    ...profile,
    declarationStatus: profile?.declarationStatus || EMPTY_HEALTH_PROFILE.declarationStatus,
    conditions:
      profile?.conditions && typeof profile.conditions === "object" ? profile.conditions : {},
    details: profile?.details && typeof profile.details === "object" ? profile.details : {},
    tracksFlareCheckIns: Boolean(profile?.tracksFlareCheckIns),
    additionalNotes: profile?.additionalNotes || "",
    lastConfirmedAt: profile?.lastConfirmedAt || "",
    lastUpdated: profile?.lastUpdated || "",
    needsReview: Boolean(profile?.needsReview),
  };
}

export function normalizeHealthProfileApiResponse(payload: unknown): HealthProfile {
  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as { data?: unknown }).data;
    if (data && typeof data === "object") {
      return normalizeHealthProfile(data as Partial<HealthProfile>);
    }
  }

  return normalizeHealthProfile(
    payload && typeof payload === "object" ? (payload as Partial<HealthProfile>) : null
  );
}

// Mock data for Sarah Chen (our test user)
export const MOCK_HEALTH_PROFILE: HealthProfile = {
  declarationStatus: "context_declared",
  conditions: {
    shoulder_pain_injury: true,
    wrist_pain_injury: true,
    autoimmune: true,
    anxiety: true,
  },
  details: {
    autoimmune:
      "Rheumatoid arthritis — diagnosed 2019. Currently on methotrexate. Flares affect hands and shoulders most.",
  },
  tracksFlareCheckIns: true,
  additionalNotes:
    "Morning stiffness usually lasts 30-45 mins. Better after warm-up. Prefer not to bear weight on wrists for extended periods.",
  lastConfirmedAt: "2026-01-15",
  lastUpdated: "2026-01-15",
  needsReview: false,
};

// Mock health profiles keyed by member ID — used by admin views
export const MEMBER_HEALTH_PROFILES: Record<string, HealthProfile> = {
  usr_001: {
    declarationStatus: "context_declared",
    conditions: {
      shoulder_pain_injury: true,
      wrist_pain_injury: true,
      autoimmune: true,
      anxiety: true,
    },
    details: {
      autoimmune:
        "Rheumatoid arthritis — diagnosed 2019. Currently on methotrexate. Flares affect hands and shoulders most.",
    },
    tracksFlareCheckIns: true,
    additionalNotes:
      "Morning stiffness usually lasts 30-45 mins. Better after warm-up. Prefer not to bear weight on wrists for extended periods.",
    lastConfirmedAt: "2026-01-15",
    lastUpdated: "2026-01-15",
    needsReview: false,
  },
  usr_002: {
    declarationStatus: "context_declared",
    conditions: {
      hip_pain_injury: true,
      shoulder_pain_injury: true,
      physical_other: true,
      adhd: true,
    },
    details: {
      physical_other:
        "hEDS (hypermobile Ehlers-Danlos syndrome) — diagnosed 2020. Joint instability throughout, worst in shoulders and hips.",
    },
    tracksFlareCheckIns: true,
    additionalNotes:
      "Proprioception is poor — benefits from mirror/visual feedback. Needs slower tempo for layered movements.",
    lastConfirmedAt: "2026-02-01",
    lastUpdated: "2026-02-01",
    needsReview: false,
  },
  usr_003: {
    declarationStatus: "context_declared",
    conditions: {
      back_pain_injury: true,
      knee_pain_injury: true,
      autoimmune: true,
      depression: true,
      stress_burnout: true,
    },
    details: {
      autoimmune: "Psoriatic arthritis — mainly affects knees and lower back. On biologics.",
    },
    tracksFlareCheckIns: true,
    additionalNotes:
      "Energy very variable. Some days can do full session, others need to scale right back. Appreciates check-ins.",
    lastConfirmedAt: "2026-02-10",
    lastUpdated: "2026-02-10",
    needsReview: false,
  },
  usr_004: {
    declarationStatus: "context_declared",
    conditions: {
      asthma: true,
      anxiety: true,
      ptsd: true,
    },
    tracksFlareCheckIns: false,
    details: {},
    additionalNotes:
      "Prefers not to close eyes during relaxation. Needs advance notice of any physical adjustments.",
    lastConfirmedAt: "2025-12-20",
    lastUpdated: "2025-12-20",
    needsReview: false,
  },
  usr_005: {
    declarationStatus: "context_declared",
    conditions: {
      pregnant: true,
      back_pain_injury: true,
      low_blood_pressure: true,
    },
    tracksFlareCheckIns: false,
    details: {},
    additionalNotes:
      "Currently 28 weeks. Avoiding supine positions. Has been training with Shruti for 8 months pre-pregnancy.",
    lastConfirmedAt: "2026-02-15",
    lastUpdated: "2026-02-15",
    needsReview: false,
  },
};

/** Get a summary of a member's health conditions as short labels */
export function getMemberHealthSummary(memberId: string): string[] {
  const profile = MEMBER_HEALTH_PROFILES[memberId];
  if (!profile) return [];

  const labels: string[] = [];
  for (const cat of HEALTH_CATEGORIES) {
    for (const item of cat.items) {
      if (profile.conditions[item.key]) {
        if (item.hasDetails && profile.details[item.key]) {
          // Use first part of details as label
          const detail = profile.details[item.key];
          const shortDetail = detail.split("—")[0].split("–")[0].trim();
          labels.push(shortDetail.length > 30 ? item.label : shortDetail);
        } else {
          labels.push(item.label);
        }
      }
    }
  }
  return labels;
}

/** Get structured health data grouped by category — for detailed admin views */
export interface HealthCategoryDetail {
  categoryId: string;
  categoryTitle: string;
  conditions: {
    label: string;
    detail?: string;
  }[];
}

export function getMemberHealthByCategory(memberId: string): HealthCategoryDetail[] {
  const profile = MEMBER_HEALTH_PROFILES[memberId];
  if (!profile) return [];

  const result: HealthCategoryDetail[] = [];
  for (const cat of HEALTH_CATEGORIES) {
    const conditions: HealthCategoryDetail["conditions"] = [];
    for (const item of cat.items) {
      if (profile.conditions[item.key]) {
        conditions.push({
          label: item.label,
          detail: profile.details[item.key] || undefined,
        });
      }
    }
    if (conditions.length > 0) {
      result.push({
        categoryId: cat.id,
        categoryTitle: cat.title,
        conditions,
      });
    }
  }
  return result;
}

/** Aggregate health conditions across multiple members — for class prep */
export interface AggregatedCondition {
  label: string;
  count: number;
  memberNames: string[];
  details: { memberName: string; detail: string }[];
}

export interface AggregatedCategory {
  categoryTitle: string;
  conditions: AggregatedCondition[];
}

export function aggregateHealthForClass(attendees: { memberId: string; memberName: string }[]): {
  categories: AggregatedCategory[];
  membersWithProfiles: number;
  totalMembers: number;
  keyConsiderations: string[];
} {
  const totalMembers = attendees.length;
  let membersWithProfiles = 0;

  // Collect per-condition data
  const conditionMap = new Map<
    string,
    {
      categoryTitle: string;
      label: string;
      count: number;
      memberNames: string[];
      details: { memberName: string; detail: string }[];
    }
  >();

  const keyConsiderations: string[] = [];

  for (const att of attendees) {
    const profile = MEMBER_HEALTH_PROFILES[att.memberId];
    if (!profile) continue;
    const hasAny = Object.values(profile.conditions).some(Boolean);
    if (hasAny) membersWithProfiles++;

    for (const cat of HEALTH_CATEGORIES) {
      for (const item of cat.items) {
        if (!profile.conditions[item.key]) continue;
        const mapKey = `${cat.id}::${item.key}`;
        const existing = conditionMap.get(mapKey);
        if (existing) {
          existing.count++;
          existing.memberNames.push(att.memberName);
          if (profile.details[item.key]) {
            existing.details.push({
              memberName: att.memberName,
              detail: profile.details[item.key],
            });
          }
        } else {
          conditionMap.set(mapKey, {
            categoryTitle: cat.title,
            label: item.label,
            count: 1,
            memberNames: [att.memberName],
            details: profile.details[item.key]
              ? [{ memberName: att.memberName, detail: profile.details[item.key] }]
              : [],
          });
        }
      }
    }

    // Collect key considerations from additional notes
    if (profile.additionalNotes) {
      keyConsiderations.push(`${att.memberName}: ${profile.additionalNotes}`);
    }
  }

  // Group into categories
  const categoryMap = new Map<string, AggregatedCondition[]>();
  for (const entry of conditionMap.values()) {
    const existing = categoryMap.get(entry.categoryTitle) || [];
    existing.push({
      label: entry.label,
      count: entry.count,
      memberNames: entry.memberNames,
      details: entry.details,
    });
    categoryMap.set(entry.categoryTitle, existing);
  }

  // Sort by the HEALTH_CATEGORIES order
  const categories: AggregatedCategory[] = [];
  for (const cat of HEALTH_CATEGORIES) {
    const conditions = categoryMap.get(cat.title);
    if (conditions && conditions.length > 0) {
      // Sort conditions by count descending
      conditions.sort((a, b) => b.count - a.count);
      categories.push({ categoryTitle: cat.title, conditions });
    }
  }

  return { categories, membersWithProfiles, totalMembers, keyConsiderations };
}
