export type ReferralHistoryItemDto = {
  id: string;
  friend: string;
  friendEmailMasked: string;
  joinedAt: string;
  status: string;
  amountPence: number;
  qualifiedAt: string | null;
  rewardedAt: string | null;
};

export type ReferralSummaryDto = {
  referralCode: string;
  referralLink: string;
  referralCount: number;
  referralEarnedPence: number;
  referralBalancePence: number;
  history: ReferralHistoryItemDto[];
};

export type HealthProfileDto = {
  conditions: Record<string, boolean>;
  details: Record<string, string>;
  additionalNotes: string;
  lastUpdated: string;
};

export type NotificationPreferencesDto = {
  userId: string;
  classReminders: boolean;
  scheduleUpdates: boolean;
  programAnnouncements: boolean;
  marketingEmails: boolean;
  updatedAt: string;
};

export type AccountProfileDto = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  email: string;
  isCoachingClient: boolean;
  hasHealthProfile: boolean;
  dob: string | null;
  gender: string | null;
  ethnicity: string | null;
  timezone: string;
  dateFormat: string;
  isOnboarded: boolean;
  hasAgreedToTerms: boolean;
  hasAgreedToHealth: boolean;
  termsAgreedAt: string | null;
  healthAgreedAt: string | null;
  acceptedTermsVersion: string | null;
  acceptedHealthWaiverVersion: string | null;
  currentTermsVersion: string;
  currentHealthWaiverVersion: string;
  needsTermsReacceptance: boolean;
  needsHealthWaiverReacceptance: boolean;
  hasConsentedToHealthData: boolean;
  healthDataConsentedAt: string | null;
  acceptedHealthDataConsentVersion: string | null;
  currentHealthDataConsentVersion: string;
  needsHealthDataConsentRefresh: boolean;
  heardAboutSource: string | null;
  heardAboutDetail: string | null;
  onboarding: OnboardingStateDto;
};

export type AccountDto = {
  profile: AccountProfileDto;
  notifications: NotificationPreferencesDto;
  referral: ReferralSummaryDto;
};

export type OnboardingStateDto = {
  isComplete: boolean;
  checklistComplete: boolean;
  nextStep: "profile" | "legal" | "source" | "health" | "welcome" | "complete";
  missingSteps: Array<"profile" | "legal" | "source" | "health">;
};

export type BlogCommentDto = {
  id: string;
  postSlug: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  status: "visible" | "hidden" | "deleted";
  authorId: string;
  authorName: string;
  authorInitials: string;
  replies?: BlogCommentDto[];
};

export type BlogEngagementDto = {
  postSlug: string;
  reactionCount: number;
  commentCount: number;
  hasReacted: boolean;
  comments: BlogCommentDto[];
};

export type ContactSubmissionResponseDto = {
  ok: boolean;
  id: string;
};

export type CoachingApplicationResponseDto = {
  ok: boolean;
  id: string;
};

export type CoachingDashboardDto = {
  state: "not_a_client" | "application_pending" | "onboarding" | "active" | "paused" | "completed";
  hasProfile: boolean;
  isCoachingClient: boolean;
  profile: null | {
    id: string;
    tier: "personal_programme" | "coached_plan" | "coaching" | "unsure";
    status: "application_pending" | "onboarding" | "active" | "paused" | "completed";
    includesMoveWellMembership: boolean;
    everfitConnectionStatus: "not_started" | "invite_sent" | "connected" | "sync_issue";
    nextCheckInDueAt: string | null;
    nextCheckInStatus: "due" | "submitted" | "reviewed" | "overdue" | null;
    nextSessionStartsAt: string | null;
    latestCoachResponseSummary: string | null;
  };
  application: null | {
    id: string;
    status:
      | "submitted"
      | "under_review"
      | "follow_up_needed"
      | "approved"
      | "declined"
      | "converted";
    tier: "personal_programme" | "coached_plan" | "coaching" | "unsure";
    createdAt: string;
  };
};

export type RetreatBookingSummaryDto = {
  id: string;
  retreatSlug: string;
  retreatTitle: string;
  location: string;
  startsAt: string;
  endsAt: string;
  bookingStatus: string;
  paymentStatus: string;
  totalPricePence: number;
  depositPaidPence: number;
  balanceAmountPence: number;
  balanceDueAt: string | null;
  roomType: string | null;
  dietaryRequirements: string | null;
  medicalConditions: string | null;
  mobilityNeeds: string | null;
  canPayBalance: boolean;
};

export type RetreatBookingDetailDto = RetreatBookingSummaryDto & {
  emergencyContactName: string;
  emergencyContactPhone: string;
};

export type AdminCoachingApplicationDto = {
  id: string;
  applicantName: string;
  applicantEmail: string;
  status: string;
  tier: string;
  createdAt: string;
  reviewedAt: string | null;
  approvedAt: string | null;
  userId: string | null;
  isLinkedUserCoachingClient: boolean;
  hasMoveWellMembershipSnapshot: boolean;
  answers: Record<string, string>;
  adminNotes: string;
};

export type AdminRetreatSummaryDto = {
  id: string;
  retreatSlug: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
  bookedSpaces: number;
  totalSpaces: number;
  revenuePence: number;
  earlyBirdPricePence: number;
  normalPricePence: number;
};

export type AdminRetreatDetailDto = {
  id: string;
  retreatSlug: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
  capacity: number;
  revenuePence: number;
  depositAmountPence: number;
  pricePence: number;
  singleRoomSupplementPence: number;
  balanceDueAt: string | null;
  bookings: Array<{
    id: string;
    purchaserName: string;
    purchaserEmail: string;
    attendeeName: string;
    attendeeEmail: string;
    roomType: string | null;
    dietaryRequirements: string | null;
    medicalConditions: string | null;
    mobilityNeeds: string | null;
    paymentStatus: string;
    bookingStatus: string;
    depositPaidPence: number;
    balancePaidPence: number;
    totalPricePence: number;
    bookedAt: string;
  }>;
};

export type AdminBlogCommentDto = {
  id: string;
  postSlug: string;
  parentId: string | null;
  content: string;
  status: string;
  createdAt: string;
  authorId: string;
  authorEmail: string;
  authorName: string;
  replyCount: number;
};

export type MembershipStateDto = {
  membership: {
    id: string;
    plan: "movewell" | "instructor";
    billingInterval: "monthly" | "annual";
    isAnnual: boolean;
    status: "active" | "paused" | "cancelled" | "expired" | "past_due";
    label: string;
    renewalDate: string | null;
    classesPerWeek: number;
    classesUsedThisWeek: number;
    classesRemaining: number;
    pricePence: number;
    cancelAtPeriodEnd: boolean;
    accessActive: boolean;
    endsAt: string | null;
  } | null;
  credits: {
    balance: number;
    summary: Array<{
      sourceId: string;
      sourceLabel: string;
      remaining: number;
      expiresAt: string | null;
    }>;
  };
  referral: {
    balancePence: number;
  };
};

export type CreditCheckoutResponseDto = {
  checkoutUrl: string;
  sessionId: string;
  discountPence: number;
  discountSource?: "promo" | "referral" | "none";
};

export type MembershipCheckoutResponseDto = CreditCheckoutResponseDto;

export type PublicPricingDto = {
  currency: string;
  source: "stripe" | "fallback";
  membership: {
    movewell: number;
  };
  membershipDisplay: {
    movewellMonthly: number;
    movewellAnnual?: number | null;
    trialDays?: number | null;
  };
  credits: {
    1: number;
    3: number;
    10: number;
  };
  creditsExpiryDays: number;
};

export type BillingHistoryItemDto = {
  id: string;
  createdAt: string;
  kind:
    | "membership_charge"
    | "credit_purchase"
    | "credit_refund"
    | "booking_use"
    | "referral_discount"
    | "payment_failed";
  description: string;
  amountPence: number;
  status: "paid" | "failed" | "refunded" | "applied";
  stripeInvoiceId?: string | null;
  stripeCheckoutSessionId?: string | null;
};

export type DashboardSummaryDto = {
  hasHealthProfile: boolean;
  upcomingClasses: Array<{
    bookingId: string;
    sessionId: string;
    classSlug: string;
    className: string;
    classType: string;
    startsAtUtc: string;
    durationMinutes: number;
    entitlementType: "membership" | "credit" | "manual";
  }>;
  attendance: {
    attendedCount: number;
    thisWeekBookedCount: number;
  };
  favourites: Array<{
    classSlug: string;
    className: string;
    classType: string;
    startsAtUtc: string | null;
  }>;
  membership: MembershipStateDto["membership"];
  credits: MembershipStateDto["credits"];
  referral: MembershipStateDto["referral"];
};

export type AdminDashboardSummaryDto = {
  today: {
    date: string;
    sessions: number;
    liveNow: number;
    booked: number;
    capacity: number;
  };
  upcoming: Array<{
    id: string;
    title: string;
    type: string;
    startsAtUtc: string;
    durationMinutes: number;
    bookedCount: number;
    capacity: number;
    status: "scheduled" | "live" | "completed" | "cancelled";
  }>;
  nearFull: Array<{
    id: string;
    title: string;
    type: string;
    startsAtUtc: string;
    bookedCount: number;
    capacity: number;
  }>;
  trends: Array<{
    date: string;
    booked: number;
    attended: number;
  }>;
};

export type AdminSubscriberDto = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  newsletterSubscribed: boolean;
  blogSubscribed: boolean;
  subscriptionType: "newsletter" | "blog" | "both" | "neither";
  updatedAt: string;
};

export type AdminSubscriberSegmentSummaryDto = {
  newsletter: number;
  blog: number;
  both: number;
  neither: number;
  total: number;
};

export type AdminNewsletterCampaignDetailDto = {
  id: string;
  providerCampaignId: string;
  subject: string;
  status: "sent" | "scheduled" | "sending" | "failed" | "failed_partial";
  sentDate: string;
  totalRecipients: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  spamComplaints: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
  audienceType?: string | null;
  triggeredBy?: string | null;
  topLinks: Array<{ url: string; clicks: number }>;
  eventTimeline: Array<{ date: string; opened: number; clicked: number; bounced: number }>;
};

export type AdminBusinessMetricDto = {
  activeMembers: number;
  totalMembers: number;
  monthlyRecurringRevenuePence: number;
  newMembersThisMonth: number;
  cancelledLast30Days: number;
  churnRatePercent: number;
  failedPayments7d: number;
  failedPayments30d: number;
  dataFreshnessIso: string | null;
};

export type AdminMemberListItemDto = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarInitials: string;
  joinedDate: string;
  membershipPlan: string | null;
  membershipLabel: string;
  status: string;
  creditBalance: number;
  referralCode: string;
  referralsCount: number;
  referralBalance: number;
  totalBookings: number;
  lastClassDate: string;
  notes: string;
  tags: string[];
  newsletterSubscribed: boolean;
  blogSubscribed: boolean;
  isInstructor: boolean;
  instructorProfileEntryId?: string | null;
  instructorProfileName?: string | null;
  isCoachingClient: boolean;
  risk?: string | null;
};

export type AdminHealthConditionDto = {
  key: string;
  label: string;
  detail: string;
};

export type AdminHealthCategoryDto = {
  categoryId: string;
  categoryTitle: string;
  conditions: AdminHealthConditionDto[];
};

export type AdminHealthProfileDto = {
  categories: AdminHealthCategoryDto[];
  additionalNotes: string;
  lastUpdated: string;
};

export type AdminMemberDetailDto = AdminMemberListItemDto & {
  creditHistory: Array<{
    id: string;
    date: string;
    amount: number;
    reason: string;
    type: string;
    by: string;
  }>;
  healthProfile: AdminHealthProfileDto | null;
};

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
  status: "scheduled" | "live" | "completed" | "cancelled";
  instructorProfileEntryId: string | null;
  instructorName: string | null;
  instructorBio: string | null;
  instructorAvatarUrl: string | null;
  spotsRemaining: number;
  bookedCount: number;
  waitlistCount: number;
  dailyRoomUrl: string | null;
  communityModeEnabled: boolean;
  lateJoinCutoffAt: string;
  isBookedByCurrentUser: boolean;
  myBookingStatus: "booked" | "cancelled" | "attended" | "no_show" | null;
  hasPreviouslyJoinedCurrentUser: boolean;
  waitlistPosition: number | null;
};

export type ClassSessionDetailDto = ClassSessionListItemDto & {
  notes: string;
  cancelReason: string | null;
  bookings: Array<{
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    status: "booked" | "cancelled" | "attended" | "no_show";
    bookedAt: string;
    firstJoinedAt: string | null;
    lastJoinedAt: string | null;
    lastLeftAt: string | null;
    joinCount: number;
    attendanceSource: "daily" | "manual" | null;
    healthConditions: string[];
    attendedClassesCount: number;
  }>;
  waitlist: Array<{
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    status: "waiting" | "promoted" | "removed";
    position: number;
    createdAt: string;
  }>;
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
