import { PrismaAdapter } from "@auth/prisma-adapter";
import type { UserRole } from "@prisma/client";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS || "tech@thechronicyogini.com,shruti@shrutiturner.com"
)
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
const SESSION_MAX_AGE_DAYS = Number(process.env.AUTH_SESSION_MAX_AGE_DAYS || "30");
const SESSION_MAX_AGE_SECONDS = Math.max(1, Math.floor(SESSION_MAX_AGE_DAYS * 24 * 60 * 60));
const SESSION_UPDATE_AGE_SECONDS = 24 * 60 * 60;

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

function normalizeAuthCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: SESSION_UPDATE_AGE_SECONDS,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
            profile(profile) {
              const email = profile.email;
              return {
                id: profile.sub,
                name: profile.name,
                email,
                image: profile.picture,
                role: isAdminEmail(email) ? "admin" : "student",
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
      async authorize(credentials) {
        const email = String(credentials?.email || "")
          .trim()
          .toLowerCase();
        const authCode = normalizeAuthCode(String(credentials?.authCode || ""));
        if (!email || !authCode) {
          if (process.env.NODE_ENV === "development") {
            console.info("[auth][credentials] rejected: missing email or code");
          }
          return null;
        }
        if (authCode.length !== 6) {
          if (process.env.NODE_ENV === "development") {
            console.info("[auth][credentials] rejected: code is not 6 digits", { email });
          }
          return null;
        }

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.authCode || !user.authCodeExpiry) {
          if (process.env.NODE_ENV === "development") {
            console.info("[auth][credentials] rejected: user/code/expiry missing", {
              email,
              hasUser: Boolean(user),
              hasCode: Boolean(user?.authCode),
              hasExpiry: Boolean(user?.authCodeExpiry),
            });
          }
          return null;
        }
        const storedCode = normalizeAuthCode(user.authCode);
        if (storedCode !== authCode) {
          if (process.env.NODE_ENV === "development") {
            console.info("[auth][credentials] rejected: code mismatch", { email });
          }
          return null;
        }
        if (user.authCodeExpiry < new Date()) {
          if (process.env.NODE_ENV === "development") {
            console.info("[auth][credentials] rejected: code expired", { email });
          }
          return null;
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
    async signIn({ user, account }) {
      if (!user.email) return true;
      const shouldBeAdmin = isAdminEmail(user.email);
      if (shouldBeAdmin && user.role !== "admin") {
        try {
          await db.user.update({
            where: { email: user.email },
            data: { role: "admin" },
          });
        } catch (error) {
          console.error("[auth][signIn] failed to promote admin role", error);
        }
      }

      if (account?.provider === "credentials" && user.id) {
        try {
          await db.user.update({
            where: { id: String(user.id) },
            data: { authCode: null, authCodeExpiry: null },
          });
        } catch (error) {
          console.error("[auth][signIn] failed to clear auth code", error);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user.role as UserRole) || "student";
      }

      if ((!token.role || !token.id) && token.email) {
        const dbUser = await db.user.findUnique({
          where: { email: String(token.email).toLowerCase() },
          select: { id: true, role: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id || "");
        session.user.role = (token.role as UserRole) || "student";
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
  if (session.user.role !== "admin") redirect("/dashboard");
  return session;
}
