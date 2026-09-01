"use client";

export interface NewsletterSignupPayload {
  email: string;
  firstName?: string;
  marketingOptIn: boolean;
  consent: boolean;
  source: "popup" | "inline" | "footer" | "homepage" | "subscribe" | "holding-page";
  turnstileToken: string;
}

export async function submitNewsletterSignup(payload: NewsletterSignupPayload): Promise<{
  ok: boolean;
  message?: string;
  state?: "pending" | "subscribed";
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

  const data = (await res.json().catch(() => null)) as {
    message?: string;
    state?: "pending" | "subscribed";
  } | null;
  return {
    ok: res.ok,
    message: data?.message,
    state: data?.state,
  };
}
