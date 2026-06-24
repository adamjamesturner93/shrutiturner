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
export { default as OnboardingEmail } from "./onboarding";

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
 * ONBOARDING:
 *   {{ firstName }}          - Recipient first name
 *   {{ dashboardUrl }}       - Link to user dashboard
 *   {{ healthUrl }}          - Link to health profile
 *
 * SHARED FOOTER VARIABLES:
 *   {{ website_url }}        - Main website URL
 *   {{ instagram_url }}      - Instagram profile URL
 *   {{ contact_url }}        - Contact page URL
 *   {{ unsubscribe_url }}    - Unsubscribe link
 */
