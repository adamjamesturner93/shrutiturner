import "server-only";
import { db } from "@/lib/db";
import { programmeNow } from "./clock";
import { cohortStateAt } from "./policy";
import { getProgrammePortal } from "./content-service";
import { programmeMessageMaySend } from "./message-guard";
import { buildAbsoluteUrl } from "@/lib/app-url";
import {
  attemptEmailDelivery,
  getPostmarkMessageStream,
  getNotificationInbox,
} from "@/lib/postmark/client";

import { programmeCalendarDay } from "./calendar-time";
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
export async function maintainProgrammes() {
  const now = programmeNow();
  const cohorts = await db.smallGroupProgramme.findMany({
    where: { cohortState: { not: null } },
    include: { weeks: true, sessions: true, enrollments: { where: { paidAt: { not: null } } } },
  });
  for (const c of cohorts) {
    const state = cohortStateAt(c, now);
    if (state !== c.cohortState)
      await db.smallGroupProgramme.update({ where: { id: c.id }, data: { cohortState: state } });
    if (["draft", "cancelled", "archived"].includes(state)) continue;
    if (c.confirmationDeadline && !c.confirmedAt)
      await queue(c.id, null, "confirmation", `confirmation:${c.id}`, c.confirmationDeadline);
    if (c.confirmedAt && c.communityOpenAt && now >= c.communityOpenAt) {
      for (const title of [
        "Welcome",
        "Introduce yourself",
        "Community guidelines",
        "How to ask exercise questions",
      ])
        await post(
          c.id,
          `pinned:${c.id}:${title}`,
          title,
          title === "Community guidelines"
            ? "Be kind, respect privacy and ask questions. This group does not include individual video form analysis."
            : "Welcome to your small coached programme. Share questions and support one another.",
          c.communityOpenAt,
          true
        );
      if (c.startDate && now >= c.startDate)
        await post(
          c.id,
          `opening:${c.id}`,
          "What brought you here?",
          "What brought you here, and what would you like to feel more capable doing?",
          c.startDate
        );
      for (const week of c.weeks.filter((w) => w.published)) {
        if (week.releasesAt <= now && week.releasesAt < c.structuredProgrammeEndsAt!)
          await post(
            c.id,
            `week:${week.id}`,
            week.title,
            `This week's theme is ready: /dashboard/programmes/${c.id}/weeks/${week.id}`,
            week.releasesAt
          );
        if (
          week.reflectionAt <= now &&
          week.reflectionAt < c.structuredProgrammeEndsAt! &&
          week.reflection
        )
          await post(
            c.id,
            `reflection:${week.id}`,
            `Week ${week.number} reflection`,
            week.reflection,
            week.reflectionAt
          );
      }
    }
    for (const e of c.enrollments.filter((row) => row.status === "active" && row.userId)) {
      if (c.startDate) {
        await queue(
          c.id,
          e.userId!,
          "onboarding",
          `onboarding:${e.id}`,
          programmeCalendarDay(c.startDate, -7, "09:00", c.timezone)
        );
        await queue(
          c.id,
          e.userId!,
          "prestart",
          `prestart:${e.id}`,
          programmeCalendarDay(c.startDate, -3, "09:00", c.timezone)
        );
      }
      if (c.structuredProgrammeEndsAt)
        await queue(c.id, e.userId!, "closing", `closing:${e.id}`, c.structuredProgrammeEndsAt);
      if (c.followUpAccessEndsAt)
        await queue(
          c.id,
          e.userId!,
          "ending",
          `ending:${e.id}`,
          programmeCalendarDay(c.followUpAccessEndsAt, -7, undefined, c.timezone)
        );
      for (const s of c.sessions.filter((row) => row.status === "scheduled")) {
        if (c.reminder24h)
          await queue(
            c.id,
            e.userId!,
            "live24",
            `live24:${e.id}:${s.id}`,
            new Date(s.startsAt.getTime() - 86400000)
          );
        if (c.reminder1h)
          await queue(
            c.id,
            e.userId!,
            "live1",
            `live1:${e.id}:${s.id}`,
            new Date(s.startsAt.getTime() - 3600000)
          );
      }
    }
  }
  return dispatchProgrammeMessages();
}
export async function dispatchProgrammeMessages(cohortId?: string) {
  const now = programmeNow();
  const cohorts = await db.smallGroupProgramme.findMany({
    where: { cohortState: { not: null }, ...(cohortId ? { id: cohortId } : {}) },
    include: { weeks: true, sessions: true, enrollments: { where: { paidAt: { not: null } } } },
  });
  const due = await db.programmeMessage.findMany({
    where: { ...(cohortId ? { programmeId: cohortId } : {}), sentAt: null, dueAt: { lte: now } },
    orderBy: { dueAt: "asc" },
    take: 100,
  });
  let delivered = 0;
  for (const message of due) {
    const c = cohorts.find((row) => row.id === message.programmeId);
    if (!c) continue;
    const state = cohortStateAt(c, now);
    const enrolment = c.enrollments.find((row) => row.userId === message.userId);
    let suppress =
      !(await programmeMessageMaySend(message.id)) ||
      (["cancelled", "archived", "draft"].includes(state) &&
        !["cancelled", "refunded"].includes(message.kind));
    if (message.kind === "confirmation") suppress ||= Boolean(c.confirmedAt);
    if (message.kind !== "confirmation")
      suppress ||=
        !enrolment ||
        (enrolment.status !== "active" && !["cancelled", "refunded"].includes(message.kind));
    if (["onboarding", "prestart"].includes(message.kind))
      suppress ||= !c.startDate || now >= c.startDate;
    if (message.kind === "prestart") suppress ||= !c.confirmedAt;
    if (message.kind.startsWith("live")) {
      const session = c.sessions.find((row) => message.sourceKey.endsWith(`:${row.id}`));
      suppress ||=
        !c.confirmedAt ||
        !session ||
        session.status !== "scheduled" ||
        now >= session.startsAt ||
        (message.kind === "live24" ? !c.reminder24h : !c.reminder1h);
    }
    let outstanding = "";
    if (message.userId && !suppress && message.kind === "onboarding") {
      const portal = await getProgrammePortal(message.userId, c.id).catch(() => null);
      if (portal && portal.clearanceStatus !== "pending_confirmation" && portal.agreementsComplete)
        suppress = true;
      outstanding = portal
        ? [
            portal.clearanceStatus === "pending_confirmation"
              ? "Review and confirm your health questionnaire."
              : "",
            !portal.agreementsComplete ? "Accept your required agreements." : "",
          ]
            .filter(Boolean)
            .join(" ")
        : "Activate your account and complete your onboarding.";
    }
    if (suppress) {
      await db.programmeMessage.update({
        where: { id: message.id },
        data: { sentAt: now, error: "suppressed" },
      });
      continue;
    }
    const user = message.userId
      ? await db.user.findUnique({ where: { id: message.userId }, select: { email: true } })
      : null;
    const url = buildAbsoluteUrl(
      message.kind === "confirmation"
        ? `/admin/programmes/${c.id}`
        : `/dashboard/programmes/${c.id}`
    );
    const end = c.followUpAccessEndsAt
      ? new Date(c.followUpAccessEndsAt.getTime() - 1).toLocaleDateString("en-GB", {
          timeZone: c.timezone,
        })
      : "";
    const firstLive = c.sessions
      .filter((s) => s.status !== "cancelled")
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0];
    const firstLiveLabel = firstLive
      ? `${firstLive.title}: ${firstLive.startsAt.toLocaleString("en-GB", { timeZone: c.timezone })} (UK time).`
      : "Your timetable is in the programme portal.";
    const copy: Record<string, string> = {
      welcome: `You're in: ${c.title}. Your programme begins ${c.startDate?.toLocaleDateString("en-GB", { timeZone: c.timezone })}. Sign in or activate your account, review your health questionnaire, accept your agreements and add the live sessions to your calendar.`,
      onboarding: `Your programme begins next week. ${outstanding} Review your onboarding checklist.`,
      prestart: `We begin on Monday! I'm looking forward to getting started with you. Explore the first week's theme, introduce yourself in the community and have your equipment ready: ${c.equipment}. ${firstLiveLabel} See you there, Shruti.`,
      closing: `Thank you for these ${c.durationWeeks || c.weeks.length} weeks! Watch What Next? Your recordings, workouts and community remain available until ${end}. There are no further live sessions or new weekly workouts.`,
      ending: `Your programme access ends on ${end}. Save your personal notes and share your feedback. Check What Next? for any eligible coaching credit and its deadline.`,
      cancelled: `Your cohort has been cancelled. Any payment refund is being tracked and we will update you.`,
      refunded: `Your programme refund has been processed.`,
      confirmation: `Confirmation decision due: ${c.enrollments.filter((e) => e.status === "active").length} paid participants; minimum ${c.minimumParticipants}. Confirm or cancel this cohort.`,
      live24:
        "Your live workout is tomorrow. Open your programme for the current time, equipment and access.",
      live1: "Your live workout starts in one hour. Open your programme for the session.",
    };
    const body = `${copy[message.kind] || c.title}\n\n${url}\nCalendar: ${buildAbsoluteUrl(`/api/me/programmes/${c.id}/calendar`)}\nOnboarding: ${buildAbsoluteUrl(`/dashboard/programmes/${c.id}/onboarding`)}`;
    const deliveryId = `programme-${message.id}`;
    await db.emailDelivery.upsert({
      where: { id: deliveryId },
      create: {
        id: deliveryId,
        toEmail:
          (message.kind === "refunded" ? enrolment?.purchaserEmail : null) ||
          user?.email ||
          getNotificationInbox("PROGRAMME_ADMIN_EMAIL"),
        userId: message.userId,
        templateKey: `programme-${message.kind}`,
        subject: `${message.kind === "welcome" ? "You're in" : message.kind === "prestart" ? "We begin on Monday" : c.title}: ${message.kind}`,
        tag: "programme",
        messageStream: getPostmarkMessageStream(),
        payloadJson: {
          htmlBody: `<p>${escape(body).replaceAll("\n", "<br>")}</p>`,
          textBody: body,
        },
        metadataJson: {
          programmeId: c.id,
          programmeMessageId: message.id,
          scheduleRevision: message.kind.startsWith("live")
            ? c.sessions
                .find((s) => message.sourceKey.endsWith(`:${s.id}`))
                ?.startsAt.toISOString() || ""
            : c.updatedAt.toISOString(),
        },
      },
      update: {},
    });
    await db.programmeMessage.update({
      where: { id: message.id },
      data: { deliveryId, sentAt: now },
    });
    await attemptEmailDelivery(deliveryId).catch(() => undefined);
    delivered++;
  }
  return { delivered };
}
async function queue(
  programmeId: string,
  userId: string | null,
  kind: string,
  sourceKey: string,
  dueAt: Date
) {
  const existing = await db.programmeMessage.findUnique({ where: { sourceKey } });
  if (existing?.sentAt) return;
  await db.programmeMessage.upsert({
    where: { sourceKey },
    create: { programmeId, userId, kind, sourceKey, dueAt },
    update: { dueAt },
  });
}
async function post(
  programmeId: string,
  sourceKey: string,
  title: string,
  body: string,
  createdAt: Date,
  pinned = false
) {
  await db.programmePost.upsert({
    where: { sourceKey },
    create: { programmeId, sourceKey, title, body, createdAt, pinned, announcement: true },
    update: {},
  });
}
