import AdminMemberMessageEmail from "@/emails/admin-member-message";
import { db } from "@/lib/db";
import { sendPostmarkReactEmail } from "@/lib/postmark/client";

function toDisplayName(params: {
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  email: string;
}) {
  return (
    [params.firstName, params.lastName].filter(Boolean).join(" ").trim() ||
    params.name ||
    params.email
  );
}

export async function sendAdminMemberMessage(params: {
  memberId: string;
  adminUserId: string;
  subject: string;
  body: string;
}) {
  const [member, adminUser] = await Promise.all([
    db.user.findUnique({
      where: { id: params.memberId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
      },
    }),
    db.user.findUnique({
      where: { id: params.adminUserId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
      },
    }),
  ]);

  if (!member) {
    throw new Error("MEMBER_NOT_FOUND");
  }
  if (!adminUser) {
    throw new Error("ADMIN_NOT_FOUND");
  }

  const adminName = toDisplayName(adminUser);
  const memberFirstName = member.firstName?.trim() || "there";
  const subject = params.subject.trim();
  const body = params.body.trim();

  await sendPostmarkReactEmail({
    to: member.email,
    subject,
    react: (
      <AdminMemberMessageEmail
        memberFirstName={memberFirstName}
        adminName={adminName}
        messageBody={body}
      />
    ),
    textBody: `Hi ${memberFirstName},\n\n${body}\n\nWarmly,\n${adminName}`,
    tag: "admin-member-message",
    replyTo: adminUser.email,
    metadata: {
      adminUserId: adminUser.id,
      memberId: member.id,
      source: "admin-member-detail",
    },
  });

  return { ok: true };
}
