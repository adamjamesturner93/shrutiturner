import "server-only";
import { db } from "@/lib/db";
import { programmeNow } from "./clock";
import { cohortStateAt } from "./policy";
import { programmeAccess } from "./access";

/** Re-evaluate before every provider attempt, including generic mail retries. */
export async function programmeMessageMaySend(id: string, scheduleRevision?: string) {
  const m = await db.programmeMessage.findUnique({
    where: { id },
    include: { programme: { include: { sessions: true, enrollments: true } } },
  });
  if (!m) return false;
  const c = m.programme,
    now = programmeNow(),
    state = cohortStateAt(c, now);
  const cancellation = ["cancelled", "refunded"].includes(m.kind);
  if (!cancellation && ["draft", "cancelled", "archived"].includes(state)) return false;
  if (m.dueAt > now) return false;
  const enrolment = c.enrollments.find(
    (e) => e.userId === m.userId && e.paidAt && (cancellation || e.status === "active")
  );
  if (m.kind !== "confirmation" && !enrolment) return false;
  if (m.kind === "confirmation")
    return !c.confirmedAt && Boolean(c.confirmationDeadline && now >= c.confirmationDeadline);
  if (["onboarding", "prestart"].includes(m.kind) && (!c.startDate || now >= c.startDate))
    return false;
  if (m.kind === "prestart" && !c.confirmedAt) return false;
  if (m.kind.startsWith("live")) {
    const s = c.sessions.find((s) => m.sourceKey.endsWith(`:${s.id}`));
    if (
      !s ||
      !c.confirmedAt ||
      s.status !== "scheduled" ||
      now >= s.startsAt ||
      !(m.kind === "live24" ? c.reminder24h : c.reminder1h)
    )
      return false;
    if (scheduleRevision && scheduleRevision !== s.startsAt.toISOString()) return false;
  }
  if (m.kind === "closing" && (!c.structuredProgrammeEndsAt || now < c.structuredProgrammeEndsAt))
    return false;
  if (
    scheduleRevision &&
    !m.kind.startsWith("live") &&
    !["welcome", "cancelled", "refunded"].includes(m.kind) &&
    scheduleRevision !== c.updatedAt.toISOString()
  )
    return false;
  if (m.kind === "onboarding" && m.userId) {
    const access = await programmeAccess(m.userId, c.id, "history").catch(() => null);
    // Coach review is not a participant task. A complete submission needs no reminder.
    if (access && access.status !== "pending_confirmation" && access.agreementsComplete)
      return false;
  }
  return true;
}
