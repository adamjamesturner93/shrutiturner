import { ClassBookingStatus, PostClassFeeling } from "@prisma/client";
import type {
  PostClassFeelingDto,
  SessionFeedbackRequestDto,
  SessionFeedbackResponseDto,
} from "@/lib/api/types";
import { db } from "@/lib/db";
import { getHealthAccessState } from "@/lib/health/health-service";

const DTO_TO_FEELING: Record<PostClassFeelingDto, PostClassFeeling> = {
  great: PostClassFeeling.great,
  good: PostClassFeeling.good,
  okay: PostClassFeeling.okay,
  tough: PostClassFeeling.tough,
  "too-much": PostClassFeeling.too_much,
};

function isValidEnergyLevel(value: unknown): value is 1 | 2 | 3 | 4 | 5 {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;
}

export async function saveSessionFeedback(params: {
  sessionId: string;
  userId: string;
  input: SessionFeedbackRequestDto;
}): Promise<SessionFeedbackResponseDto> {
  const booking = await db.classBooking.findFirst({
    where: {
      sessionId: params.sessionId,
      userId: params.userId,
      status: {
        in: [ClassBookingStatus.booked, ClassBookingStatus.attended, ClassBookingStatus.no_show],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
    },
  });

  if (!booking) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  if (params.input.stage === "pre") {
    if (!isValidEnergyLevel(params.input.energyLevel)) {
      throw new Error("INVALID_PRE_FEEDBACK");
    }

    const healthAccess = await getHealthAccessState(params.userId);

    await db.classBooking.update({
      where: { id: booking.id },
      data: {
        preClassEnergyLevel: params.input.energyLevel,
        preClassFlareToday:
          healthAccess.checkInMode === "energy_and_flare"
            ? Boolean(params.input.flareToday)
            : false,
        preClassSubmittedAt: new Date(),
      },
    });

    return {
      bookingId: booking.id,
      stage: "pre",
    };
  }

  const feeling = DTO_TO_FEELING[params.input.feeling];
  if (!feeling) {
    throw new Error("INVALID_POST_FEEDBACK");
  }

  await db.classBooking.update({
    where: { id: booking.id },
    data: {
      postClassFeeling: feeling,
      postClassSubmittedAt: new Date(),
    },
  });

  return {
    bookingId: booking.id,
    stage: "post",
  };
}
