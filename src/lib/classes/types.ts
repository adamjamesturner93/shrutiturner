import type { ClassBookingStatus, ClassSessionStatus, ClassWaitlistStatus } from "@prisma/client";

export type ClassSessionListItemDto = {
  id: string;
  classDefinitionSlug: string;
  title: string;
  type: string;
  level: string;
  startsAtUtc: string;
  endsAtUtc: string;
  timezone: string;
  durationMinutes: number;
  capacity: number;
  status: ClassSessionStatus;
  instructorProfileEntryId: string | null;
  instructorName: string | null;
  instructorBio: string | null;
  instructorAvatarUrl: string | null;
  spotsRemaining: number;
  bookedCount: number;
  waitlistCount: number;
  dailyRoomUrl: string | null;
  isBookedByCurrentUser: boolean;
  myBookingStatus: ClassBookingStatus | null;
  waitlistPosition: number | null;
};

export type ClassBookingDto = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: ClassBookingStatus;
  bookedAt: string;
  healthConditions: string[];
  attendedClassesCount: number;
};

export type ClassWaitlistDto = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: ClassWaitlistStatus;
  position: number;
  createdAt: string;
};

export type ClassSessionDetailDto = ClassSessionListItemDto & {
  notes: string;
  cancelReason: string | null;
  bookings: ClassBookingDto[];
  waitlist: ClassWaitlistDto[];
};

export type BookSessionResultDto =
  | {
      status: "booked";
      bookingId: string;
      sessionId: string;
      bookingMode: "membership" | "credit" | "manual";
    }
  | {
      status: "waitlisted";
      waitlistEntryId: string;
      sessionId: string;
      position: number;
      bookingMode: "waitlist";
    };

export type BulkCreateSessionsInput = {
  classDefinitionSlug: string;
  startDate: string;
  timeLocal: string;
  durationMinutes: number;
  capacity: number;
  repeatWeeks: number;
  weekdays: number[];
  instructorUserId?: string;
  instructorProfileEntryId?: string;
  notes?: string;
};

export type AdminClassSessionDto = ClassSessionListItemDto & {
  notes: string;
};
