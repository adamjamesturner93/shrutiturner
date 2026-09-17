import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import { isStaffAdminRole } from "@/lib/authz/roles";
import { requireCohortStaff } from "./access";
import { programmeNow } from "./clock";
import { cohortStateAt, validateExerciseEvidence, workoutSchema } from "./policy";
import { programmeCalendarDay } from "./calendar-time";
const date = z
  .string()
  .datetime({ offset: true })
  .transform((value) => new Date(value));
const video = z
  .string()
  .url()
  .refine((value) => value.startsWith("https://"), "Use an HTTPS media URL")
  .nullable();
export const settingsSchema = z
  .object({
    resourcesJson: z
      .array(z.object({ title: z.string().min(1).max(200), body: z.string().max(20000) }))
      .max(12)
      .default([]),
    title: z.string().min(1).max(200),
    salesCopy: z.string().max(20000),
    equipment: z.string().max(4000),
    refundWording: z.string().max(10000),
    salePricePence: z.number().int().positive().nullable(),
    maximumParticipants: z.number().int().min(1).max(150).nullable(),
    minimumParticipants: z.number().int().min(1),
    startDate: date,
    liveCoachingEndsAt: date,
    structuredProgrammeEndsAt: date,
    followUpAccessEndsAt: date,
    confirmationDeadline: date,
    communityOpenAt: date,
    enrolmentClosesAt: date,
    enrolmentOpen: z.boolean(),
    closingBody: z.string().max(20000),
    closingVideoUrl: video,
    reminder24h: z.boolean(),
    reminder1h: z.boolean(),
    creditActive: z.boolean(),
    creditAmountPence: z.number().int().positive().nullable(),
    creditStartsAt: date.nullable(),
    creditEndsAt: date.nullable(),
    creditServices: z.array(z.string().min(1)).max(20),
  })
  .strict();
export async function saveCohortSettings(actorId: string, id: string, raw: unknown) {
  const cohort = await requireCohortStaff(actorId, id);
  const data = settingsSchema.parse(raw);
  if (
    !(
      data.startDate < data.liveCoachingEndsAt &&
      data.liveCoachingEndsAt <= data.structuredProgrammeEndsAt &&
      data.structuredProgrammeEndsAt < data.followUpAccessEndsAt &&
      data.enrolmentClosesAt <= data.startDate &&
      data.confirmationDeadline <= data.startDate &&
      data.communityOpenAt < data.followUpAccessEndsAt
    )
  )
    throw new Error("INVALID_DATE_ORDER");
  if (
    data.creditActive &&
    (!data.creditAmountPence ||
      !data.creditStartsAt ||
      !data.creditEndsAt ||
      data.creditStartsAt >= data.creditEndsAt ||
      !data.creditServices.length)
  )
    throw new Error("CREDIT_CONFIGURATION_REQUIRED");
  const count = await db.smallGroupProgrammeEnrollment.count({
    where: { programmeId: cohort.id, status: "active" },
  });
  if (data.maximumParticipants !== null && data.maximumParticipants < count)
    throw new Error("CAPACITY_BELOW_ENROLMENT");
  if (cohort.publicVisibility === "listed") validateLaunch({ ...cohort, ...data });
  await db.smallGroupProgramme.update({ where: { id: cohort.id }, data });
  await createAdminActionLog({
    actorUserId: actorId,
    actionType: "programme_configured",
    targetType: "programme",
    targetId: cohort.id,
  });
}
export function validateLaunch(c: Awaited<ReturnType<typeof requireCohortStaff>>) {
  if (
    !c.salePricePence ||
    !c.maximumParticipants ||
    !c.salesCopy.trim() ||
    !c.equipment.trim() ||
    !c.refundWording.trim() ||
    !c.startDate ||
    !c.liveCoachingEndsAt ||
    !c.structuredProgrammeEndsAt ||
    !c.followUpAccessEndsAt ||
    !c.confirmationDeadline ||
    !c.enrolmentClosesAt ||
    !c.communityOpenAt
  )
    throw new Error("LAUNCH_DETAILS_REQUIRED");
  if (
    c.sessions.length !== c.durationWeeks ||
    c.sessions.some(
      (s) =>
        !s.endsAt ||
        s.endsAt.getTime() - s.startsAt.getTime() !== 45 * 60000 ||
        s.startsAt < c.startDate! ||
        s.endsAt > c.liveCoachingEndsAt!
    )
  )
    throw new Error("VALID_LIVE_SCHEDULE_REQUIRED");
  if (
    c.sessions.some(
      (s) =>
        s.startsAt < programmeCalendarDay(c.startDate!, (s.sequenceNumber - 1) * 7) ||
        !s.endsAt ||
        s.endsAt > programmeCalendarDay(c.startDate!, s.sequenceNumber * 7)
    )
  )
    throw new Error("ONE_LIVE_SESSION_PER_WEEK_REQUIRED");
}
export async function publishCohort(actorId: string, id: string) {
  const c = await requireCohortStaff(actorId, id);
  if (c.cohortState !== "draft") throw new Error("NOT_DRAFT");
  validateLaunch(c);
  await db.smallGroupProgramme.update({
    where: { id: c.id },
    data: {
      cohortState: "on_sale",
      enrolmentOpen: true,
      pricePence: c.salePricePence,
      cohortSize: c.maximumParticipants,
    },
  });
  await createAdminActionLog({
    actorUserId: actorId,
    actionType: "programme_on_sale",
    targetType: "programme",
    targetId: c.id,
  });
}
export async function confirmCohort(actorId: string, id: string) {
  const c = await requireCohortStaff(actorId, id);
  if (["draft", "cancelled", "archived"].includes(cohortStateAt(c, programmeNow())))
    throw new Error("CONFIRMATION_UNAVAILABLE");
  await db.smallGroupProgramme.update({
    where: { id: c.id },
    data: { confirmedAt: c.confirmedAt || programmeNow(), cohortState: "confirmed" },
  });
  await createAdminActionLog({
    actorUserId: actorId,
    actionType: "programme_confirmed",
    targetType: "programme",
    targetId: c.id,
  });
}
export const weekSchema = z.object({
  title: z.string().min(1).max(200),
  theme: z.string().max(200),
  education: z.string().max(30000),
  videoUrl: video,
  takeaways: z.array(z.string().max(1000)).max(10),
  releasesAt: date,
  reflectionAt: date,
  reflection: z.string().max(10000),
  published: z.boolean(),
  workoutPublished: z.boolean(),
  workoutJson: workoutSchema,
});
export async function saveProgrammeWeek(
  actorId: string,
  cohortId: string,
  weekId: string,
  raw: unknown
) {
  const c = await requireCohortStaff(actorId, cohortId);
  const week = c.weeks.find((w) => w.id === weekId);
  if (!week) throw new Error("NOT_FOUND");
  const data = weekSchema.parse(raw);
  if (data.workoutPublished && !data.workoutJson.length)
    throw new Error("WORKOUT_EXERCISES_REQUIRED");
  if (
    ["follow_up", "archived", "cancelled"].includes(cohortStateAt(c, programmeNow())) &&
    ((!week.published && data.published) ||
      (!week.workoutPublished && data.workoutPublished) ||
      JSON.stringify(workoutSchema.parse(week.workoutJson || [])) !==
        JSON.stringify(data.workoutJson))
  )
    throw new Error("STRUCTURED_PROGRAMME_ENDED");
  if (
    !c.structuredProgrammeEndsAt ||
    data.releasesAt >= c.structuredProgrammeEndsAt ||
    data.reflectionAt >= c.structuredProgrammeEndsAt
  )
    throw new Error("OUTSIDE_STRUCTURED_PROGRAMME");
  const demos = await db.replayAsset.findMany({
    where: {
      resourceType: "programme_demonstration",
      smallGroupProgrammeSessionId: null,
      smallGroupProgrammeId: c.id,
      id: { in: data.workoutJson.flatMap((e) => (e.demonstrationId ? [e.demonstrationId] : [])) },
    },
  });
  if (data.workoutPublished)
    validateExerciseEvidence(
      data.workoutJson,
      c.sessions,
      demos,
      c.sessions.find((s) => s.id === week.sessionId)?.startsAt || week.releasesAt
    );
  await db.programmeWeek.update({ where: { id: weekId }, data });
}
export async function saveProgrammeSession(
  actorId: string,
  cohortId: string,
  sessionId: string,
  raw: unknown
) {
  const c = await requireCohortStaff(actorId, cohortId);
  if (["follow_up", "archived", "cancelled"].includes(cohortStateAt(c, programmeNow())))
    throw new Error("STRUCTURED_PROGRAMME_ENDED");
  const input = z
    .object({
      title: z.string().min(1).max(200),
      startsAt: date,
      exerciseKeys: z.array(z.string().min(1)).max(40),
    })
    .parse(raw);
  if (!c.sessions.some((s) => s.id === sessionId)) throw new Error("NOT_FOUND");
  const endsAt = new Date(input.startsAt.getTime() + 45 * 60000);
  if (
    !c.startDate ||
    !c.liveCoachingEndsAt ||
    input.startsAt < c.startDate ||
    endsAt > c.liveCoachingEndsAt
  )
    throw new Error("OUTSIDE_LIVE_COACHING");
  await db.smallGroupProgrammeSession.update({
    where: { id: sessionId },
    data: { ...input, endsAt },
  });
}
export async function markTeachingComplete(actorId: string, cohortId: string, sessionId: string) {
  const c = await requireCohortStaff(actorId, cohortId);
  const session = c.sessions.find((s) => s.id === sessionId);
  if (!session?.endsAt || session.endsAt > programmeNow() || session.status === "cancelled")
    throw new Error("TEACHING_NOT_OCCURRED");
  await db.smallGroupProgrammeSession.update({
    where: { id: sessionId },
    data: { taughtAt: session.taughtAt || programmeNow(), status: "completed" },
  });
  await createAdminActionLog({
    actorUserId: actorId,
    actionType: "programme_teaching_completed",
    targetType: "programme_session",
    targetId: sessionId,
  });
}
export async function redeemProgrammeCredit(
  actorId: string,
  cohortId: string,
  enrolmentId: string,
  reference: string,
  service?: string
) {
  const c = await requireCohortStaff(actorId, cohortId);
  const now = programmeNow();
  if (
    !c.creditActive ||
    !c.creditAmountPence ||
    !c.creditStartsAt ||
    !c.creditEndsAt ||
    now < c.creditStartsAt ||
    now >= c.creditEndsAt ||
    c.cohortState === "cancelled"
  )
    throw new Error("CREDIT_NOT_ELIGIBLE");
  const selectedService = service || (c.creditServices.length === 1 ? c.creditServices[0] : "");
  if (!selectedService || !c.creditServices.includes(selectedService))
    throw new Error("ELIGIBLE_COACHING_SERVICE_REQUIRED");
  return db.$transaction(async (tx) => {
    const result = await tx.smallGroupProgrammeEnrollment.updateMany({
      where: {
        id: enrolmentId,
        programmeId: c.id,
        status: { in: ["active", "completed"] },
        paidAt: { not: null },
        creditRedeemedAt: null,
      },
      data: {
        creditRedeemedAt: now,
        creditRedeemedBy: actorId,
        creditReference: reference.slice(0, 200),
      },
    });
    if (!result.count) throw new Error("CREDIT_ALREADY_REDEEMED");
    await createAdminActionLog(
      {
        actorUserId: actorId,
        actionType: "programme_credit_redeemed",
        targetType: "programme_enrolment",
        targetId: enrolmentId,
        newValueJson: { amountPence: c.creditAmountPence, reference, service: selectedService },
      },
      tx
    );
  });
}
export async function listAdminCohorts(actorId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: actorId } });
  return db.smallGroupProgramme.findMany({
    where: {
      cohortState: { not: null },
      ...(isStaffAdminRole(user.role)
        ? {}
        : { instructorAssignments: { some: { userId: actorId } } }),
    },
    orderBy: { startDate: "desc" },
  });
}

export async function createProgrammeDraft(actorId: string, raw: unknown) {
  const actor = await db.user.findUniqueOrThrow({ where: { id: actorId } });
  if (!isStaffAdminRole(actor.role)) throw new Error("FORBIDDEN");
  const input = z
    .object({
      programmeTitle: z.string().trim().min(1).max(150),
      title: z.string().trim().min(1).max(200),
      startDate: date,
      weeks: z.number().int().min(1).max(12),
      copyFrom: z.string().optional(),
    })
    .parse(raw);
  const source = input.copyFrom ? await requireCohortStaff(actorId, input.copyFrom) : null;
  const slug = input.programmeTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!slug) throw new Error("PROGRAMME_TITLE_REQUIRED");

  return db.$transaction(async (tx) => {
    const definition = await tx.programmeDefinition.upsert({
      where: { slug },
      create: { slug, title: input.programmeTitle },
      update: {},
    });
    const id = crypto.randomUUID();
    const end = programmeCalendarDay(input.startDate, (input.weeks - 1) * 7 + 5, "00:00");
    const cohort = await tx.smallGroupProgramme.create({
      data: {
        id,
        slug: `${slug}-${id.slice(0, 8)}`,
        runSlug: `${slug}-${id.slice(0, 8)}`,
        templateSlug: slug,
        definitionId: definition.id,
        title: input.title,
        durationLabel: `${input.weeks} coached weeks`,
        durationWeeks: input.weeks,
        shortDescription: source?.shortDescription || definition.description,
        pricePence: 0,
        cohortSize: 0,
        cohortState: "draft",
        startDate: input.startDate,
        liveCoachingEndsAt: programmeCalendarDay(end, -1),
        structuredProgrammeEndsAt: end,
        followUpAccessEndsAt: programmeCalendarDay(end, 32),
        confirmationDeadline: programmeCalendarDay(input.startDate, -7, "09:00"),
        communityOpenAt: programmeCalendarDay(input.startDate, -3, "09:00"),
        enrolmentClosesAt: programmeCalendarDay(input.startDate, -1, "18:00"),
        salesCopy: source?.salesCopy || definition.description,
        equipment: source?.equipment || "",
        refundWording: source?.refundWording || "",
        closingBody: source?.closingBody || "",
        ...(source?.resourcesJson ? { resourcesJson: source.resourcesJson } : {}),
      },
    });
    const ids = Array.from({ length: input.weeks }, () => crypto.randomUUID());
    for (let i = 0; i < input.weeks; i++) {
      const releasesAt = programmeCalendarDay(input.startDate, i * 7, "00:00");
      const old = source?.weeks[i];
      await tx.smallGroupProgrammeSession.create({
        data: {
          id: ids[i],
          programmeId: id,
          sequenceNumber: i + 1,
          title: `Week ${i + 1} Live Workout`,
          startsAt: releasesAt,
          exerciseKeys: source?.sessions[i]?.exerciseKeys || [],
        },
      });
      const workout = old
        ? workoutSchema.parse(old.workoutJson || []).map((e) => ({
            ...e,
            demonstrationId: undefined,
            sessionId: e.sessionId
              ? ids[source!.sessions.findIndex((s) => s.id === e.sessionId)]
              : undefined,
          }))
        : [];
      await tx.programmeWeek.create({
        data: {
          programmeId: id,
          number: i + 1,
          title: old?.title || `Week ${i + 1}`,
          theme: old?.theme || "",
          education: old?.education || "",
          videoUrl: old?.videoUrl,
          takeaways: old?.takeaways || [],
          releasesAt,
          reflectionAt: programmeCalendarDay(releasesAt, 4, "09:00"),
          reflection: old?.reflection || "",
          sessionId: ids[i],
          workoutJson: JSON.parse(JSON.stringify(workout)),
        },
      });
    }
    await createAdminActionLog(
      {
        actorUserId: actorId,
        actionType: "programme_draft_created",
        targetType: "programme",
        targetId: id,
      },
      tx
    );
    return { id: cohort.id };
  });
}

/** Only authorised staff can register a Daily recording; playback remains server-gated. */
export async function addProgrammeRecording(actorId: string, cohortId: string, raw: unknown) {
  const c = await requireCohortStaff(actorId, cohortId);
  const input = z
    .object({
      recordingId: z.string().min(1).max(200),
      sessionId: z.string().optional(),
      coachDemonstration: z.boolean().default(false),
    })
    .parse(raw);
  const actor = await db.user.findUniqueOrThrow({ where: { id: actorId } });
  if (input.coachDemonstration && !isStaffAdminRole(actor.role)) throw new Error("FORBIDDEN");
  const { getDailyRecording } = await import("@/lib/daily/service");
  const recording = await getDailyRecording(input.recordingId);
  const session = c.sessions.find((s) => s.id === input.sessionId);
  if (
    !input.coachDemonstration &&
    (!session?.dailyRoomName || session.dailyRoomName !== recording.room_name)
  )
    throw new Error("RECORDING_SESSION_MISMATCH");
  if (recording.status !== "finished") throw new Error("RECORDING_NOT_AVAILABLE");
  const existing = await db.replayAsset.findUnique({
    where: { dailyRecordingId: input.recordingId },
  });
  if (existing && existing.smallGroupProgrammeId !== c.id)
    throw new Error("RECORDING_ALREADY_ASSIGNED");
  const asset =
    existing ||
    (await db.replayAsset.create({
      data: {
        resourceType: input.coachDemonstration
          ? "programme_demonstration"
          : "small_group_programme_session",
        smallGroupProgrammeId: c.id,
        smallGroupProgrammeSessionId: input.coachDemonstration ? null : session!.id,
        dailyRecordingId: input.recordingId,
        dailyRoomName: recording.room_name,
        status: "ready",
      },
    }));
  await createAdminActionLog({
    actorUserId: actorId,
    actionType: "programme_recording_registered",
    targetType: "replay_asset",
    targetId: asset.id,
  });
  return { id: asset.id };
}

export async function savePublicPresentation(actorId: string, id: string, raw: unknown) {
  const c = await requireCohortStaff(actorId, id);
  const data = z
    .object({
      publicVisibility: z.enum(["hidden", "coming_soon", "listed"]),
      subtitle: z.string().trim().max(300),
      shortDescription: z.string().trim().max(2000),
      publicImageUrl: z
        .string()
        .url()
        .refine((v) => v.startsWith("https://"))
        .nullable(),
      publicImageAlt: z.string().trim().max(300).nullable(),
      whoItsForJson: z.array(z.string().trim().min(1).max(500)).max(8),
      weekByWeekJson: z.array(z.string().trim().min(1).max(200)).max(20),
    })
    .strict()
    .parse(raw);
  if (data.publicVisibility !== "hidden") {
    if (
      !c.definitionId ||
      !data.subtitle ||
      !data.shortDescription ||
      !c.startDate ||
      !c.structuredProgrammeEndsAt ||
      !c.durationWeeks
    )
      throw new Error("PUBLIC_TEASER_DETAILS_REQUIRED");
    if (["cancelled", "archived", "follow_up"].includes(cohortStateAt(c, programmeNow())))
      throw new Error("PUBLICATION_UNAVAILABLE");
    if (data.publicImageUrl && !data.publicImageAlt) throw new Error("IMAGE_DESCRIPTION_REQUIRED");
    if (data.publicVisibility === "listed") {
      if (c.cohortState === "draft") throw new Error("OPEN_SALES_BEFORE_LISTING");
      validateLaunch(c);
    }
  }
  await db.smallGroupProgramme.update({ where: { id: c.id }, data });
  await createAdminActionLog({
    actorUserId: actorId,
    actionType: "programme_public_presentation",
    targetType: "programme",
    targetId: c.id,
  });
}
