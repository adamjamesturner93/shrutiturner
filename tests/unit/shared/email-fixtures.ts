import { createElement } from "react";
import AdminMemberMessageEmail from "@/emails/admin-member-message";
import AuthCodeEmail from "@/emails/auth-code";
import BirthdayEmail from "@/emails/birthday";
import BlogCommentNotificationEmail from "@/emails/blog-comment-notification";
import BlogPostEmail from "@/emails/blog-post";
import ClassBookingEmail from "@/emails/class-booking";
import ClassCancellationEmail from "@/emails/class-cancellation";
import ClassReminderEmail from "@/emails/class-reminder";
import ClassUnbookingEmail from "@/emails/class-unbooking";
import ClassWaitlistEmail from "@/emails/class-waitlist";
import CoachingApplicationApprovedEmail from "@/emails/coaching-application-approved";
import CoachingApplicationConfirmationEmail from "@/emails/coaching-application-confirmation";
import CoachingApplicationNotificationEmail from "@/emails/coaching-application-notification";
import CoachingApplicationRejectedEmail from "@/emails/coaching-application-rejected";
import CoachingApplicationWaitlistedEmail from "@/emails/coaching-application-waitlisted";
import CoachingCancellationClientEmail from "@/emails/coaching-cancellation-client";
import CoachingCancellationNotificationEmail from "@/emails/coaching-cancellation-notification";
import CoachingClientConfirmedEmail from "@/emails/coaching-client-confirmed";
import CoachingPackageChangeRequestedEmail from "@/emails/coaching-package-change-requested";
import CoachingPaidStartRequestedEmail from "@/emails/coaching-paid-start-requested";
import CoachingPaymentConfirmationEmail from "@/emails/coaching-payment-confirmation";
import CoachingPaymentNotificationEmail from "@/emails/coaching-payment-notification";
import CoachingPaymentReminderEmail from "@/emails/coaching-payment-reminder";
import CoachingWaitlistLeftNotificationEmail from "@/emails/coaching-waitlist-left-notification";
import ContactConfirmationEmail from "@/emails/contact-confirmation";
import ContactNotificationEmail from "@/emails/contact-notification";
import CreditsExpiringEmail from "@/emails/credits-expiring";
import GiftRedemptionEmail from "@/emails/gift-redemption";
import HealthProfileReviewRequestedEmail from "@/emails/health-profile-review-requested";
import HealthProfileUpdatedNotificationEmail from "@/emails/health-profile-updated-notification";
import InstructorNotificationEmail from "@/emails/instructor-notification";
import NewsletterVerificationEmail from "@/emails/newsletter-verification";
import NewsletterEmail from "@/emails/newsletter";
import OnboardingEmail from "@/emails/onboarding";
import ProgrammeUpdateEmail from "@/emails/programme-update";
import PurchaseConfirmationEmail from "@/emails/purchase-confirmation";
import ReferralRewardEmail from "@/emails/referral-reward";
import RetreatBalanceDueEmail from "@/emails/retreat-balance-due";
import RetreatBookingAdminEmail from "@/emails/retreat-booking-admin";
import RetreatBookingEmail from "@/emails/retreat-booking";
import RetreatCancellationEmail, {
  RetreatCancellationAdminEmail,
} from "@/emails/retreat-cancellation";
import RetreatGiftRefundEmail from "@/emails/retreat-gift-refund";
import RetreatLiveReminderEmail from "@/emails/retreat-live-reminder";
import RetreatPaymentReceiptEmail from "@/emails/retreat-payment-receipt";
import RetreatRegistrationEmail from "@/emails/retreat-registration";
import RetreatRemainderEmail from "@/emails/retreat-remainder";
import SecurityAlertEmail from "@/emails/security-alert";
import SubscriptionNoticeEmail from "@/emails/subscription-notice";
import UnsubscribeRequestEmail from "@/emails/unsubscribe-request";
import WelcomeEmail from "@/emails/welcome";
import WinBackEmail from "@/emails/win-back";
import WorkshopCancelledEmail from "@/emails/workshop-cancelled";

export const emailFixtures = [
  {
    name: "admin-member-message",
    element: createElement(AdminMemberMessageEmail, {
      memberFirstName: "Taylor",
      adminName: "Shruti",
      messageBody: "Thanks for your message.\n\nSee you soon.",
    }),
  },
  { name: "auth-code", element: createElement(AuthCodeEmail, {}) },
  { name: "birthday", element: createElement(BirthdayEmail, {}) },
  {
    name: "blog-comment-notification",
    element: createElement(BlogCommentNotificationEmail, {
      authorName: "Your update",
      postSlug: "Your update",
      content: "Your update",
      postUrl: "https://shrutiturner.co.uk/dashboard",
    }),
  },
  { name: "blog-post", element: createElement(BlogPostEmail, {}) },
  { name: "class-booking", element: createElement(ClassBookingEmail, {}) },
  { name: "class-cancellation", element: createElement(ClassCancellationEmail, {}) },
  { name: "class-reminder", element: createElement(ClassReminderEmail, {}) },
  { name: "class-unbooking", element: createElement(ClassUnbookingEmail, {}) },
  { name: "class-waitlist", element: createElement(ClassWaitlistEmail, {}) },
  {
    name: "coaching-application-approved",
    element: createElement(CoachingApplicationApprovedEmail, {
      firstName: "Taylor",
      tierLabel: "Your update",
      dashboardUrl: "https://shrutiturner.co.uk/dashboard",
    }),
  },
  {
    name: "coaching-application-confirmation",
    element: createElement(CoachingApplicationConfirmationEmail, { firstName: "Taylor" }),
  },
  {
    name: "coaching-application-notification",
    element: createElement(CoachingApplicationNotificationEmail, {
      name: "Taylor Morgan",
      email: "taylor@example.test",
      summary: ["Review this update in My Studio."],
      adminUrl: "https://shrutiturner.co.uk/dashboard",
    }),
  },
  {
    name: "coaching-application-rejected",
    element: createElement(CoachingApplicationRejectedEmail, {
      firstName: "Taylor",
      tierLabel: "Your update",
      decisionReason: "Your update",
      dashboardUrl: "https://shrutiturner.co.uk/dashboard",
    }),
  },
  {
    name: "coaching-application-waitlisted",
    element: createElement(CoachingApplicationWaitlistedEmail, {
      firstName: "Taylor",
      tierLabel: "Your update",
      dashboardUrl: "https://shrutiturner.co.uk/dashboard",
    }),
  },
  {
    name: "coaching-cancellation-client",
    element: createElement(CoachingCancellationClientEmail, {
      firstName: "Taylor",
      endsAt: "Your update",
      dashboardUrl: "https://shrutiturner.co.uk/dashboard",
    }),
  },
  {
    name: "coaching-cancellation-notification",
    element: createElement(CoachingCancellationNotificationEmail, {
      clientName: "Your update",
      clientEmail: "taylor@example.test",
      nextPaymentAt: "Your update",
      endsAt: "Your update",
      adminUrl: "https://shrutiturner.co.uk/dashboard",
    }),
  },
  {
    name: "coaching-client-confirmed",
    element: createElement(CoachingClientConfirmedEmail, {
      firstName: "Taylor",
      tierLabel: "Your update",
      dashboardUrl: "https://shrutiturner.co.uk/dashboard",
    }),
  },
  {
    name: "coaching-package-change-requested",
    element: createElement(CoachingPackageChangeRequestedEmail, {
      firstName: "Taylor",
      fromLabel: "Your update",
      toLabel: "Your update",
      effectiveMode: "next_invoice",
      dashboardUrl: "https://shrutiturner.co.uk/dashboard",
    }),
  },
  {
    name: "coaching-paid-start-requested",
    element: createElement(CoachingPaidStartRequestedEmail, {
      firstName: "Taylor",
      offerLabel: "Your update",
      billingStartsOn: "Your update",
      dashboardUrl: "https://shrutiturner.co.uk/dashboard",
    }),
  },
  {
    name: "coaching-payment-confirmation",
    element: createElement(CoachingPaymentConfirmationEmail, {
      firstName: "Taylor",
      tierLabel: "Your update",
      amountLabel: "£105.00",
      dashboardUrl: "https://shrutiturner.co.uk/dashboard",
    }),
  },
  {
    name: "coaching-payment-notification",
    element: createElement(CoachingPaymentNotificationEmail, {
      clientName: "Your update",
      clientEmail: "taylor@example.test",
      tierLabel: "Your update",
      adminUrl: "https://shrutiturner.co.uk/dashboard",
    }),
  },
  {
    name: "coaching-payment-reminder",
    element: createElement(CoachingPaymentReminderEmail, {
      firstName: "Taylor",
      tierLabel: "Your update",
      dashboardUrl: "https://shrutiturner.co.uk/dashboard",
    }),
  },
  {
    name: "coaching-waitlist-left-notification",
    element: createElement(CoachingWaitlistLeftNotificationEmail, {
      clientName: "Your update",
      clientEmail: "taylor@example.test",
      tierLabel: "Your update",
      adminUrl: "https://shrutiturner.co.uk/dashboard",
    }),
  },
  {
    name: "contact-confirmation",
    element: createElement(ContactConfirmationEmail, { firstName: "Taylor", topic: "Your update" }),
  },
  {
    name: "contact-notification",
    element: createElement(ContactNotificationEmail, {
      name: "Taylor Morgan",
      email: "taylor@example.test",
      topic: "Your update",
      message: "Your programme begins soon. Review your setup in My Studio.",
    }),
  },
  { name: "credits-expiring", element: createElement(CreditsExpiringEmail, {}) },
  {
    name: "gift-redemption",
    element: createElement(GiftRedemptionEmail, {
      recipientName: "Your update",
      purchaserName: "Your update",
      productTitle: "Your update",
      redemptionUrl: "https://shrutiturner.co.uk/dashboard",
    }),
  },
  {
    name: "health-profile-review-requested",
    element: createElement(HealthProfileReviewRequestedEmail, {
      firstName: "Taylor",
      healthProfileUrl: "https://shrutiturner.co.uk/dashboard",
    }),
  },
  {
    name: "health-profile-updated-notification",
    element: createElement(HealthProfileUpdatedNotificationEmail, {
      memberName: "Your update",
      memberEmail: "taylor@example.test",
      memberUrl: "https://shrutiturner.co.uk/dashboard",
    }),
  },
  { name: "instructor-notification", element: createElement(InstructorNotificationEmail, {}) },
  {
    name: "newsletter-verification",
    element: createElement(NewsletterVerificationEmail, {
      privacyUrl: "https://shrutiturner.co.uk/dashboard",
      unsubscribeUrl: "https://shrutiturner.co.uk/dashboard",
      verificationUrl: "https://shrutiturner.co.uk/dashboard",
    }),
  },
  { name: "newsletter", element: createElement(NewsletterEmail, {}) },
  { name: "onboarding", element: createElement(OnboardingEmail, {}) },
  {
    name: "programme-update",
    element: createElement(ProgrammeUpdateEmail, {
      programmeTitle: "Rebuilding Your Strength — Jan ’27",
      message: "Your programme begins soon. Review your setup in My Studio.",
      actionUrl: "https://shrutiturner.co.uk/dashboard",
      actionLabel: "View programme",
    }),
  },
  { name: "purchase-confirmation", element: createElement(PurchaseConfirmationEmail, {}) },
  { name: "referral-reward", element: createElement(ReferralRewardEmail, {}) },
  {
    name: "retreat-balance-due",
    element: createElement(RetreatBalanceDueEmail, {
      firstName: "Taylor",
      retreatName: "Pause, Move, Breathe",
      retreatDates: "18–20 September 2026",
      balanceAmount: "£105.00",
      dueDate: "Your update",
      paymentUrl: "https://shrutiturner.co.uk/dashboard",
    }),
  },
  {
    name: "retreat-booking-admin",
    element: createElement(RetreatBookingAdminEmail, {
      purchaserName: "Your update",
      purchaserEmail: "taylor@example.test",
      retreatName: "Pause, Move, Breathe",
      retreatDates: "18–20 September 2026",
      selection: "Your update",
      guestCount: 2,
      paymentSummary: "Your update",
      adminUrl: "https://shrutiturner.co.uk/dashboard",
    }),
  },
  { name: "retreat-booking", element: createElement(RetreatBookingEmail, {}) },
  {
    name: "retreat-cancellation",
    element: createElement(RetreatCancellationEmail, {
      firstName: "Taylor",
      retreatName: "Pause, Move, Breathe",
      retreatDates: "18–20 September 2026",
      status: "requested",
      refundableAmount: "£105.00",
      dashboardUrl: "https://shrutiturner.co.uk/dashboard",
    }),
  },
  {
    name: "retreat-gift-refund",
    element: createElement(RetreatGiftRefundEmail, {
      firstName: "Taylor",
      retreatName: "Pause, Move, Breathe",
      refundAmount: "£105.00",
    }),
  },
  {
    name: "retreat-live-reminder",
    element: createElement(RetreatLiveReminderEmail, {
      firstName: "Taylor",
      retreatName: "Pause, Move, Breathe",
      dateTime: "Sunday 4 October at 9:30am UK time",
      reminderLabel: "tomorrow",
      joinUrl: "https://shrutiturner.co.uk/dashboard",
      calendarUrl: "https://shrutiturner.co.uk/dashboard",
    }),
  },
  {
    name: "retreat-payment-receipt",
    element: createElement(RetreatPaymentReceiptEmail, {
      firstName: "Taylor",
      retreatName: "Pause, Move, Breathe",
      retreatDates: "18–20 September 2026",
      amountPaid: "£105.00",
      totalPaid: "£105.00",
      retreatDetailsUrl: "https://shrutiturner.co.uk/dashboard",
    }),
  },
  {
    name: "retreat-registration",
    element: createElement(RetreatRegistrationEmail, {
      name: "Taylor Morgan",
      title: "Your booking update",
      url: "https://shrutiturner.co.uk/dashboard",
    }),
  },
  { name: "retreat-remainder", element: createElement(RetreatRemainderEmail, {}) },
  {
    name: "security-alert",
    element: createElement(SecurityAlertEmail, {
      title: "Your booking update",
      summary: "Your update",
      reason: "Your update",
      occurredAt: "Your update",
    }),
  },
  {
    name: "subscription-notice",
    element: createElement(SubscriptionNoticeEmail, {
      preview: "Your update",
      title: "Your booking update",
      paragraphs: ["Review this update in My Studio."],
    }),
  },
  {
    name: "unsubscribe-request",
    element: createElement(UnsubscribeRequestEmail, {
      unsubscribeUrl: "https://shrutiturner.co.uk/dashboard",
    }),
  },
  { name: "welcome", element: createElement(WelcomeEmail, {}) },
  { name: "win-back", element: createElement(WinBackEmail, {}) },
  {
    name: "workshop-cancelled",
    element: createElement(WorkshopCancelledEmail, {
      firstName: "Taylor",
      workshopName: "The Middle Ground",
      purchaser: true,
      supportUrl: "https://shrutiturner.co.uk/dashboard",
    }),
  },
];

export const emailVariants = [
  {
    name: "programme-update-setup",
    element: createElement(ProgrammeUpdateEmail, {
      programmeTitle: "Rebuilding Your Strength",
      message: "Your programme is ready.",
      actionUrl: "https://shrutiturner.co.uk/dashboard/programmes/example",
      actionLabel: "View programme",
      calendarUrl: "https://shrutiturner.co.uk/api/me/programmes/example/calendar",
      onboardingUrl: "https://shrutiturner.co.uk/dashboard/programmes/example/onboarding",
    }),
  },
  {
    name: "retreat-cancellation-admin",
    element: createElement(RetreatCancellationAdminEmail, {
      customerName: "Taylor Morgan",
      customerEmail: "taylor@example.test",
      retreatName: "Pause, Move, Breathe",
      retreatDates: "18–20 September 2026",
      refundableAmount: "£105.00",
      adminUrl: "https://shrutiturner.co.uk/admin/retreats",
    }),
  },
  ...(["approved", "rejected"] as const).map((status) => ({
    name: `retreat-cancellation-${status}`,
    element: createElement(RetreatCancellationEmail, {
      firstName: "Taylor",
      retreatName: "Pause, Move, Breathe",
      retreatDates: "18–20 September 2026",
      status,
      refundableAmount: "£105.00",
      dashboardUrl: "https://shrutiturner.co.uk/dashboard/events",
      decisionReason: "Your request has been reviewed.",
    }),
  })),
  {
    name: "retreat-booking-paid-in-full",
    element: createElement(RetreatBookingEmail, { firstName: "Taylor", paidInFull: true }),
  },
  {
    name: "workshop-cancelled-attendee",
    element: createElement(WorkshopCancelledEmail, {
      firstName: "Taylor",
      workshopName: "The Middle Ground",
      purchaser: false,
      supportUrl: "https://shrutiturner.co.uk/contact",
    }),
  },
  {
    name: "class-waitlist-promoted",
    element: createElement(ClassWaitlistEmail, { variant: "promoted" }),
  },
  ...(["last-cancel", "no-attendance-cancelled"] as const).map((type) => ({
    name: `instructor-${type}`,
    element: createElement(InstructorNotificationEmail, { type }),
  })),
  {
    name: "gift-redemption-purchaser",
    element: createElement(GiftRedemptionEmail, {
      recipientName: "Taylor",
      purchaserName: "Alex",
      productTitle: "The Middle Ground",
      redemptionUrl: "https://shrutiturner.co.uk/gift/redeem/example",
      sendToBuyer: true,
    }),
  },
  {
    name: "newsletter-content",
    element: createElement(NewsletterEmail, {
      firstName: "Taylor",
      subject: "A note from Shruti",
      bodyContent:
        "## Start where you are\n\nSome **practical ideas** for the week ahead.\n\n- Choose an option\n- Take your time",
    }),
  },
];
