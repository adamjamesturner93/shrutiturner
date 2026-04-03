import { render } from "@react-email/render";
import WelcomeEmail from "../emails/welcome";
import ClassBookingEmail from "../emails/class-booking";
import ClassReminderEmail from "../emails/class-reminder";
import PurchaseConfirmationEmail from "../emails/purchase-confirmation";
import InstructorNotificationEmail from "../emails/instructor-notification";
import ClassCancellationEmail from "../emails/class-cancellation";
import ClassUnbookingEmail from "../emails/class-unbooking";
import SubscriptionNoticeEmail from "../emails/subscription-notice";
import NewsletterEmail from "../emails/newsletter";
import { sendPostmarkReactEmail } from "@/lib/postmark/client";
import { getClassOperationalSettings } from "@/lib/classes/settings-service";
import {
  type I18nPreferences,
  ADMIN_PREFS,
  DEFAULT_PREFS,
  formatDate,
  formatTime,
  formatTimeString,
} from "./date-i18n";

// NOTE: This client must be initialized in a server-side environment (e.g. Supabase Edge Function)
// Do not expose your API key in the frontend bundle.
const POSTMARK_API_KEY = process.env.POSTMARK_API_KEY || "POSTMARK_API_TEST";
void POSTMARK_API_KEY;
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function toMinutesLabel(minutes: number) {
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export function buildCalendarInvite(params: {
  eventName: string;
  startTime: Date;
  durationMinutes: number;
  description: string;
  method?: "REQUEST" | "CANCEL";
  location?: string;
}) {
  const { eventName, startTime, durationMinutes, description } = params;
  const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
  const method = params.method || "REQUEST";
  const location = params.location || "Online (Daily.co)";

  const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Shruti Turner Coaching//EN
CALSCALE:GREGORIAN
METHOD:${method}
BEGIN:VEVENT
UID:${Date.now()}@shrutiturner.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startTime)}
DTEND:${formatDate(endTime)}
SUMMARY:${eventName}
DESCRIPTION:${description}
LOCATION:${location}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`.trim();
}

export async function sendWelcomeEmail(email: string, firstName: string) {
  try {
    await render(WelcomeEmail({ firstName }));
    console.log(`[Mock Email Service] Sending Welcome Email to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to send welcome email", error);
    return { success: false, error };
  }
}

export async function sendBookingConfirmation(
  email: string,
  firstName: string,
  className: string,
  classDate: string,
  classTime: string,
  // In a real app, pass Date objects to generate accurate ICS
  classDateObj: Date = new Date(),
  durationMinutes: number = 60,
  /** User's saved i18n preferences — controls how date/time appear in the email */
  userPrefs: I18nPreferences = DEFAULT_PREFS
) {
  try {
    const settings = await getClassOperationalSettings();
    // Format date & time using the user's saved preferences
    const formattedDate = formatDate(classDateObj, userPrefs);
    const formattedTime = formatTime(classDateObj, userPrefs);

    const invite = buildCalendarInvite({
      eventName: className,
      startTime: classDateObj,
      durationMinutes,
      description: `Join link: ${APP_URL}/dashboard/schedule`,
      method: "REQUEST",
    });
    const react = ClassBookingEmail({
      firstName,
      className,
      classDate: formattedDate,
      classTime: formattedTime,
      classDuration: `${durationMinutes} minutes`,
      classLocation: "Online (Daily.co)",
      manageBookingUrl: `${APP_URL}/dashboard/schedule`,
      creditRefundWindowLabel: toMinutesLabel(settings.creditRefundWindowMinutes),
    });

    await sendPostmarkReactEmail({
      to: email,
      subject: `Booking confirmed: ${className}`,
      category: "transactional",
      react,
      textBody: `Hi ${firstName},\n\nYour booking is confirmed for ${className} on ${formattedDate} at ${formattedTime}.\n\nManage your booking: ${APP_URL}/dashboard/schedule`,
      tag: "class-booking-confirmation",
      metadata: {
        className,
        emailType: "class-booking-confirmation",
      },
      attachments: [
        {
          name: "invite.ics",
          content: Buffer.from(invite).toString("base64"),
          contentType: "text/calendar",
        },
      ],
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send booking confirmation", error);
    return { success: false, error };
  }
}

export async function sendClassReminder(
  email: string,
  firstName: string,
  className: string,
  classTime: string,
  joinLink: string,
  /** User's saved i18n preferences */
  userPrefs: I18nPreferences = DEFAULT_PREFS,
  options?: {
    preJoinWindowMinutes?: number;
  }
) {
  try {
    const preJoinWindowMinutes =
      options?.preJoinWindowMinutes ?? (await getClassOperationalSettings()).preJoinWindowMinutes;
    const formattedTime = formatTimeString(classTime, userPrefs);
    const react = ClassReminderEmail({
      firstName,
      className,
      classTime: formattedTime,
      joinLink: joinLink || `${APP_URL}/dashboard/schedule`,
      preJoinWindowLabel: toMinutesLabel(preJoinWindowMinutes),
    });

    await sendPostmarkReactEmail({
      to: email,
      subject: `Reminder: ${className} starts soon`,
      category: "transactional",
      react,
      textBody: `Hi ${firstName},\n\nThis is a reminder that ${className} begins at ${formattedTime}.\n\nJoin class: ${joinLink || `${APP_URL}/dashboard/schedule`}`,
      tag: "class-reminder",
      metadata: {
        className,
        emailType: "class-reminder",
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send class reminder", error);
    return { success: false, error };
  }
}

export async function sendPurchaseConfirmation(
  email: string,
  firstName: string,
  purchaseDescription: string,
  amount: string,
  invoiceId: string,
  /** User's saved i18n preferences */
  userPrefs: I18nPreferences = DEFAULT_PREFS
) {
  try {
    await render(
      PurchaseConfirmationEmail({
        firstName,
        purchaseDescription,
        amount,
        invoiceId,
        date: formatDate(new Date(), userPrefs),
        scheduleUrl: "https://shrutiturner.com/dashboard/schedule",
      })
    );
    console.log(`[Mock Email Service] Sending Purchase Confirmation to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to send purchase confirmation", error);
    return { success: false, error };
  }
}

export async function sendSubscriptionNoticeEmail(params: {
  email: string;
  firstName: string;
  subject: string;
  preview: string;
  title: string;
  paragraphs: string[];
  tag: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footnote?: string;
  metadata?: Record<string, string>;
}) {
  try {
    const react = SubscriptionNoticeEmail({
      preview: params.preview,
      title: params.title,
      firstName: params.firstName,
      paragraphs: params.paragraphs,
      ctaLabel: params.ctaLabel,
      ctaUrl: params.ctaUrl,
      footnote: params.footnote,
    });

    await sendPostmarkReactEmail({
      to: params.email,
      subject: params.subject,
      category: "transactional",
      react,
      textBody: [`Hi ${params.firstName},`, "", ...params.paragraphs]
        .concat(
          params.ctaLabel && params.ctaUrl ? ["", `${params.ctaLabel}: ${params.ctaUrl}`] : [],
          params.footnote ? ["", params.footnote] : []
        )
        .join("\n"),
      tag: params.tag,
      metadata: {
        emailType: params.tag,
        ...(params.metadata || {}),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send subscription notice email", error);
    return { success: false, error };
  }
}

export async function sendInstructorNotification(
  instructorEmail: string,
  type: "first-signup" | "last-cancel" | "no-attendance-cancelled",
  className: string,
  classDate: string,
  classTime: string,
  attendeeName: string,
  attendeeCount: number,
  startsAt?: Date,
  durationMinutes = 60
) {
  try {
    const settings = await getClassOperationalSettings();
    const formattedDate = startsAt
      ? formatDate(startsAt, ADMIN_PREFS)
      : formatDate(classDate, ADMIN_PREFS);
    const formattedTime = startsAt
      ? formatTime(startsAt, ADMIN_PREFS)
      : classTime.includes("T")
        ? formatTime(new Date(classTime), ADMIN_PREFS)
        : formatTimeString(classTime, ADMIN_PREFS);

    const invite =
      type === "first-signup" && startsAt
        ? buildCalendarInvite({
            eventName: className,
            startTime: startsAt,
            durationMinutes,
            description: `View the roster in admin: ${APP_URL}/admin/classes`,
            method: "REQUEST",
          })
        : null;
    const react = InstructorNotificationEmail({
      type,
      className,
      classDate: formattedDate,
      classTime: formattedTime,
      attendeeName,
      attendeeCount,
      rosterUrl: `${APP_URL}/admin/classes`,
      emptyClassCutoffLabel: toMinutesLabel(settings.emptyClassAutoCancelWindowMinutes),
    });

    await sendPostmarkReactEmail({
      to: instructorEmail,
      subject:
        type === "first-signup"
          ? `New booking: ${className}`
          : type === "no-attendance-cancelled"
            ? `Class cancelled: ${className}`
            : `Class empty: ${className}`,
      category: "transactional",
      react,
      textBody: `${className}\nDate: ${formattedDate}\nTime: ${formattedTime}\nAttendees: ${attendeeCount}\nRoster: ${APP_URL}/admin/classes`,
      tag: `instructor-${type}`,
      metadata: {
        className,
        emailType: `instructor-${type}`,
      },
      attachments:
        invite && type === "first-signup"
          ? [
              {
                name: "class-invite.ics",
                content: Buffer.from(invite).toString("base64"),
                contentType: "text/calendar",
              },
            ]
          : undefined,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send instructor notification", error);
    return { success: false, error };
  }
}

export async function sendClassCancellation(
  email: string,
  firstName: string,
  className: string,
  classDate: string,
  classTime: string,
  isInstructorInitiated: boolean,
  /** User's saved i18n preferences */
  userPrefs: I18nPreferences = DEFAULT_PREFS,
  startsAt: Date = new Date(classDate),
  durationMinutes = 60
) {
  try {
    const invite = buildCalendarInvite({
      eventName: className,
      startTime: startsAt,
      durationMinutes,
      description: "This calendar event has been cancelled.",
      method: "CANCEL",
    });
    const formattedDate = formatDate(startsAt, userPrefs);
    const formattedTime = formatTime(startsAt, userPrefs);
    const react = ClassCancellationEmail({
      firstName,
      className,
      classDate: formattedDate,
      classTime: formattedTime,
      cancellationReason: isInstructorInitiated
        ? "This class has been cancelled by your instructor."
        : "This class booking was cancelled.",
      alternativeClassUrl: `${APP_URL}/schedule`,
    });

    await sendPostmarkReactEmail({
      to: email,
      subject: `Class cancelled: ${className}`,
      category: "transactional",
      react,
      textBody: `Hi ${firstName},\n\n${className} on ${formattedDate} at ${formattedTime} has been cancelled.\n\nView available classes: ${APP_URL}/schedule`,
      tag: "class-cancellation",
      metadata: {
        className,
        emailType: "class-cancellation",
      },
      attachments: [
        {
          name: "class-cancel.ics",
          content: Buffer.from(invite).toString("base64"),
          contentType: "text/calendar",
        },
      ],
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send class cancellation", error);
    return { success: false, error };
  }
}

export async function sendClassUnbooking(
  email: string,
  firstName: string,
  className: string,
  classDate: string,
  classTime: string,
  classDateObj: Date = new Date(),
  durationMinutes = 60,
  userPrefs: I18nPreferences = DEFAULT_PREFS
) {
  try {
    const formattedDate = formatDate(classDateObj, userPrefs);
    const formattedTime = formatTime(classDateObj, userPrefs);
    const invite = buildCalendarInvite({
      eventName: className,
      startTime: classDateObj,
      durationMinutes,
      description: "This calendar booking has been cancelled.",
      method: "CANCEL",
    });
    const react = ClassUnbookingEmail({
      firstName,
      className,
      classDate: formattedDate,
      classTime: formattedTime || formatTimeString(classTime, userPrefs),
      rebookUrl: `${APP_URL}/dashboard/schedule`,
    });

    await sendPostmarkReactEmail({
      to: email,
      subject: `Booking cancelled: ${className}`,
      category: "transactional",
      react,
      textBody: `Hi ${firstName},\n\nYour booking for ${className} on ${formattedDate} at ${formattedTime} has been cancelled.\n\nBrowse upcoming classes: ${APP_URL}/dashboard/schedule`,
      tag: "class-unbooking",
      metadata: {
        className,
        emailType: "class-unbooking",
        classDate,
      },
      attachments: [
        {
          name: "class-unbook.ics",
          content: Buffer.from(invite).toString("base64"),
          contentType: "text/calendar",
        },
      ],
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send class unbooking confirmation", error);
    return { success: false, error };
  }
}

export async function sendNewsletter(
  email: string,
  subject: string,
  markdownContent: string // Content from Contentful
) {
  try {
    const bodyContent = markdownContent
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `<p>${line}</p>`)
      .join("");
    await render(
      NewsletterEmail({
        firstName: "there",
        subject,
        bodyContent,
      })
    );
    console.log(`[Mock Email Service] Sending Newsletter to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to send newsletter", error);
    return { success: false, error };
  }
}

/**
 * Trigger Points for Emails:
 * ... (previous documentation)
 *
 * 5. Purchase Confirmation:
 *    - Trigger: Stripe webhook 'payment_intent.succeeded' or 'invoice.payment_succeeded'.
 *
 * 6. Instructor Notification:
 *    - Trigger: Database trigger on 'bookings' table (insert/delete).
 *      - If count goes 0 -> 1: Send 'first-signup'
 *      - If count goes 1 -> 0: Send 'last-cancel'
 *
 * 7. Class Cancellation:
 *    - Trigger: Admin dashboard 'Cancel Class' action OR user 'Cancel Booking' action.
 *
 * 8. Newsletter:
 *    - Trigger: Contentful webhook 'Publish' -> Supabase Function -> Fetch subscribers -> Send batch.
 */
