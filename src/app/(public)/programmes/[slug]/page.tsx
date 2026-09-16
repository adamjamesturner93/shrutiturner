import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadCohort, requireCohortStaff } from "@/lib/programmes/access";
import { salesOpen } from "@/lib/programmes/policy";
import { programmeNow } from "@/lib/programmes/clock";
import { Layout } from "@/components/layout";
import { ProgrammePurchase } from "@/views/programmes/sales-checkout";
async function Sales({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  await connection();
  const { slug } = await params;
  const c = await loadCohort(slug).catch(() => null);
  if (!c) notFound();
  const query = await searchParams;
  const preview = query.preview === "1";
  if (c.cohortState === "draft" || preview) {
    const session = await auth();
    if (!session?.user?.id) notFound();
    await requireCohortStaff(session.user.id, c.id).catch(() => notFound());
  }
  const date = (d: Date | null) =>
    d?.toLocaleDateString("en-GB", {
      timeZone: c.timezone,
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  return (
    <Layout>
      <section className="mx-auto max-w-3xl space-y-7 px-4 py-12">
        <h1 className="text-4xl">{c.title}</h1>
        {preview && <p>Staff preview — draft is not available to purchase.</p>}
        <p className="whitespace-pre-wrap">{c.salesCopy || "Sales copy to be completed."}</p>
        <p>
          {date(c.startDate)} —{" "}
          {date(
            c.structuredProgrammeEndsAt ? new Date(c.structuredProgrammeEndsAt.getTime() - 1) : null
          )}
        </p>
        <h2 className="text-2xl">What's included</h2>
        <ul className="list-disc pl-5">
          <li>{c.durationWeeks} coached weeks</li>
          <li>Weekly informal education</li>
          <li>One 45-minute live strength workout each week and its recording</li>
          <li>Independent written workouts using taught exercises</li>
          <li>Private text community and follow-up access</li>
        </ul>
        <h2 className="text-2xl">Live sessions</h2>
        <ul>
          {c.sessions.map((s) => (
            <li key={s.id}>
              {s.title}:{" "}
              {s.endsAt
                ? s.startsAt.toLocaleString("en-GB", { timeZone: c.timezone })
                : "Schedule to be confirmed"}
            </li>
          ))}
        </ul>
        <h2 className="text-2xl">Equipment and suitability</h2>
        <p>{c.equipment || "Equipment requirements to be completed."}</p>
        <p>
          Participants complete health screening and receive exercise clearance before training.
          Educational content remains available while onboarding is completed.
        </p>
        <h2 className="text-2xl">Price and cohort confirmation</h2>
        <p>
          {c.salePricePence ? `£${(c.salePricePence / 100).toFixed(2)}` : "Price to be confirmed"} ·
          Minimum {c.minimumParticipants}
          {c.maximumParticipants ? ` · Maximum ${c.maximumParticipants}` : ""}
        </p>
        <p>Confirmation decision: {date(c.confirmationDeadline)}</p>
        <p className="whitespace-pre-wrap">
          {c.refundWording || "Refund and cancellation wording to be completed."}
        </p>
        <h2 className="text-2xl">After the programme</h2>
        <p>
          Use previous content and community until{" "}
          {date(c.followUpAccessEndsAt ? new Date(c.followUpAccessEndsAt.getTime() - 1) : null)}. No
          new workouts or live coaching are included during follow-up access.
        </p>
        <h2 className="text-2xl">Common questions</h2>
        <details>
          <summary>Do I need to attend every live workout?</summary>
          <p>
            No. Once the teaching recording is ready, cleared participants can use the written
            workout and replay even if they missed the live session.
          </p>
        </details>
        <details>
          <summary>What happens while my health information is being reviewed?</summary>
          <p>
            You can explore educational material, the timetable and community when it opens.
            Exercise sessions and workouts unlock after clearance.
          </p>
        </details>
        <details>
          <summary>What if the minimum number is not reached?</summary>
          <p>
            Shruti will review the cohort at the confirmation deadline and let you know whether it
            will run. The cancellation policy above explains refunds if it is cancelled.
          </p>
        </details>
        {!preview && salesOpen(c, programmeNow()) ? (
          <ProgrammePurchase id={c.id} version={c.agreementVersion} />
        ) : (
          <p>Enrolment is not currently open.</p>
        )}
      </section>
    </Layout>
  );
}
export default function Page(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  return (
    <Suspense fallback={<p>Loading programme…</p>}>
      <Sales {...props} />
    </Suspense>
  );
}
