import type { PostClassFeeling } from "@prisma/client";
import { ClassBookingStatus } from "@prisma/client";
import type { AccountActivityDto, PostClassFeelingDto } from "@/lib/api/types";
import { db } from "@/lib/db";

const FEELING_TO_DTO: Record<PostClassFeeling, PostClassFeelingDto> = {
  great: "great",
  good: "good",
  okay: "okay",
  tough: "tough",
  too_much: "too-much",
};

type AccountActivityCursor = {
  startsAtUtc: string;
  bookingId: string;
};

function mapFeeling(feeling: PostClassFeeling | null): PostClassFeelingDto | null {
  if (!feeling) return null;
  return FEELING_TO_DTO[feeling];
}

function clampLimit(limit: number | undefined) {
  return Math.min(50, Math.max(1, limit ?? 15));
}

function encodeCursor(cursor: AccountActivityCursor) {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function decodeCursor(cursor: string | undefined): AccountActivityCursor | null {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8")
    ) as Partial<AccountActivityCursor>;
    if (typeof parsed.startsAtUtc !== "string" || typeof parsed.bookingId !== "string") {
      return null;
    }
    return {
      startsAtUtc: parsed.startsAtUtc,
      bookingId: parsed.bookingId,
    };
  } catch {
    return null;
  }
}

export async function getAccountActivity(
  userId: string,
  options?: { limit?: number; cursor?: string }
): Promise<AccountActivityDto> {
  const limit = clampLimit(options?.limit);
  const cursor = decodeCursor(options?.cursor);

  const [totalCount, rows] = await Promise.all([
    db.classBooking.count({
      where: {
        userId,
        status: ClassBookingStatus.attended,
      },
    }),
    db.classBooking.findMany({
      where: {
        userId,
        status: ClassBookingStatus.attended,
      },
      include: {
        session: {
          select: {
            id: true,
            classDefinitionSlug: true,
            titleSnapshot: true,
            typeSnapshot: true,
            startsAtUtc: true,
          },
        },
      },
    }),
  ]);

  const sortedRows = rows.sort((left, right) => {
    const dateDiff = right.session.startsAtUtc.getTime() - left.session.startsAtUtc.getTime();
    if (dateDiff !== 0) return dateDiff;
    return right.id.localeCompare(left.id);
  });

  const filteredRows = cursor
    ? sortedRows.filter((row) => {
        const rowStartsAt = row.session.startsAtUtc.toISOString();
        if (rowStartsAt < cursor.startsAtUtc) return true;
        if (rowStartsAt > cursor.startsAtUtc) return false;
        return row.id.localeCompare(cursor.bookingId) < 0;
      })
    : sortedRows;
  const pageRows = filteredRows.slice(0, limit + 1);
  const visibleRows = pageRows.slice(0, limit);
  const lastVisible = visibleRows.at(-1);

  return {
    attendedCount: totalCount,
    totalCount,
    items: visibleRows.map((row) => ({
      bookingId: row.id,
      sessionId: row.session.id,
      classSlug: row.session.classDefinitionSlug,
      className: row.session.titleSnapshot,
      classType: row.session.typeSnapshot,
      startsAtUtc: row.session.startsAtUtc.toISOString(),
      flareToday: Boolean(row.preClassFlareToday),
      postClassFeeling: mapFeeling(row.postClassFeeling),
    })),
    pageInfo: {
      nextCursor:
        pageRows.length > limit && lastVisible
          ? encodeCursor({
              startsAtUtc: lastVisible.session.startsAtUtc.toISOString(),
              bookingId: lastVisible.id,
            })
          : null,
    },
  };
}
