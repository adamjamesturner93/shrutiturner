import { listAdminActionLogs } from "@/lib/admin/action-log-service";
import { apiOk, handleApiRoute } from "@/lib/api/route";

function toCsvValue(value: unknown) {
  const text = value == null ? "" : typeof value === "string" ? value : JSON.stringify(value);
  const safeText = /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}

export const GET = handleApiRoute(
  async ({ request }) => {
    const url = new URL(request.url);
    const actionType = url.searchParams.get("actionType") || undefined;
    const targetType = url.searchParams.get("targetType") || undefined;
    const actorUserId = url.searchParams.get("actorUserId") || undefined;
    const limit = Number(url.searchParams.get("limit") || "100");
    const format = url.searchParams.get("format");
    const requestedPage = Number(url.searchParams.get("page") || "1");
    const page = Number.isSafeInteger(requestedPage)
      ? Math.max(1, Math.min(10000, requestedPage))
      : 1;
    const pageSize = Number.isSafeInteger(limit) ? Math.max(1, Math.min(500, limit)) : 100;

    const rows = await listAdminActionLogs({
      actionType,
      targetType,
      actorUserId,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    if (format === "csv") {
      const header = [
        "createdAt",
        "actorName",
        "actorEmail",
        "actionType",
        "targetType",
        "targetId",
        "reason",
        "requestPath",
        "requestIp",
        "metadataJson",
      ];
      const body = rows.map((row) =>
        [
          row.createdAt.toISOString(),
          `${row.actor.firstName || ""} ${row.actor.lastName || ""}`.trim(),
          row.actor.email,
          row.actionType,
          row.targetType,
          row.targetId,
          row.reason,
          row.requestPath,
          row.requestIp,
          row.metadataJson,
        ]
          .map(toCsvValue)
          .join(",")
      );

      return new Response([header.join(","), ...body].join("\n"), {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": 'attachment; filename="admin-audit-log.csv"',
        },
      });
    }

    return apiOk(rows);
  },
  { auth: "staff_admin" }
);
