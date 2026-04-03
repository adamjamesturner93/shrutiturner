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

function mapFeeling(feeling: PostClassFeeling | null): PostClassFeelingDto | null {
  if (!feeling) return null;
  return FEELING_TO_DTO[feeling];
}

export async function getAccountActivity(
  userId: string,
  options?: { limit?: number }
): Promise<AccountActivityDto> {
  const limit = Math.max(1, options?.limit ?? 15);

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

  const items = rows
    .sort((left, right) => right.session.startsAtUtc.getTime() - left.session.startsAtUtc.getTime())
    .slice(0, limit);

  return {
    attendedCount: totalCount,
    totalCount,
    items: items.map((row) => ({
      bookingId: row.id,
      sessionId: row.session.id,
      classSlug: row.session.classDefinitionSlug,
      className: row.session.titleSnapshot,
      classType: row.session.typeSnapshot,
      startsAtUtc: row.session.startsAtUtc.toISOString(),
      flareToday: Boolean(row.preClassFlareToday),
      postClassFeeling: mapFeeling(row.postClassFeeling),
    })),
  };
}
