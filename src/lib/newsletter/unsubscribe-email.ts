import { ServerClient } from "postmark";
import { getPostmarkToken } from "@/lib/env";
import { getPostmarkFromEmail, getPostmarkMessageStream } from "@/lib/postmark/client";

export async function sendMarketingUnsubscribeRequestEmail(input: {
  email: string;
  unsubscribeUrl: string;
}) {
  const postmarkToken = getPostmarkToken();
  const fromEmail = getPostmarkFromEmail();

  if (!postmarkToken) {
    throw new Error("POSTMARK_NOT_CONFIGURED");
  }

  const client = new ServerClient(postmarkToken);

  const textBody = [
    "Hi,",
    "",
    "Use the secure link below to confirm that you want to unsubscribe from Shruti Turner marketing emails:",
    input.unsubscribeUrl,
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");

  const htmlBody = [
    "<p>Hi,</p>",
    "<p>Use the secure link below to confirm that you want to unsubscribe from Shruti Turner marketing emails:</p>",
    `<p><a href="${input.unsubscribeUrl}">Confirm unsubscribe</a></p>`,
    "<p>If you did not request this, you can ignore this email.</p>",
  ].join("");

  await client.sendEmail({
    From: fromEmail,
    To: input.email,
    Subject: "Confirm your unsubscribe request",
    HtmlBody: htmlBody,
    TextBody: textBody,
    MessageStream: getPostmarkMessageStream("transactional"),
    Tag: "newsletter-unsubscribe-request",
    Metadata: {
      emailCategory: "transactional",
    },
  });
}
