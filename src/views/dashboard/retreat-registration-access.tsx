"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function RetreatRegistrationAccess({ attendeeId }: { attendeeId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function switchAccount() {
    setPending(true);
    setError("");
    try {
      const destination = `/dashboard/retreats/registration/${encodeURIComponent(attendeeId)}`;
      await signOut({ redirectTo: `/login?redirect=${encodeURIComponent(destination)}` });
    } catch {
      setError("We couldn’t sign you out. Please try again.");
      setPending(false);
    }
  }
  return (
    <section
      className="marketing-panel mx-auto max-w-xl space-y-5 rounded-3xl p-6 md:p-8"
      aria-labelledby="registration-access-title"
    >
      <p className="text-brand-accent text-sm font-medium">Your registration</p>
      <h1 id="registration-access-title" className="text-3xl">
        Sign in with your invitation email
      </h1>
      <p>
        This registration isn’t available to your current account. Use the email address that
        received the invitation to complete your own details.
      </p>
      <p className="text-muted-foreground">
        Already using that address? Sign in again with an email code to verify it. We’ll bring you
        back to this registration.
      </p>
      <p className="text-muted-foreground">
        If you bought a place for someone else, they’ll need to complete their own registration.
        Their private information is only available to them and authorised staff.
      </p>
      {error ? <p role="alert">{error}</p> : null}
      <div className="flex flex-col gap-3 sm:items-start">
        <Button
          onClick={switchAccount}
          disabled={pending}
          className="h-auto max-w-full whitespace-normal"
        >
          {pending ? "Signing out…" : "Sign out and continue to registration"}
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/retreats">Back to my events</Link>
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">
        Still unable to open it? The invitation may no longer be available.{" "}
        <Link href="/contact" className="underline underline-offset-4">
          Contact Shruti for help
        </Link>
        .
      </p>
    </section>
  );
}
