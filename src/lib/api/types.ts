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

export type HealthDeclarationStatusDto = "incomplete" | "none_declared" | "context_declared";

export type HealthProfileDto = {
  declarationStatus: HealthDeclarationStatusDto;
  conditions: Record<string, boolean>;
  details: Record<string, string>;
  tracksFlareCheckIns: boolean;
  additionalNotes: string;
  lastConfirmedAt: string;
  lastUpdated: string;
  needsReview: boolean;
  reviewRequestedAt?: string | null;
  reviewReason?: "admin_update" | "periodic" | null;
};

export type NotificationPreferencesDto = {
  userId: string;
  newsletterStatus: "never_subscribed" | "pending" | "subscribed" | "unsubscribed";
  newsletterSubscribed: boolean;
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
  healthDeclarationStatus: HealthDeclarationStatusDto;
  healthDeclarationLastConfirmedAt: string;
  healthDeclarationNeedsReview: boolean;
  tracksFlareCheckIns: boolean;
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

export type PostClassFeelingDto = "great" | "good" | "okay" | "tough" | "too-much";

export type AccountActivityItemDto = {
  bookingId: string;
  sessionId: string;
  classSlug: string;
  className: string;
  classType: string;
  startsAtUtc: string;
  flareToday: boolean;
  postClassFeeling: PostClassFeelingDto | null;
};

export type AccountActivityDto = {
  attendedCount: number;
  totalCount: number;
  items: AccountActivityItemDto[];
  pageInfo: {
    nextCursor: string | null;
  };
};

export type SessionFeedbackRequestDto =
  | {
      stage: "pre";
      energyLevel: 1 | 2 | 3 | 4 | 5;
      flareToday?: boolean;
    }
  | {
      stage: "post";
      feeling: PostClassFeelingDto;
    };

export type SessionFeedbackResponseDto = {
  bookingId: string;
  stage: "pre" | "post";
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

export type CoachingBillingPhase =
  | "not_configured"
  | "active"
  | "cancellation_scheduled"
  | "final_month"
  | "completed"
  | "payment_problem";

export type CoachingAdminTodoDto = {
  id: string;
  applicationId: string;
  clientName: string;
  kind:
    | "review_enquiry"
    | "follow_up"
    | "record_consultation"
    | "send_recommendation"
    | "everfit_setup"
    | "everfit_attention"
    | "billing_attention"
    | "final_month_handover"
    | "close_everfit";
  priority: "action" | "overdue";
  title: string;
  detail: string;
  dueAt: string | null;
  href: string;
};

export type CoachingDashboardDto = {
  state:
    | "not_a_client"
    | "application_pending"
    | "waitlisted"
    | "withdrawn"
    | "onboarding"
    | "active"
    | "paused"
    | "completed";
  hasProfile: boolean;
  isCoachingClient: boolean;
  profile: null | {
    id: string;
    tier: "personal_programme" | "coached_plan" | "coaching" | "unsure";
    billingArrangement: "paid" | "pro_bono";
    billingStartsAt: string | null;
    status: "application_pending" | "onboarding" | "active" | "paused" | "completed";
    everfitConnectionStatus: "not_started" | "invite_sent" | "connected" | "sync_issue" | "closed";
    nextCheckInDueAt: string | null;
    nextCheckInStatus: "due" | "submitted" | "reviewed" | "overdue" | null;
    nextSessionStartsAt: string | null;
    latestCoachResponseSummary: string | null;
    billingCancellationRequestedAt: string | null;
    billingFinalPaymentAt: string | null;
    billingEndsAt: string | null;
    billingPhase: CoachingBillingPhase;
    nextBillingAt: string | null;
    nextBillingAmountPence: number | null;
    billingCurrency: string | null;
    pendingPackageChange: null | {
      id: string;
      requestType: "package_change" | "paid_start";
      billingStartsAt: string | null;
      fromTier: "personal_programme" | "coached_plan" | "coaching" | "unsure";
      toTier: "personal_programme" | "coached_plan" | "coaching" | "unsure";
      fromOfferKey:
        | "guided_accountability"
        | "independent_training_plan"
        | "guided_training_plan"
        | "one_to_one_coaching"
        | null;
      toOfferKey:
        | "guided_accountability"
        | "independent_training_plan"
        | "guided_training_plan"
        | "one_to_one_coaching";
      effectiveMode: "next_invoice" | "immediate" | "manual";
      note: string | null;
      createdAt: string;
    };
  };
  application: null | {
    id: string;
    offerKey:
      | "guided_accountability"
      | "independent_training_plan"
      | "guided_training_plan"
      | "one_to_one_coaching"
      | null;
    status:
      | "submitted"
      | "under_review"
      | "follow_up_needed"
      | "consultation_scheduled"
      | "consultation_completed"
      | "offer_sent"
      | "waitlisted"
      | "approved"
      | "declined"
      | "converted"
      | "withdrawn";
    decisionReason: string | null;
    tier: "personal_programme" | "coached_plan" | "coaching" | "unsure";
    createdAt: string;
    waitlistedAt: string | null;
    waitlistLeftAt: string | null;
    consultationStatus: "not_scheduled" | "scheduled" | "completed" | "cancelled";
    consultationScheduledAt: string | null;
    consultationCompletedAt: string | null;
    offerSentAt: string | null;
  };
};

export type RetreatBookingSummaryDto = {
  id: string;
  retreatSlug: string;
  retreatTitle: string;
  retreatType: string;
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
  attendeeCount: number;
  addons: Array<{
    id: string;
    name: string;
    quantity: number;
    totalPricePence: number;
  }>;
  dietaryRequirements: string | null;
  medicalConditions: string | null;
  mobilityNeeds: string | null;
  liveRoomPrepared: boolean;
  canPayBalance: boolean;
  canRequestCancellation: boolean;
  latestCancellation: {
    id: string;
    status: string;
    reason: string | null;
    refundableAmountPence: number;
    adminDecisionReason: string | null;
    requestedAt: string;
    completedAt: string | null;
  } | null;
};

export type RetreatBookingDetailDto = RetreatBookingSummaryDto & {
  emergencyContactName: string;
  emergencyContactPhone: string;
  secondaryGuest: {
    firstName: string;
    lastName: string;
    email: string;
    dietaryRequirements: string | null;
    status: string;
  } | null;
  onlineAccess: {
    entitled: boolean;
    liveAccessEnabled: boolean;
    liveAccessStartsAt: string | null;
    liveAccessEndsAt: string | null;
    replayAccessEnabled: boolean;
    replayAvailableAt: string | null;
    replayExpiresAt: string | null;
    replayAssetId: string | null;
  } | null;
};

export type RetreatGiftPurchaseSummaryDto = {
  id: string;
  retreatSlug: string;
  retreatTitle: string;
  location: string;
  startsAt: string;
  endsAt: string;
  recipientName: string;
  recipientEmail: string;
  roomType: string | null;
  guestCount: number;
  status: string;
  totalPaidPence: number;
  refundedAmountPence: number;
  purchasedAt: string | null;
  deliveredAt: string | null;
  redeemedAt: string | null;
  canRequestCancellation: boolean;
  cancellation: null | {
    id: string;
    status: string;
    refundableAmountPence: number;
    requestedAt: string;
  };
};

export type ReplayAssetSummaryDto = {
  id: string;
  resourceType: string;
  title: string;
  subtitle: string | null;
  startsAt: string | null;
  endsAt: string | null;
  status: "processing" | "ready" | "delete_pending" | "deleted" | "sync_failed" | "delete_failed";
  entitlementEndsAt: string | null;
  deleteAfterAt: string | null;
  deletedAt: string | null;
  accessType: "participant" | "assigned_instructor" | "owner_admin";
  isExpired: boolean;
  canPlay: boolean;
};

export type ReplayPlaybackAccessDto = {
  replayAssetId: string;
  playbackUrl: string;
  status: "processing" | "ready" | "delete_pending" | "deleted" | "sync_failed" | "delete_failed";
};

export type AdminCoachingApplicationDto = {
  id: string;
  offerKey:
    | "guided_accountability"
    | "independent_training_plan"
    | "guided_training_plan"
    | "one_to_one_coaching"
    | null;
  applicantName: string;
  applicantEmail: string;
  status: string;
  tier: string;
  createdAt: string;
  reviewedAt: string | null;
  approvedAt: string | null;
  paymentReminderSentAt: string | null;
  waitlistedAt: string | null;
  waitlistLeftAt: string | null;
  consultationStatus: "not_scheduled" | "scheduled" | "completed" | "cancelled";
  consultationScheduledAt: string | null;
  consultationCompletedAt: string | null;
  consultationNotes: string;
  offerSentAt: string | null;
  userId: string | null;
  isLinkedUserCoachingClient: boolean;
  decisionReason: string;
  answers: Record<string, string>;
  adminNotes: string;
  todos: CoachingAdminTodoDto[];
  coachingProfile: null | {
    id: string;
    billingArrangement: "paid" | "pro_bono";
    billingStartsAt: string | null;
    status: "application_pending" | "onboarding" | "active" | "paused" | "completed";
    everfitConnectionStatus: "not_started" | "invite_sent" | "connected" | "sync_issue" | "closed";
    billingCancellationRequestedAt: string | null;
    billingFinalPaymentAt: string | null;
    billingEndsAt: string | null;
    billingPhase: CoachingBillingPhase;
    nextBillingAt: string | null;
    nextBillingAmountPence: number | null;
    billingCurrency: string | null;
    subscriptionStatus: string | null;
    tier: "personal_programme" | "coached_plan" | "coaching" | "unsure";
    pendingPackageChange: null | {
      id: string;
      requestType: "package_change" | "paid_start";
      billingStartsAt: string | null;
      fromTier: "personal_programme" | "coached_plan" | "coaching" | "unsure";
      toTier: "personal_programme" | "coached_plan" | "coaching" | "unsure";
      fromOfferKey:
        | "guided_accountability"
        | "independent_training_plan"
        | "guided_training_plan"
        | "one_to_one_coaching"
        | null;
      toOfferKey:
        | "guided_accountability"
        | "independent_training_plan"
        | "guided_training_plan"
        | "one_to_one_coaching";
      effectiveMode: "next_invoice" | "immediate" | "manual";
      note: string | null;
      createdAt: string;
    };
  };
};

export type AdminRetreatSummaryDto = {
  id: string;
  retreatSlug: string;
  title: string;
  location: string;
  timezone: string;
  startDate: string;
  endDate: string;
  status: string;
  retreatType: string;
  bookedSpaces: number;
  totalSpaces: number;
  revenuePence: number;
  earlyBirdPricePence: number;
  normalPricePence: number;
};

export type AdminRetreatTemplateDto = {
  slug: string;
  title: string;
  location: string;
  retreatType: "in_person" | "online";
  capacity: number;
  pricePence: number;
  paymentPolicy: "deposit" | "full_payment";
};

export type AdminRetreatDetailDto = {
  id: string;
  retreatSlug: string;
  title: string;
  location: string;
  timezone: string;
  startDate: string;
  endDate: string;
  status: string;
  retreatType: string;
  liveRoomPrepared: boolean;
  liveRoomState: "unprepared" | "prepared" | "started" | "ended";
  liveDisplayMode: "gallery" | "presenter";
  liveDisplayVersion: number;
  focusedPresenterUserId: string | null;
  replayPublished: boolean;
  replayAssets: Array<{
    id: string;
    status: string;
    completedAt: string | null;
    deleteAfterAt: string | null;
  }>;
  roomSetupStatus: string;
  roomSetupError: string | null;
  capacity: number;
  revenuePence: number;
  depositAmountPence: number;
  pricePence: number;
  singleRoomSupplementPence: number;
  balanceDueAt: string | null;
  paymentPolicy: "deposit" | "full_payment";
  depositRule: null | {
    depositType: "percentage" | "fixed_amount" | "full_payment";
    depositPercentageBasisPoints: number | null;
    fixedDepositAmountPence: number | null;
    balanceDueDaysBeforeStart: number | null;
  };
  pricingLocked: boolean;
  inventoryPools: Array<{
    id: string;
    name: string;
    inventoryType: string;
    totalQuantity: number;
    active: boolean;
  }>;
  roomOptions: Array<{
    id: string;
    label: string;
    inventoryPoolId: string | null;
    inventoryUnitsPerBooking: number;
    capacity: number;
    bookingUnit: string;
    active: boolean;
  }>;
  ratePlans: Array<{
    id: string;
    roomOptionId: string;
    roomLabel: string;
    guestCount: number;
    totalPricePence: number;
    earlyBirdPricePence: number | null;
    earlyBirdEndsAt: string | null;
    active: boolean;
  }>;
  addons: Array<{
    id: string;
    name: string;
    description: string | null;
    pricePence: number;
    currency: string;
    totalQuantity: number | null;
    availableQuantity: number | null;
    requiresTimeSlot: boolean;
    active: boolean;
  }>;
  roomUnits: Array<{
    id: string;
    roomOptionId: string;
    inventoryPoolId: string | null;
    roomOptionLabel: string;
    label: string;
    capacityUnits: number;
    occupiedUnits: number;
    status: string;
  }>;
  gifts: Array<{
    id: string;
    purchaserName: string;
    purchaserEmail: string;
    recipientName: string;
    recipientEmail: string;
    roomLabel: string | null;
    guestCount: number;
    totalPaidPence: number;
    refundedAmountPence: number;
    status: string;
    purchasedAt: string | null;
    redeemedAt: string | null;
    deliveryTarget: string;
    deliveryEmailSentAt: string | null;
    liveReminder24hSentAt: string | null;
    liveReminder1hSentAt: string | null;
    cancellationRequest: null | {
      id: string;
      status: string;
      reason: string | null;
      refundableAmountPence: number;
      requestedAt: string;
    };
  }>;
  bookings: Array<{
    id: string;
    purchaserName: string;
    purchaserEmail: string;
    attendeeName: string;
    attendeeEmail: string;
    accountLinked: boolean;
    setupComplete: boolean;
    setupMissing: string[];
    liveAccessEnabled: boolean;
    liveReminder24hSentAt: string | null;
    liveReminder1hSentAt: string | null;
    attendeeCount: number;
    roomType: string | null;
    roomOptionId: string | null;
    inventoryPoolId: string | null;
    roomUnitId: string | null;
    roomUnitLabel: string | null;
    addons: Array<{
      id: string;
      name: string;
      quantity: number;
      totalPricePence: number;
    }>;
    dietaryRequirements: string | null;
    medicalConditions: string | null;
    mobilityNeeds: string | null;
    paymentStatus: string;
    bookingStatus: string;
    depositPaidPence: number;
    balancePaidPence: number;
    totalPricePence: number;
    payInFullDiscountPence: number;
    nonRefundableAmountPence: number;
    instalments: Array<{
      id: string;
      sequence: number;
      kind: string;
      label: string;
      amountPence: number;
      status: string;
      dueAt: string | null;
      paidAt: string | null;
    }>;
    cancellationRequests: Array<{
      id: string;
      status: string;
      reason: string | null;
      refundableAmountPence: number;
      adminDecisionReason: string | null;
      requestedAt: string;
      reviewedAt: string | null;
      completedAt: string | null;
    }>;
    bookedAt: string;
  }>;
};

export type AdminRetreatEvidenceDto = {
  retreatDateId: string;
  bookings: Array<{
    id: string;
    purchaserEmail: string;
    attendeeEmail: string;
    paymentStatus: string;
    bookingStatus: string;
    guestAcceptances: Array<{
      id: string;
      purchaserEmail: string;
      type: string;
      version: string;
      acceptedAt: string;
      surface: string;
    }>;
  }>;
  gifts: Array<{
    id: string;
    purchaserEmail: string;
    recipientEmail: string;
    status: string;
    guestAcceptances: Array<{
      id: string;
      purchaserEmail: string;
      type: string;
      version: string;
      acceptedAt: string;
      surface: string;
    }>;
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
    paymentIssue: {
      status: "open" | "suspended";
      graceEndsAt: string;
      amountDuePence: number;
      invoiceUrl: string | null;
      suspendedAt: string | null;
    } | null;
    compliance: {
      disclosureVersion: string | null;
      disclosureAcceptedAt: string | null;
      inInitialCoolingOff: boolean;
      inRenewalCoolingOff: boolean;
      trialEndsAt: string | null;
      initialCoolingOffEndsAt: string | null;
      renewalCoolingOffEndsAt: string | null;
      renewalCoolingOffKind: "trial_conversion" | "annual_renewal" | null;
    };
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
  complianceHistory: Array<{
    id: string;
    kind:
      | "disclosure_acknowledged"
      | "trial_reminder"
      | "monthly_reminder"
      | "annual_renewal_reminder"
      | "renewal_cooling_off_notice"
      | "end_of_contract_notice"
      | "membership_cancelled"
      | "cooling_off_cancellation"
      | "refund_issued"
      | "payment_failure_notice"
      | "payment_recovery_notice";
    status: string;
    channel: string;
    summary: string;
    eventAt: string;
  }>;
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
  invoiceUrl?: string | null;
};

export type DashboardSummaryDto = {
  hasHealthProfile: boolean;
  healthDeclarationStatus: HealthDeclarationStatusDto;
  healthDeclarationLastConfirmedAt: string;
  healthDeclarationNeedsReview: boolean;
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
    currentStreakWeeks: number;
    lastAttendedAt: string | null;
  };
  favourites: Array<{
    classSlug: string;
    className: string;
    classType: string;
    startsAtUtc: string | null;
  }>;
  suggestedClasses: Array<{
    sessionId: string;
    classSlug: string;
    className: string;
    classType: string;
    startsAtUtc: string;
    durationMinutes: number;
  }>;
  membership: MembershipStateDto["membership"];
  credits: MembershipStateDto["credits"];
  referral: MembershipStateDto["referral"];
  actions: Array<{
    id: string;
    priority: "action" | "overdue";
    title: string;
    detail: string;
    href: string;
    ctaLabel: string;
    dueAt: string | null;
  }>;
  upcoming: Array<{
    id: string;
    kind: "coaching_payment" | "coaching_end" | "retreat_balance" | "retreat" | "class";
    title: string;
    detail: string;
    at: string;
    amountPence: number | null;
    currency: string | null;
    href: string;
  }>;
  services: Array<{
    id: "coaching" | "retreats" | "classes" | "membership";
    title: string;
    status: string;
    href: string;
  }>;
};

export type AdminDashboardSummaryDto = {
  coachingTodos: CoachingAdminTodoDto[];
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
    status: "draft" | "scheduled" | "live" | "completed" | "cancelled";
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

export type AdminEmailDeliveryHealthDto = {
  failedCount: number;
  deadLetterCount: number;
  retryQueuedCount: number;
  nextRetryAt: string | null;
  recentFailures: Array<{
    id: string;
    toEmail: string;
    templateKey: string;
    category: string;
    subject: string;
    status: "failed" | "dead_letter";
    attemptCount: number;
    maxAttempts: number;
    nextRetryAt: string | null;
    lastError: string | null;
    updatedAt: string;
  }>;
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
  status: "draft" | "scheduled" | "live" | "completed" | "cancelled";
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
  myBookingStatus: "booked" | "cancelled" | "attended" | "no_show" | null;
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
  status: "booked" | "cancelled" | "attended" | "no_show";
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
  status: "waiting" | "promoted" | "removed";
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
  failedSends: number;
  deliveryRate: number;
  openRate: number | null;
  clickRate: number | null;
  clickToOpenRate: number | null;
  unsubscribeRate: number;
  bounceRate: number;
  complaintRate: number;
  audienceType?: string | null;
  triggeredBy?: string | null;
  sourceSystem: string;
  messageStream: string | null;
  trackingState: "available" | "awaiting" | "unavailable";
  reportingSource: "postmark_api" | "event_history";
  attentionReasons: string[];
  errorSummary: string | null;
  topLinks: Array<{ url: string; clicks: number }>;
  eventTimeline: Array<{ date: string; opened: number; clicked: number; bounced: number }>;
};

export type AdminBusinessMetricDto = {
  activeOneToOneClients: number;
  operationalOneToOneClients: number;
  trackedSubscriptions: number;
  subscriptionsNeedingSync: number;
  monthlyRecurringRevenuePence: number;
  newPaidClientsThisMonth: number;
  endingSoonCount: number;
  failedPayments7d: number;
  failedPayments30d: number;
  dataFreshnessIso: string | null;
};

export type PlatformSettingsDto = {
  businessName: string;
  supportEmail: string | null;
  contactEmail: string | null;
  instagramUrl: string | null;
  defaultSeoTitle: string | null;
  defaultSeoDescription: string | null;
  gaMeasurementId: string | null;
};

export type ClassOperationalSettingsDto = {
  preJoinWindowMinutes: number;
  lateJoinCutoffMinutes: number;
  creditRefundWindowMinutes: number;
  emptyClassAutoCancelWindowMinutes: number;
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
  lastClassDate: string | null;
  notes: string;
  newsletterStatus: "never_subscribed" | "pending" | "subscribed" | "unsubscribed";
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
  declarationStatus: HealthDeclarationStatusDto;
  conditions: Record<string, boolean>;
  details: Record<string, string>;
  tracksFlareCheckIns: boolean;
  additionalNotes: string;
  lastConfirmedAt: string;
  lastUpdated: string;
  reviewRequestedAt: string | null;
  needsMemberReview: boolean;
  lastUpdatedBy: {
    id: string;
    name: string;
    isMember: boolean;
  } | null;
};

export type AdminNewsletterSubscriptionDto = {
  status: "never_subscribed" | "pending" | "subscribed" | "unsubscribed";
  source: string | null;
  consentedAt: string | null;
  subscribedAt: string | null;
  verifiedAt: string | null;
  unsubscribedAt: string | null;
  updatedAt: string | null;
};

export type AdminLegalAcceptanceHistoryDto = {
  id: string;
  type: string;
  label: string;
  version: string;
  acceptedAt: string;
  surface: string;
  actorName: string;
};

export type AdminLegalAgreementDto = {
  type: string;
  label: string;
  href: string | null;
  status: "current" | "missing" | "superseded" | "expired" | "not_applicable";
  currentVersion: string;
  acceptedVersion: string | null;
  acceptedAt: string | null;
  expiresAt: string | null;
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
  newsletterSubscription: AdminNewsletterSubscriptionDto;
  legalAgreements: AdminLegalAgreementDto[];
  legalAcceptanceHistory: AdminLegalAcceptanceHistoryDto[];
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
