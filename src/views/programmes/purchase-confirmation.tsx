import Link from "next/link";
import { CheckCircle2, CalendarDays, ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { dateLabel, dateRange } from "@/lib/programmes/presentation";
export type ProgrammeConfirmationProps = {
  title: string;
  id: string;
  start: string | null;
  end: string | null;
  accessEnd: string | null;
  timezone: string;
  state: "paid" | "pending" | "cancelled";
  signedIn: boolean;
  participant: boolean;
  gift: boolean;
};
export function ProgrammePurchaseConfirmation(p: ProgrammeConfirmationProps) {
  const path = `/dashboard/programmes/${p.id}/onboarding`;
  const participantReady = p.state === "paid" && p.participant;
  const guestParticipant = !p.signedIn && !p.gift;
  return (
    <Layout>
      <section className="mx-auto max-w-5xl space-y-8 px-4 py-10 md:py-16">
        <header className="bg-brand-dark relative overflow-hidden rounded-[1.75rem] p-7 text-white md:p-10">
          <CheckCircle2 aria-hidden="true" className="text-brand-accent-light mb-5 h-10 w-10" />
          <p className="text-brand-accent-light mb-3 text-xs font-medium tracking-[0.24em] uppercase">
            {p.state === "paid" ? "Booking confirmed" : "Booking update"}
          </p>
          <h1 className="max-w-3xl text-3xl md:text-4xl">
            {p.state === "paid"
              ? p.gift
                ? "Your programme gift is booked."
                : `You're in — welcome to ${p.title}.`
              : p.state === "cancelled"
                ? "Your payment is being reviewed for refund"
                : "Your payment is being confirmed"}
          </h1>
          <p className="mt-5 max-w-2xl text-white/80">
            {participantReady
              ? "Your place is saved. Let's get you ready for the first week."
              : p.gift
                ? "The participant will use their own account to join the programme and complete their health information."
                : p.state === "paid"
                  ? "Your place is saved. Continue with the participant's account to get ready."
                  : "Your booking status will update once payment processing is complete."}
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-[0.85fr_1.15fr]">
          <aside className="bg-secondary space-y-5 rounded-2xl p-6">
            <CalendarDays aria-hidden="true" className="text-primary h-7 w-7" />
            <h2 className="text-2xl">Your programme</h2>
            <p className="font-medium">{p.title}</p>
            {p.start && <p>{dateRange(p.start, p.end, p.timezone)}</p>}
            {p.accessEnd && (
              <p className="text-muted-foreground text-sm">
                Resources and community available until {dateLabel(p.accessEnd, p.timezone)}.
              </p>
            )}
            {participantReady && (
              <Button asChild variant="outline" className="min-h-11 w-full whitespace-normal">
                <a href={`/api/me/programmes/${p.id}/calendar`}>
                  Add live sessions to your calendar
                </a>
              </Button>
            )}
          </aside>
          <div className="border-brand-dark/10 space-y-6 rounded-2xl border p-6 md:p-8">
            <h2 className="text-2xl">
              {p.state === "paid" ? "What happens next" : "Your next step"}
            </h2>
            {p.state === "paid" && (participantReady || guestParticipant) ? (
              <>
                <ol className="space-y-5">
                  <li className="flex gap-3">
                    <span className="bg-secondary flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm">
                      {participantReady ? (
                        <CheckCircle2 aria-hidden="true" className="text-primary h-5 w-5" />
                      ) : (
                        "1"
                      )}
                    </span>
                    <div>
                      <p className="font-medium">
                        {participantReady ? "You're signed in" : "Sign in or activate your account"}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {participantReady
                          ? "Your programme is linked to this account."
                          : "Use the email address used for the participant's booking."}
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-secondary flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm">
                      2
                    </span>
                    <div>
                      <p className="font-medium">Review your health information and agreements</p>
                      <p className="text-muted-foreground text-sm">
                        You can confirm existing details. Shruti will review your exercise clearance
                        before you train.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-secondary flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm">
                      3
                    </span>
                    <div>
                      <p className="font-medium">Make yourself at home</p>
                      <p className="text-muted-foreground text-sm">
                        Add the sessions to your calendar and introduce yourself when the community
                        opens.
                      </p>
                    </div>
                  </li>
                </ol>
                <Button asChild size="lg">
                  <Link
                    href={participantReady ? path : `/login?redirect=${encodeURIComponent(path)}`}
                  >
                    {participantReady
                      ? "Continue to programme onboarding"
                      : "Sign in or activate account"}
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </Button>
                {participantReady && (
                  <Link
                    href={`/dashboard/programmes/${p.id}/home`}
                    className="block text-sm underline underline-offset-4"
                  >
                    Explore your programme
                  </Link>
                )}
              </>
            ) : (
              <>
                <p className="text-muted-foreground">
                  {p.state === "paid"
                    ? "Programme access and health information belong to the participant. They can sign in with their own booking email to complete onboarding."
                    : "You don't need to pay again. Check your account for updates."}
                </p>
                <Button asChild>
                  <Link href={p.signedIn ? "/dashboard" : "/login"}>
                    {p.signedIn ? "Go to My Studio" : "Sign in to My Studio"}
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
