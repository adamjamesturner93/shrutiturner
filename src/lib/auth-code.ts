import { render } from "@react-email/render";
import { ServerClient } from "postmark";
import AuthCodeEmail from "@/emails/auth-code";
import { env } from "@/lib/env";
import { getPostmarkMessageStream } from "@/lib/postmark/client";

export async function sendAuthCodeEmail(email: string, code: string, expiryMinutes = 10) {
  if (env.NEXT_PUBLIC_E2E_TEST_MODE === "1") {
    return;
  }

  const postmarkToken = env.POSTMARK_API_TOKEN;
  if (!postmarkToken) {
    throw new Error("POSTMARK_API_TOKEN is not configured.");
  }

  const from = env.POSTMARK_FROM_EMAIL || "Shruti Turner <noreply@thechronicyogini.com>";
  const client = new ServerClient(postmarkToken);

  const html = await render(AuthCodeEmail({ code, expiryMinutes }));
  const text = `Your login code is ${code}. It expires in ${expiryMinutes} minutes.`;

  await client.sendEmail({
    From: from,
    To: email,
    Subject: "Your login code",
    HtmlBody: html,
    TextBody: text,
    MessageStream: getPostmarkMessageStream("transactional"),
    Tag: "auth-code",
    Metadata: {
      emailCategory: "transactional",
    },
  });
}
