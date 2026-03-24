import { db } from "@/lib/db";

export const DEFAULT_CLASS_OPERATIONAL_SETTINGS = {
  preJoinWindowMinutes: 10,
  lateJoinCutoffMinutes: 5,
  creditRefundWindowMinutes: 180,
  emptyClassAutoCancelWindowMinutes: 180,
} as const;

export type ClassOperationalSettingsDto = {
  preJoinWindowMinutes: number;
  lateJoinCutoffMinutes: number;
  creditRefundWindowMinutes: number;
  emptyClassAutoCancelWindowMinutes: number;
};

function sanitizeMinutes(value: number, fallback: number, min: number, max: number) {
  if (!Number.isFinite(value)) return fallback;
  const rounded = Math.round(value);
  if (rounded < min) return min;
  if (rounded > max) return max;
  return rounded;
}

function toDto(
  row: Partial<ClassOperationalSettingsDto> | null | undefined
): ClassOperationalSettingsDto {
  return {
    preJoinWindowMinutes: sanitizeMinutes(
      Number(row?.preJoinWindowMinutes),
      DEFAULT_CLASS_OPERATIONAL_SETTINGS.preJoinWindowMinutes,
      0,
      24 * 60
    ),
    lateJoinCutoffMinutes: sanitizeMinutes(
      Number(row?.lateJoinCutoffMinutes),
      DEFAULT_CLASS_OPERATIONAL_SETTINGS.lateJoinCutoffMinutes,
      0,
      60
    ),
    creditRefundWindowMinutes: sanitizeMinutes(
      Number(row?.creditRefundWindowMinutes),
      DEFAULT_CLASS_OPERATIONAL_SETTINGS.creditRefundWindowMinutes,
      0,
      7 * 24 * 60
    ),
    emptyClassAutoCancelWindowMinutes: sanitizeMinutes(
      Number(row?.emptyClassAutoCancelWindowMinutes),
      DEFAULT_CLASS_OPERATIONAL_SETTINGS.emptyClassAutoCancelWindowMinutes,
      0,
      7 * 24 * 60
    ),
  };
}

export async function getClassOperationalSettings(): Promise<ClassOperationalSettingsDto> {
  const row = await db.classOperationalSettings.findUnique({
    where: { id: "default" },
    select: {
      preJoinWindowMinutes: true,
      lateJoinCutoffMinutes: true,
      creditRefundWindowMinutes: true,
      emptyClassAutoCancelWindowMinutes: true,
    },
  });

  if (!row) {
    return DEFAULT_CLASS_OPERATIONAL_SETTINGS;
  }

  return toDto(row);
}

export async function updateClassOperationalSettings(
  input: Partial<ClassOperationalSettingsDto>
): Promise<ClassOperationalSettingsDto> {
  const next = toDto({
    ...DEFAULT_CLASS_OPERATIONAL_SETTINGS,
    ...input,
  });

  const row = await db.classOperationalSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      ...next,
    },
    update: next,
    select: {
      preJoinWindowMinutes: true,
      lateJoinCutoffMinutes: true,
      creditRefundWindowMinutes: true,
      emptyClassAutoCancelWindowMinutes: true,
    },
  });

  return toDto(row);
}

export function getJoinWindowOpensAt(startsAtUtc: Date, settings: ClassOperationalSettingsDto) {
  return new Date(startsAtUtc.getTime() - settings.preJoinWindowMinutes * 60_000);
}

export function getLateJoinCutoffAt(startsAtUtc: Date, settings: ClassOperationalSettingsDto) {
  return new Date(startsAtUtc.getTime() + settings.lateJoinCutoffMinutes * 60_000);
}

export function isInsideEmptyClassAutoCancelWindow(
  startsAtUtc: Date,
  settings: ClassOperationalSettingsDto,
  now = new Date()
) {
  return (
    startsAtUtc.getTime() - now.getTime() <= settings.emptyClassAutoCancelWindowMinutes * 60_000
  );
}

export function shouldRefundCreditForCancellation(
  startsAtUtc: Date,
  settings: ClassOperationalSettingsDto,
  now = new Date()
) {
  return startsAtUtc.getTime() - now.getTime() > settings.creditRefundWindowMinutes * 60_000;
}
