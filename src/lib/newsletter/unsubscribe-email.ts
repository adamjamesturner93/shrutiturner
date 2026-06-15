import UnsubscribeRequestEmail from "@/emails/unsubscribe-request";
import { sendPostmarkReactEmail } from "@/lib/postmark/client";

export async function sendMarketingUnsubscribeRequestEmail(input: {
  email: string;
  unsubscribeUrl: string;
}) {
  const textBody = [
    "Hi,",
    "",
    "Use the secure link below to confirm that you want to unsubscribe from Shruti Turner marketing emails:",
    input.unsubscribeUrl,
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");

  await sendPostmarkReactEmail({
    to: input.email,
    subject: "Confirm your unsubscribe request",
    react: UnsubscribeRequestEmail({ unsubscribeUrl: input.unsubscribeUrl }),
    textBody,
    tag: "newsletter-unsubscribe-request",
    templateKey: "newsletter-unsubscribe-request",
    category: "transactional",
    metadata: {
      unsubscribeUrl: input.unsubscribeUrl,
    },
    retryable: false,
    maxAttempts: 1,
    dispatchMode: "immediate_required",
  });
}
