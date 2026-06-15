import { PrismaAdapter } from "@auth/prisma-adapter";
import { AuthChallengePurpose, type UserRole } from "@prisma/client";
import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { redirect } from "next/navigation";
import { verifyAuthChallenge } from "@/lib/auth-challenge";
import { recordFailedLoginAttempt } from "@/lib/auth-security";
import { db } from "@/lib/db";
import { env, getAdminEmailAllowlist } from "@/lib/env";
import { isOwnerAdminRole, isStaffAdminRole } from "@/lib/authz/roles";
import { recordUserLifecycleEvent } from "@/lib/user-lifecycle";

const ADMIN_EMAILS = getAdminEmailAllowlist();
const SESSION_MAX_AGE_DAYS = env.AUTH_SESSION_MAX_AGE_DAYS;
const SESSION_MAX_AGE_SECONDS = Math.max(1, Math.floor(SESSION_MAX_AGE_DAYS * 24 * 60 * 60));
const SESSION_UPDATE_AGE_SECONDS = 24 * 60 * 60;

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

function normalizeAuthCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

function createAppAuthAdapter(): Adapter {
  const adapter = PrismaAdapter(db);

  return {
    ...adapter,
    async createSession(session) {
      if (!adapter.createSession) {
        throw new Error("Auth adapter is missing createSession.");
      }

      const created = await adapter.createSession(session);
      const sessions = await db.session.findMany({
        where: { userId: session.userId },
        orderBy: [{ createdAt: "desc" }],
        select: { id: true },
      });
      const overflow = sessions.slice(env.AUTH_SESSION_MAX_CONCURRENT);
      if (overflow.length) {
        await db.session.deleteMany({
          where: { id: { in: overflow.map((item) => item.id) } },
        });
      }
      return created;
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: createAppAuthAdapter(),
  secret: env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: SESSION_UPDATE_AGE_SECONDS,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    ...(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: env.AUTH_GOOGLE_ID,
            clientSecret: env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
            profile(profile) {
              const email = profile.email;
              return {
                id: profile.sub,
                name: profile.name,
                email,
                image: profile.picture,
                role: isAdminEmail(email) ? "owner_admin" : "member",
              };
            },
          }),
        ]
      : []),
    Credentials({
      name: "Email code",
      credentials: {
        email: { label: "Email", type: "email" },
        authCode: { label: "Code", type: "text" },
      },
      async authorize(credentials, request) {
        const email = String(credentials?.email || "")
          .trim()
          .toLowerCase();
        const authCode = normalizeAuthCode(String(credentials?.authCode || ""));
        const requestIp =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request.headers.get("x-real-ip") ||
          null;
        if (!email || !authCode) {
          void recordFailedLoginAttempt({
            email,
            ip: requestIp,
            reason: "missing_email_or_code",
          });
          if (env.NODE_ENV === "development") {
            console.info("[auth][credentials] rejected: missing email or code");
          }
          return null;
        }
        if (authCode.length !== 6) {
          void recordFailedLoginAttempt({
            email,
            ip: requestIp,
            reason: "invalid_code_length",
          });
          if (env.NODE_ENV === "development") {
            console.info("[auth][credentials] rejected: code is not 6 digits", { email });
          }
          return null;
        }

        const verification = await verifyAuthChallenge({
          email,
          code: authCode,
          purposes: [AuthChallengePurpose.login, AuthChallengePurpose.signup],
          ip: requestIp,
        });
        if (!verification.ok) {
          void recordFailedLoginAttempt({
            email,
            ip: requestIp,
            reason: `challenge_${verification.reason}`,
          });
          if (env.NODE_ENV === "development") {
            console.info("[auth][credentials] rejected: challenge verification failed", {
              email,
              reason: verification.reason,
            });
          }
          return null;
        }

        const existingUser = await db.user.findUnique({ where: { email } });
        if (existingUser?.deletedAt) {
          void recordFailedLoginAttempt({
            email,
            ip: requestIp,
            reason: "user_deleted",
          });
          return null;
        }

        const user =
          existingUser ||
          (await db.user.create({
            data: {
              email,
              role: isAdminEmail(email) ? "owner_admin" : "student",
              emailVerified: new Date(),
            },
          }));

        if (!existingUser) {
          await recordUserLifecycleEvent({
            eventType: "user_created",
            userId: user.id,
            actorUserId: user.id,
            payload: {
              source: "passwordless_signup",
            },
          }).catch((error) => {
            console.error("[auth][credentials] failed to record user creation", error);
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = String(user.id || token.sub || "");
        token.role = (user.role as UserRole | undefined) || "member";
      }
      return token;
    },
    async signIn({ user, account }) {
      if (!user.email) return true;
      const shouldBeAdmin = isAdminEmail(user.email);
      if (shouldBeAdmin && !isOwnerAdminRole(user.role)) {
        try {
          await db.user.update({
            where: { email: user.email },
            data: { role: "owner_admin" },
          });
          user.role = "owner_admin";
        } catch (error) {
          console.error("[auth][signIn] failed to promote admin role", error);
        }
      }

      if (account?.provider === "credentials" && user.id) {
        try {
          await db.user.update({
            where: { id: String(user.id) },
            data: { authCode: null, authCodeExpiry: null, emailVerified: new Date() },
          });
        } catch (error) {
          console.error("[auth][signIn] failed to clear auth code", error);
        }
      }

      await recordUserLifecycleEvent({
        eventType: "user_logged_in",
        userId: typeof user.id === "string" ? user.id : null,
        actorUserId: typeof user.id === "string" ? user.id : null,
        payload: {
          provider: account?.provider || "unknown",
        },
      }).catch((error) => {
        console.error("[auth][signIn] failed to record lifecycle event", error);
      });
      return true;
    },
    async session({ session, user, token }) {
      if (session.user) {
        session.user.id = String(token?.id || token?.sub || user?.id || "");
        session.user.role = (token?.role as UserRole | undefined) || "member";
      }
      return session;
    },
    authorized() {
      return true;
    },
  },
});

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!isStaffAdminRole(session.user.role)) redirect("/dashboard");
  return session;
}
