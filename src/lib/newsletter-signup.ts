"use client";

export type NewsletterList = "newsletter" | "blog";

export interface NewsletterSignupPayload {
  email: string;
  firstName?: string;
  lists: NewsletterList[];
  consent: boolean;
  source: "popup" | "inline" | "footer" | "homepage";
}

export async function submitNewsletterSignup(payload: NewsletterSignupPayload): Promise<{
  ok: boolean;
  message?: string;
}> {
  const res = await fetch("/api/newsletter/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...payload,
      honeypot: "",
    }),
  });

  const data = (await res.json().catch(() => null)) as { message?: string } | null;
  return {
    ok: res.ok,
    message: data?.message,
  };
}
