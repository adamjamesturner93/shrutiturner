import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { ProgrammePurchaseConfirmation } from "@/views/programmes/purchase-confirmation";
import { PublicPageLoading } from "@/components/public-loading";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getStripeClient } from "@/lib/billing/stripe-client";
import { fulfilProgrammeCheckout } from "@/lib/programmes/checkout-service";
import { db } from "@/lib/db";
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
  const account = await auth();
  const participant = Boolean(account?.user?.id && account.user.id === e.userId);
  return (
    <ProgrammePurchaseConfirmation
      title={e.programme.title}
      id={e.programmeId}
      start={e.programme.startDate?.toISOString() || null}
      end={
        e.programme.structuredProgrammeEndsAt
          ? new Date(e.programme.structuredProgrammeEndsAt.getTime() - 1).toISOString()
          : null
      }
      accessEnd={
        e.programme.followUpAccessEndsAt
          ? new Date(e.programme.followUpAccessEndsAt.getTime() - 1).toISOString()
          : null
      }
      timezone={e.programme.timezone}
      state={
        e.paidAt && e.status === "active"
          ? "paid"
          : e.status === "cancelled"
            ? "cancelled"
            : "pending"
      }
      signedIn={Boolean(account?.user)}
      participant={participant}
      gift={Boolean(e.purchaserEmail && e.purchaserEmail !== e.attendeeEmail)}
    />
  );
}
export default function Page(props: { searchParams: Promise<{ session_id?: string }> }) {
  return (
    <Suspense fallback={<PublicPageLoading label="Confirming your programme booking" />}>
      <Success {...props} />
    </Suspense>
  );
}
