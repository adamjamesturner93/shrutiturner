import "server-only";

import { Prisma, RetreatEventKind } from "@prisma/client";
import { db } from "@/lib/db";
import {
  parseRetreatExperienceContent,
  parseRetreatFormatDefaults,
} from "@/lib/retreats/experience-schema";
import { getRetreatEventCapabilities } from "@/lib/retreats/event-capabilities";

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function throwFormatWriteError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new Error("FORMAT_NAME_TAKEN");
  }
  throw error;
}

function serializeFormat(format: {
  id: string;
  name: string;
  description: string | null;
  eventKind: RetreatEventKind;
  starterContentJson: Prisma.JsonValue;
  operationalDefaultsJson: Prisma.JsonValue;
  active: boolean;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...format,
    starterContent: parseRetreatExperienceContent(format.starterContentJson),
    operationalDefaults: parseRetreatFormatDefaults(format.operationalDefaultsJson),
    capabilities: getRetreatEventCapabilities(format.eventKind),
    createdAt: format.createdAt.toISOString(),
    updatedAt: format.updatedAt.toISOString(),
  };
}

export async function listRetreatFormats(options?: { includeArchived?: boolean }) {
  const formats = await db.retreatFormatPreset.findMany({
    where: options?.includeArchived ? undefined : { active: true },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
  return formats.map(serializeFormat);
}

export async function getRetreatFormat(id: string, client: Prisma.TransactionClient = db) {
  const format = await client.retreatFormatPreset.findUnique({ where: { id } });
  return format ? serializeFormat(format) : null;
}

export async function createRetreatFormat(input: {
  name: string;
  description?: string | null;
  eventKind: RetreatEventKind;
  starterContent: unknown;
  operationalDefaults: unknown;
}) {
  const name = input.name.trim();
  if (!name) throw new Error("FORMAT_NAME_REQUIRED");
  const starterContent = parseRetreatExperienceContent(input.starterContent);
  const operationalDefaults = parseRetreatFormatDefaults(input.operationalDefaults);
  const capabilities = getRetreatEventCapabilities(input.eventKind);
  const normalizedDefaults = {
    ...operationalDefaults,
    paymentPolicy:
      capabilities.paymentPolicy === "full_payment"
        ? ("full_payment" as const)
        : operationalDefaults.paymentPolicy,
    venueProfileId: capabilities.requiresVenue ? operationalDefaults.venueProfileId : undefined,
  };

  let format: Awaited<ReturnType<typeof db.retreatFormatPreset.create>>;
  try {
    format = await db.retreatFormatPreset.create({
      data: {
        name,
        description: input.description?.trim() || null,
        eventKind: input.eventKind,
        starterContentJson: json(starterContent),
        operationalDefaultsJson: json(normalizedDefaults),
      },
    });
  } catch (error) {
    throwFormatWriteError(error);
  }
  return serializeFormat(format);
}

export async function updateRetreatFormat(input: {
  id: string;
  revision: number;
  name?: string;
  description?: string | null;
  starterContent?: unknown;
  operationalDefaults?: unknown;
  active?: boolean;
}) {
  const existing = await db.retreatFormatPreset.findUnique({ where: { id: input.id } });
  if (!existing) throw new Error("FORMAT_NOT_FOUND");
  const operationalDefaults =
    input.operationalDefaults === undefined
      ? null
      : parseRetreatFormatDefaults(input.operationalDefaults);
  const capabilities = getRetreatEventCapabilities(existing.eventKind);
  const normalizedDefaults = operationalDefaults
    ? {
        ...operationalDefaults,
        paymentPolicy:
          capabilities.paymentPolicy === "full_payment"
            ? ("full_payment" as const)
            : operationalDefaults.paymentPolicy,
        venueProfileId: capabilities.requiresVenue ? operationalDefaults.venueProfileId : undefined,
      }
    : null;
  let result: Awaited<ReturnType<typeof db.retreatFormatPreset.updateMany>>;
  try {
    result = await db.retreatFormatPreset.updateMany({
      where: { id: input.id, revision: input.revision },
      data: {
        name: input.name?.trim() || undefined,
        description:
          input.description === undefined ? undefined : input.description?.trim() || null,
        starterContentJson:
          input.starterContent === undefined
            ? undefined
            : json(parseRetreatExperienceContent(input.starterContent)),
        operationalDefaultsJson: normalizedDefaults === null ? undefined : json(normalizedDefaults),
        active: input.active,
        revision: { increment: 1 },
      },
    });
  } catch (error) {
    throwFormatWriteError(error);
  }
  if (result.count === 0) throw new Error("REVISION_CONFLICT");
  return getRetreatFormat(input.id);
}
