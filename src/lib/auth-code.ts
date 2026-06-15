import AuthCodeEmail from "@/emails/auth-code";
import { env } from "@/lib/env";
import { sendPostmarkReactEmail } from "@/lib/postmark/client";

export async function sendAuthCodeEmail(email: string, code: string, expiryMinutes = 10) {
  if (env.NEXT_PUBLIC_E2E_TEST_MODE === "1") {
    return;
  }
  const text = `Your login code is ${code}. It expires in ${expiryMinutes} minutes.`;

  await sendPostmarkReactEmail({
    to: email,
    subject: "Your login code",
    react: AuthCodeEmail({ code, expiryMinutes }),
    textBody: text,
    tag: "auth-code",
    templateKey: "auth-code",
    category: "transactional",
    retryable: false,
    maxAttempts: 1,
    dispatchMode: "immediate_required",
  });
}
