import "server-only";

import { getNotificationInbox, sendPostmarkReactEmail } from "@/lib/postmark/client";

type RetreatOperationalEmail = Omit<Parameters<typeof sendPostmarkReactEmail>[0], "to">;

const DEFAULT_RETREAT_NOTIFICATION_EMAIL = "shruti@shrutiturner.co.uk";

export function sendRetreatOperationalEmail(input: RetreatOperationalEmail) {
  return sendPostmarkReactEmail({
    ...input,
    to: getNotificationInbox("RETREAT_NOTIFICATION_EMAIL", DEFAULT_RETREAT_NOTIFICATION_EMAIL),
  });
}
