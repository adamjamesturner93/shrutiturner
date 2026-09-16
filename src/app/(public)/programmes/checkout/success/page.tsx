import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getStripeClient } from "@/lib/billing/stripe-client";
import { fulfilProgrammeCheckout } from "@/lib/programmes/checkout-service";
import { db } from "@/lib/db";
import { Layout } from "@/components/layout";
export const metadata = { robots: { index: false, follow: false } };
async function Success({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  await connection();
  const { session_id } = await searchParams;
  if (!session_id?.startsWith("cs_")) notFound();
  const session = await getStripeClient().checkout.sessions.retrieve(session_id);
  if (session.metadata?.kind !== "cohort_purchase") notFound();
  await fulfilProgrammeCheckout(session);
  const e = await db.smallGroupProgrammeEnrollment.findUnique({
    where: { id: session.metadata.enrolmentId },
    include: { programme: true },
  });
  if (!e || e.stripeCheckoutSessionId !== session_id) notFound();
  const path = `/dashboard/programmes/${e.programmeId}/onboarding`;
  return (
    <Layout>
      <section className="mx-auto max-w-2xl space-y-6 p-8">
        <h1 className="text-3xl">
          {e.paidAt && e.status === "active"
            ? `You're in — welcome to ${e.programme.title}.`
            : e.status === "cancelled"
              ? "Your payment is being reviewed for refund"
              : "Your payment is being confirmed"}
        </h1>
        <p>{e.programme.title}</p>
        <p>
          Starts{" "}
          {e.programme.startDate?.toLocaleDateString("en-GB", { timeZone: e.programme.timezone })}.
          Structured weeks end{" "}
          {e.programme.structuredProgrammeEndsAt &&
            new Date(e.programme.structuredProgrammeEndsAt.getTime() - 1).toLocaleDateString(
              "en-GB",
              { timeZone: e.programme.timezone }
            )}
          . Resources remain available until{" "}
          {e.programme.followUpAccessEndsAt &&
            new Date(e.programme.followUpAccessEndsAt.getTime() - 1).toLocaleDateString("en-GB", {
              timeZone: e.programme.timezone,
            })}
          .
        </p>
        <p>
          Participants use their own verified account for programme access and health information.
        </p>
        <ul className="list-disc pl-5">
          <li>Activate or sign into your account</li>
          <li>Complete or confirm your health questionnaire</li>
          <li>Accept required agreements and wait for exercise clearance</li>
          <li>Add live sessions to your calendar</li>
          <li>Introduce yourself when community opens</li>
        </ul>
        <Link className="block underline" href={`/login?redirect=${encodeURIComponent(path)}`}>
          Sign in or activate account
        </Link>
        <Link className="block underline" href={path}>
          Open programme onboarding
        </Link>
        <Link className="block underline" href={`/api/me/programmes/${e.programmeId}/calendar`}>
          Add live sessions to your calendar
        </Link>
      </section>
    </Layout>
  );
}
export default function Page(props: { searchParams: Promise<{ session_id?: string }> }) {
  return (
    <Suspense fallback={<p>Confirming payment…</p>}>
      <Success {...props} />
    </Suspense>
  );
}
