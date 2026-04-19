import { db } from "@/lib/db";
import { createAdminActionLog } from "@/lib/admin/action-log-service";

export type PlatformSettingsDto = {
  businessName: string;
  supportEmail: string | null;
  contactEmail: string | null;
  instagramUrl: string | null;
  defaultSeoTitle: string | null;
  defaultSeoDescription: string | null;
  gaMeasurementId: string | null;
};

export type PlatformSettingsUpdateInput = Partial<PlatformSettingsDto>;

function sanitizeText(value: string | null | undefined, maxLength: number) {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function sanitizeUrl(value: string | null | undefined) {
  const trimmed = sanitizeText(value, 500);
  if (!trimmed) return null;
  try {
    return new URL(trimmed).toString();
  } catch {
    throw new Error("INVALID_URL");
  }
}

function mapSettingsRow(row: {
  businessName: string;
  supportEmail: string | null;
  contactEmail: string | null;
  instagramUrl: string | null;
  defaultSeoTitle: string | null;
  defaultSeoDescription: string | null;
  gaMeasurementId: string | null;
}): PlatformSettingsDto {
  return {
    businessName: row.businessName,
    supportEmail: row.supportEmail,
    contactEmail: row.contactEmail,
    instagramUrl: row.instagramUrl,
    defaultSeoTitle: row.defaultSeoTitle,
    defaultSeoDescription: row.defaultSeoDescription,
    gaMeasurementId: row.gaMeasurementId,
  };
}

export async function getPlatformSettings() {
  const settings = await db.platformSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
    },
  });

  return mapSettingsRow(settings);
}

export async function updatePlatformSettings(input: {
  actorUserId: string;
  requestId?: string | null;
  requestPath?: string | null;
  requestIp?: string | null;
  values: PlatformSettingsUpdateInput;
}) {
  const current = await db.platformSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
    },
  });

  const next = {
    businessName:
      input.values.businessName === undefined
        ? current.businessName
        : sanitizeText(input.values.businessName, 120) || current.businessName,
    supportEmail:
      input.values.supportEmail === undefined
        ? current.supportEmail
        : sanitizeText(input.values.supportEmail, 255),
    contactEmail:
      input.values.contactEmail === undefined
        ? current.contactEmail
        : sanitizeText(input.values.contactEmail, 255),
    instagramUrl:
      input.values.instagramUrl === undefined
        ? current.instagramUrl
        : sanitizeUrl(input.values.instagramUrl),
    defaultSeoTitle:
      input.values.defaultSeoTitle === undefined
        ? current.defaultSeoTitle
        : sanitizeText(input.values.defaultSeoTitle, 160),
    defaultSeoDescription:
      input.values.defaultSeoDescription === undefined
        ? current.defaultSeoDescription
        : sanitizeText(input.values.defaultSeoDescription, 320),
    gaMeasurementId:
      input.values.gaMeasurementId === undefined
        ? current.gaMeasurementId
        : sanitizeText(input.values.gaMeasurementId, 80),
  };

  const updated = await db.platformSetting.update({
    where: { id: "default" },
    data: {
      ...next,
      updatedByUserId: input.actorUserId,
    },
  });

  await createAdminActionLog({
    actorUserId: input.actorUserId,
    actionType: "platform_settings_updated",
    targetType: "platform_setting",
    targetId: updated.id,
    requestId: input.requestId,
    requestPath: input.requestPath,
    requestIp: input.requestIp,
    oldValueJson: mapSettingsRow(current),
    newValueJson: mapSettingsRow(updated),
  });

  return mapSettingsRow(updated);
}
