import { requireSessionUser } from "@/lib/api/auth-user";
import {
  getProgrammePortal,
  getProgrammeWeek,
  getProgrammeShell,
  getProgrammeSection,
  getProgrammeWeekPreview,
} from "@/lib/programmes/content-service";
import { programmeAccess, healthRevision } from "@/lib/programmes/access";
import { confirmProgrammeHealth } from "@/lib/programmes/clearance-service";
import {
  listProgrammePosts,
  createProgrammePost,
  changeProgrammePost,
} from "@/lib/programmes/community-service";
import { getProgrammeLiveToken, programmeReplayAccess } from "@/lib/programmes/live-service";
import { programmeError } from "@/lib/programmes/http";
import { buildAbsoluteUrl } from "@/lib/app-url";
import { getHealthProfile } from "@/lib/health/health-service";
type Context = { params: Promise<{ id: string; action?: string[] }> };
export async function GET(_request: Request, context: Context) {
  try {
    const user = await requireSessionUser();
    const { id, action = [] } = await context.params;
    let result: unknown;
    if (!action.length) result = await getProgrammePortal(user.id, id);
    else if (action[0] === "shell") result = await getProgrammeShell(user.id, id);
    else if (action[0] === "sections" && action[1])
      result = await getProgrammeSection(user.id, id, action[1]);
    else if (action[0] === "weeks" && action[1] && action[2] === "preview")
      result = await getProgrammeWeekPreview(user.id, id, action[1]);
    else if (action[0] === "weeks" && action[1])
      result = await getProgrammeWeek(user.id, id, action[1]);
    else if (action[0] === "community") {
      const query = new URL(_request.url).searchParams;
      const limit = Number(query.get("limit"));
      result = await listProgrammePosts(
        user.id,
        id,
        query.has("limit")
          ? {
              limit: Number.isInteger(limit) && limit > 0 ? Math.min(50, limit) : 20,
              cursor: query.get("cursor") || undefined,
            }
          : undefined
      );
    } else if (action[0] === "replays" && action[1])
      result = await programmeReplayAccess(user.id, id, action[1]);
    else if (action[0] === "onboarding") {
      const access = await programmeAccess(user.id, id);
      const health = await healthRevision(user.id);
      result = {
        status: access.status,
        healthRevision: health.revision,
        health: await getHealthProfile(user.id),
        agreementVersion: access.cohort.agreementVersion,
        refundWording: access.cohort.refundWording,
        agreements: access.agreements,
      };
    } else if (action[0] === "calendar") {
      const { cohort } = await programmeAccess(user.id, id);
      const stamp = (d: Date) =>
        d
          .toISOString()
          .replace(/[-:]/g, "")
          .replace(/\.\d{3}/, "");
      const escape = (s: string) =>
        s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, "\\$&").replace(/\r/g, "");
      const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Shruti Turner//Programmes//EN",
        "CALSCALE:GREGORIAN",
      ];
      for (const s of cohort.sessions)
        if (s.endsAt)
          lines.push(
            "BEGIN:VEVENT",
            `UID:programme-${s.id}@shrutiturner.co.uk`,
            `DTSTAMP:${stamp(s.updatedAt)}`,
            `DTSTART:${stamp(s.startsAt)}`,
            `DTEND:${stamp(s.endsAt)}`,
            `SUMMARY:${escape(s.title)}`,
            `URL:${buildAbsoluteUrl(`/dashboard/programmes/${cohort.id}/live/${s.id}`)}`,
            `DESCRIPTION:${escape(cohort.equipment)}`,
            `STATUS:${s.status === "cancelled" ? "CANCELLED" : "CONFIRMED"}`,
            "END:VEVENT"
          );
      lines.push("END:VCALENDAR");
      return new Response(lines.join("\r\n"), {
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": 'attachment; filename="programme.ics"',
          "Cache-Control": "private, no-store",
        },
      });
    } else throw new Error("NOT_FOUND");
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return programmeError(error);
  }
}
export async function POST(request: Request, context: Context) {
  try {
    const user = await requireSessionUser();
    const { id, action = [] } = await context.params;
    const body: unknown = await request.json().catch(() => ({}));
    let result: unknown;
    if (action[0] === "onboarding") result = await confirmProgrammeHealth(user.id, id, body);
    else if (action[0] === "community")
      result = action[1]
        ? await changeProgrammePost(user.id, id, action[1], body)
        : await createProgrammePost(user.id, id, body);
    else if (action[0] === "live" && action[1])
      result = await getProgrammeLiveToken(user.id, id, action[1]);
    else throw new Error("NOT_FOUND");
    return Response.json(result ?? { ok: true });
  } catch (error) {
    return programmeError(error);
  }
}
