import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { createEventDraft } from "@/lib/retreats/creation-service";
import { updateRetreatExperience, publishRetreatExperience } from "@/lib/retreats/experience-service";

vi.mock("@/lib/content/public-content", () => ({
  getRetreatVenues: vi.fn(() => { throw new Error("CMS must not be called for online creation"); }),
  getRetreatTemplates: vi.fn(() => { throw new Error("CMS unavailable"); }),
}));

const prefix = `integration-creation-${randomUUID()}`;
const actor = `${prefix}-actor`;
const formatId = `${prefix}-format`;
const payload = () => ({ requestKey: randomUUID(), formatPresetId: formatId,
  content: { title: `${prefix}-${randomUUID()}`, shortDescription: "A workshop", fullDescription: "A full workshop description", scheduleMarkdown: "## Morning\n\n- Movement" },
  startsAt: "2027-04-05T09:00:00.000Z",
});

describe("atomic event draft creation", () => {
  beforeAll(async () => {
    await db.retreatFormatPreset.create({ data: {
      id: formatId, name: formatId, eventKind: "online_workshop", starterContentJson: { title: "Workshop" },
      operationalDefaultsJson: { timezone: "Asia/Kolkata", durationMinutes: 150, capacity: 18, pricePence: 3500, paymentPolicy: "full_payment", isRecorded: false, chatEnabled: false },
    } });
  });
  afterAll(async () => {
    await db.adminEventCreation.deleteMany({ where: { actorUserId: actor } });
    await db.retreatDate.deleteMany({ where: { formatPresetId: formatId } });
    await db.retreatExperience.deleteMany({ where: { formatPresetId: formatId } });
    await db.retreatFormatPreset.deleteMany({ where: { id: formatId } });
  });
  it("retries return the same date and defaults are snapshotted without CMS", async () => {
    const input = payload();
    const result = await createEventDraft(actor, input);
    expect(await createEventDraft(actor, input)).toEqual(result);
    const date = await db.retreatDate.findUniqueOrThrow({ where: { id: result.id }, include: { experience: true } });
    expect(date).toMatchObject({ status: "draft", capacity: 18, pricePence: 3500, timezone: "Asia/Kolkata", isRecorded: false, chatEnabled: false });
    expect(date.endsAt.toISOString()).toBe("2027-04-05T11:30:00.000Z");
    expect(date.experience?.publishedAt).toBeNull();
    await expect(createEventDraft(actor, { ...input, capacity: 20 })).rejects.toThrow("CREATION_REQUEST_CONFLICT");
  });
  it("a date validation failure rolls back the new page", async () => {
    const input = { ...payload(), endsAt: "2027-04-05T08:00:00.000Z" };
    await expect(createEventDraft(actor, input)).rejects.toThrow("INVALID_DATE_RANGE");
    expect(await db.retreatExperience.count({ where: { title: input.content.title } })).toBe(0);
    expect(await db.adminEventCreation.count({ where: { key: `${actor}:${input.requestKey}` } })).toBe(0);
  });
  it("concurrent identical submissions create only one page and date", async () => {
    const input = payload();
    const results = await Promise.all([createEventDraft(actor, input), createEventDraft(actor, input)]);
    expect(results[0]).toEqual(results[1]);
    expect(await db.retreatExperience.count({ where: { title: input.content.title } })).toBe(1);
  });
  it("draft renames preserve date identity and publication locks the slug", async () => {
    const input = payload();
    const created = await createEventDraft(actor, input);
    const date = await db.retreatDate.findUniqueOrThrow({ where: { id: created.id }, include: { experience: true } });
    const experience = date.experience!;
    const slug = `${prefix}-renamed`;
    const updated = await updateRetreatExperience({ id: experience.id, revision: experience.revision, slug, content: experience.draftContentJson });
    expect((await db.retreatDate.findUniqueOrThrow({ where: { id: date.id } })).retreatSlug).toBe(slug);
    await publishRetreatExperience({ id: experience.id, revision: updated!.revision });
    await expect(updateRetreatExperience({ id: experience.id, revision: updated!.revision, slug: `${slug}-again`, content: experience.draftContentJson })).rejects.toThrow("PUBLISHED_SLUG_LOCKED");
  });
});
