// Shruti Turner Email Templates - Index
// All templates built with react-email for Postmark delivery.
// Content fields are designed to receive Markdown from Contentful.

export { default as NewsletterEmail } from "./newsletter";
export { default as BlogPostEmail } from "./blog-post";
export { default as WelcomeEmail } from "./welcome";
export { default as AuthCodeEmail } from "./auth-code";
export { default as ClassBookingEmail } from "./class-booking";
export { default as ClassReminderEmail } from "./class-reminder";
export { default as ClassUnbookingEmail } from "./class-unbooking";
export { default as ClassCancellationEmail } from "./class-cancellation";
export { default as PurchaseConfirmationEmail } from "./purchase-confirmation";
export { default as InstructorNotificationEmail } from "./instructor-notification";
export { default as RetreatBookingEmail } from "./retreat-booking";
export { default as RetreatRemainderEmail } from "./retreat-remainder";
export { default as CreditsExpiringEmail } from "./credits-expiring";
export { default as OnboardingEmail } from "./onboarding";
export { default as ReferralRewardEmail } from "./referral-reward";
export { default as BirthdayEmail } from "./birthday";
export { default as WinBackEmail } from "./win-back";

/*
 * POSTMARK TEMPLATE VARIABLES
 * ===========================
 * These templates use the following Postmark template model variables:
 *
 * NEWSLETTER / BLOG POST:
 *   {{ firstName }}          - Recipient first name
 *   {{ postTitle }}          - Blog post / newsletter title (from Contentful)
 *   {{ postExcerpt }}        - Short excerpt (from Contentful Markdown)
 *   {{ postImageUrl }}       - Featured image URL (from Contentful)
 *   {{ postUrl }}            - Link to the full post
 *   {{ publishDate }}        - Formatted publish date
 *
 * WELCOME + LEAD MAGNET:
 *   {{ firstName }}          - Recipient first name
 *   {{ leadMagnetTitle }}    - Title of the free resource (from Contentful)
 *   {{ leadMagnetDescription }} - Description (from Contentful Markdown)
 *   {{ downloadUrl }}        - Signed download URL
 *
 * AUTH CODE:
 *   {{ code }}               - 6-digit login code
 *   {{ expiryMinutes }}      - Code expiry in minutes
 *
 * CLASS BOOKING:
 *   {{ firstName }}          - Recipient first name
 *   {{ className }}          - Name of the class
 *   {{ classDate }}          - Date of the class
 *   {{ classTime }}          - Time of the class
 *   {{ classDuration }}      - Duration of the class
 *   {{ classLocation }}      - Location / "Online via Zoom"
 *   {{ instructorNote }}     - Optional note (from Contentful Markdown)
 *   {{ manageBookingUrl }}   - Link to manage bookings
 *
 * CLASS UNBOOKING:
 *   {{ firstName }}          - Recipient first name
 *   {{ className }}          - Name of the class
 *   {{ classDate }}          - Date of the cancelled booking
 *   {{ classTime }}          - Time of the cancelled booking
 *   {{ rebookUrl }}          - Link to browse classes
 *
 * CLASS CANCELLATION (BY TEACHER):
 *   {{ firstName }}          - Recipient first name
 *   {{ className }}          - Name of the cancelled class
 *   {{ classDate }}          - Date of the cancelled class
 *   {{ classTime }}          - Time of the cancelled class
 *   {{ cancellationReason }} - Reason for cancellation (from Contentful Markdown)
 *   {{ alternativeClassUrl }} - Link to browse alternative classes
 *
 * RETREAT BOOKING + DEPOSIT:
 *   {{ firstName }}          - Recipient first name
 *   {{ retreatName }}        - Name of the retreat (from Contentful)
 *   {{ retreatDates }}       - Retreat dates
 *   {{ retreatLocation }}    - Retreat venue / location
 *   {{ depositAmount }}      - Amount of deposit paid
 *   {{ totalPrice }}         - Total retreat price
 *   {{ remainderAmount }}    - Remaining balance
 *   {{ remainderDueDate }}   - Date remainder is due
 *   {{ retreatDetailsUrl }}  - Link to retreat page
 *   {{ transactionRef }}     - Payment reference
 *
 * RETREAT REMAINDER REMINDER:
 *   {{ firstName }}          - Recipient first name
 *   {{ retreatName }}        - Name of the retreat (from Contentful)
 *   {{ retreatDates }}       - Retreat dates
 *   {{ remainderAmount }}    - Amount due
 *   {{ dueDate }}            - Payment due date
 *   {{ bankName }}           - Bank name
 *   {{ accountName }}        - Account holder name
 *   {{ sortCode }}           - Sort code
 *   {{ accountNumber }}      - Account number
 *   {{ paymentReference }}   - Payment reference to use
 *   {{ retreatDetailsUrl }}  - Link to retreat page
 *
 * CREDITS EXPIRING:
 *   {{ firstName }}          - Recipient first name
 *   {{ creditCount }}        - Number of credits remaining
 *   {{ expiryDate }}         - Date credits expire
 *   {{ scheduleUrl }}        - Link to class schedule
 *
 * ONBOARDING (DAY 3):
 *   {{ firstName }}          - Recipient first name
 *   {{ membershipUrl }}      - Link to membership / pricing page
 *   {{ scheduleUrl }}        - Link to class schedule
 *   {{ freeTrialDays }}      - Number of free trial days
 *
 * REFERRAL REWARD:
 *   {{ firstName }}          - Recipient first name
 *   {{ referredName }}       - Name of the person who signed up
 *   {{ creditAmount }}       - Credit amount earned (e.g. "\u00a310")
 *   {{ totalCredits }}       - Total credit balance
 *   {{ scheduleUrl }}        - Link to class schedule
 *   {{ referralUrl }}        - User's unique referral link
 *
 * BIRTHDAY:
 *   {{ firstName }}          - Recipient first name
 *   {{ creditCode }}         - Discount / credit code
 *   {{ creditAmount }}       - Credit value (e.g. "\u00a35")
 *   {{ scheduleUrl }}        - Link to class schedule
 *
 * WIN-BACK / RE-ENGAGEMENT:
 *   {{ firstName }}          - Recipient first name
 *   {{ daysSinceLastClass }} - Number of days since last booking
 *   {{ lastClassName }}      - Name of last attended class
 *   {{ scheduleUrl }}        - Link to class schedule
 *   {{ blogUrl }}            - Link to blog
 *
 * SHARED FOOTER VARIABLES:
 *   {{ website_url }}        - Main website URL
 *   {{ instagram_url }}      - Instagram profile URL
 *   {{ contact_url }}        - Contact page URL
 *   {{ unsubscribe_url }}    - Unsubscribe link
 */
