import { render } from "@react-email/render";
import WelcomeEmail from "../emails/welcome";
import ClassBookingEmail from "../emails/class-booking";
import ClassReminderEmail from "../emails/class-reminder";
import PurchaseConfirmationEmail from "../emails/purchase-confirmation";
import InstructorNotificationEmail from "../emails/instructor-notification";
import ClassCancellationEmail from "../emails/class-cancellation";
import NewsletterEmail from "../emails/newsletter";
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

/**
 * Helper to generate a simple ICS string for calendar invites.
 */
function generateICS(
  eventName: string,
  startTime: Date,
  durationMinutes: number,
  description: string
) {
  const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

  const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Shruti Turner Coaching//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${Date.now()}@shrutiturner.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startTime)}
DTEND:${formatDate(endTime)}
SUMMARY:${eventName}
DESCRIPTION:${description}
LOCATION:Online (Daily.co)
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
    // Format date & time using the user's saved preferences
    const formattedDate = formatDate(classDateObj, userPrefs);
    const formattedTime = formatTime(classDateObj, userPrefs);

    await render(
      ClassBookingEmail({
        firstName,
        className,
        classDate: formattedDate,
        classTime: formattedTime,
        classDuration: `${durationMinutes} minutes`,
        classLocation: "Online (Daily.co)",
        manageBookingUrl: "https://shrutiturner.com/dashboard/schedule",
      })
    );

    generateICS(
      className,
      classDateObj,
      durationMinutes,
      `Join link: https://shrutiturner.com/dashboard/class-join`
    );

    // In a real backend with Postmark:
    // await client.sendEmail({
    //   "From": SENDER_EMAIL,
    //   "To": email,
    //   "Subject": `Booking Confirmed: ${className}`,
    //   "HtmlBody": html,
    //   "Attachments": [{
    //     "Name": "invite.ics",
    //     "Content": Buffer.from(icsContent).toString('base64'),
    //     "ContentType": "text/calendar"
    //   }]
    // });

    console.log(
      `[Mock Email Service] Sending Booking Confirmation to ${email} with ICS attachment`
    );
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
  userPrefs: I18nPreferences = DEFAULT_PREFS
) {
  try {
    await render(
      ClassReminderEmail({
        firstName,
        className,
        classTime: formatTimeString(classTime, userPrefs),
        joinLink: joinLink || "https://shrutiturner.com/dashboard/schedule",
      })
    );
    console.log(`[Mock Email Service] Sending Class Reminder to ${email}`);
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

export async function sendInstructorNotification(
  instructorEmail: string,
  type: "first-signup" | "last-cancel",
  className: string,
  classDate: string,
  classTime: string,
  attendeeName: string,
  attendeeCount: number
) {
  try {
    // Instructor emails always use UK formatting
    await render(
      InstructorNotificationEmail({
        type,
        className,
        classDate: formatDate(classDate, ADMIN_PREFS),
        classTime: formatTimeString(classTime, ADMIN_PREFS),
        attendeeName,
        attendeeCount,
        rosterUrl: "https://shrutiturner.com/admin/dashboard",
      })
    );
    console.log(
      `[Mock Email Service] Sending Instructor Notification (${type}) to ${instructorEmail}`
    );
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
  userPrefs: I18nPreferences = DEFAULT_PREFS
) {
  try {
    await render(
      ClassCancellationEmail({
        firstName,
        className,
        classDate: formatDate(classDate, userPrefs),
        classTime: formatTimeString(classTime, userPrefs),
        cancellationReason: isInstructorInitiated
          ? "This class has been cancelled by your instructor."
          : "This class booking was cancelled.",
        alternativeClassUrl: "https://shrutiturner.com/schedule",
      })
    );

    // NOTE: To cancel a calendar event, you typically send an ICS with METHOD:CANCEL
    // The implementation would look similar to sendBookingConfirmation but with modified ICS headers.

    console.log(`[Mock Email Service] Sending Class Cancellation to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to send class cancellation", error);
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
