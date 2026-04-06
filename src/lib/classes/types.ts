import type { ClassBookingStatus, ClassSessionStatus, ClassWaitlistStatus } from "@prisma/client";

export type ScheduleClassItemDto = {
  id: string;
  sessionId: string;
  slug: string;
  name: string;
  type: string;
  day: string;
  dateLabel: string;
  startsAtUtc: string;
  time: string;
  duration: string;
  level: string;
  instructorName: string | null;
  instructorBio: string | null;
  instructorAvatarUrl: string | null;
  maxSpaces: number;
  shortDescription: string;
  spotsRemaining: number;
  bookedCount: number;
  status: ClassSessionStatus;
  emptyClassAutoCancelWindowMinutes: number;
  isBookedByCurrentUser: boolean;
  waitlistPosition: number | null;
};

export type ScheduleDayDto = {
  day: string;
  classes: ScheduleClassItemDto[];
};

export type ClassSessionListItemDto = {
  id: string;
  classDefinitionSlug: string;
  title: string;
  type: string;
  level: string;
  localDate: string | null;
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
  roomSetupStatus?: "pending" | "ready" | "failed";
  roomSetupError?: string | null;
  communityModeEnabled: boolean;
  isRecorded?: boolean;
  recordingScope?: string | null;
  replayAvailable?: boolean;
  replayAccessDurationDays?: number | null;
  chatEnabled?: boolean;
  participantMicDefaultMuted?: boolean;
  participantCameraDefaultOff?: boolean;
  threeHourOutcome?: "pending" | "reminded" | "cancelled_no_attendance";
  joinWindowOpensAt: string;
  preJoinWindowMinutes: number;
  lateJoinCutoffMinutes: number;
  lateJoinCutoffAt: string;
  emptyClassAutoCancelWindowMinutes: number;
  isBookedByCurrentUser: boolean;
  myBookingStatus: ClassBookingStatus | null;
  hasPreviouslyJoinedCurrentUser: boolean;
  waitlistPosition: number | null;
  currentUserCheckInMode?: "energy_only" | "energy_and_flare";
};

export type ClassBookingDto = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: ClassBookingStatus;
  bookedAt: string;
  firstJoinedAt: string | null;
  lastJoinedAt: string | null;
  lastLeftAt: string | null;
  joinCount: number;
  attendanceSource: "daily" | "manual" | null;
  healthConditions: string[];
  attendedClassesCount: number;
  preClassEnergyLevel: 1 | 2 | 3 | 4 | 5 | null;
  preClassFlareToday: boolean;
  preClassSubmittedAt: string | null;
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
  instructorUserId: string;
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
  cancelReason?: string | null;
  attendedCount: number;
  noShowCount: number;
};

export type ClassTimetableRuleDto = {
  id: string;
  classDefinitionSlug: string;
  className: string;
  classType: string;
  weekday: number;
  startsAtLocal: string;
  durationMinutes: number;
  timezone: string;
  defaultCapacity: number;
  instructorUserId: string;
  instructorProfileEntryId: string | null;
  instructorName: string | null;
  startsOn: string;
  endsOn: string | null;
  active: boolean;
  notes: string;
  exclusionDates: string[];
  nextSessionDate: string | null;
  generatedSessionCount: number;
};

export type ClassTimetableRuleInput = {
  classDefinitionSlug: string;
  weekday: number;
  startsAtLocal: string;
  durationMinutes: number;
  timezone?: string;
  defaultCapacity: number;
  instructorUserId: string;
  instructorProfileEntryId?: string;
  startsOn: string;
  endsOn?: string;
  active?: boolean;
  notes?: string;
  exclusionDates?: string[];
};

export type DraftTimetableResultDto = {
  createdSessionIds: string[];
  createdCount: number;
  skippedExistingCount: number;
};

export type PublishTimetableResultDto = {
  draftCreatedSessionIds: string[];
  publishedSessionIds: string[];
  draftCreatedCount: number;
  publishedCount: number;
  skippedExistingCount: number;
  failedRoomSetupCount: number;
  dailyConfigured: boolean;
};
