"use client";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useProgrammeData, panelClass, When } from "./shared";
import type { getClientHub } from "@/lib/programmes/hub-service";
type Hub = Awaited<ReturnType<typeof getClientHub>>;
export function ClientHub({
  section = "dashboard",
}: {
  section?: "dashboard" | "programmes" | "events";
}) {
  const { data, error } = useProgrammeData<Hub>("/api/me/hub");
  return (
    <DashboardLayout
      handlesLegalAgreements
      title={section === "dashboard" ? "Dashboard" : section === "events" ? "Events" : "Programmes"}
    >
      <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
        <h1 className="text-3xl">
          {section === "dashboard"
            ? `Welcome${data?.firstName ? `, ${data.firstName}` : " back"}`
            : section === "events"
              ? "Events"
              : "Programmes"}
        </h1>
        {error && <p role="alert">{error}</p>}
        {!data && !error && <p role="status">Loading your account…</p>}
        {data && (
          <>
            {section === "dashboard" && data.actions.length > 0 && (
              <section aria-labelledby="next-up">
                <h2 id="next-up" className="mb-4 text-2xl">
                  Next up
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {data.actions.map((a) => (
                    <article key={a.id} className={panelClass}>
                      <h3>{a.title}</h3>
                      <p>{a.detail}</p>
                      <When value={a.at} />
                      {a.actionable && (
                        <Link className="block underline" href={a.href}>
                          View next steps
                        </Link>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}
            {section === "dashboard" && data.coaching && (
              <article className={panelClass}>
                <h2>1:1 Coaching</h2>
                <p>{data.coaching.status}</p>
                <Link className="underline" href="/dashboard/coaching">
                  Open coaching
                </Link>
              </article>
            )}
            {section !== "events" && data.programmes.some((p) => p.accessible) && (
              <section>
                <h2 className="mb-4 text-2xl">Your programmes</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {data.programmes
                    .filter((p) => p.accessible)
                    .map((p) => (
                      <article key={p.id} className={panelClass}>
                        <h3>{p.title}</h3>
                        <p>{p.state.replaceAll("_", " ")}</p>
                        <When value={p.startsAt} />
                        <p>
                          Access until{" "}
                          <When
                            value={
                              p.accessEndsAt
                                ? new Date(new Date(p.accessEndsAt).getTime() - 1).toISOString()
                                : null
                            }
                          />
                        </p>
                        <p>{p.clearanceMessage}</p>
                        {p.credit?.status === "Eligible" && (
                          <p>
                            You have £{((p.credit.amountPence || 0) / 100).toFixed(2)} available
                            towards eligible 1:1 coaching.
                          </p>
                        )}
                        <Link className="underline" href={`/dashboard/programmes/${p.id}`}>
                          Continue programme
                        </Link>
                      </article>
                    ))}
                </div>
              </section>
            )}
            {section !== "programmes" && data.events.some((e) => !e.past) && (
              <section>
                <h2 className="mb-4 text-2xl">Upcoming events</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {data.events
                    .filter((e) => !e.past)
                    .map((e) => (
                      <article className={panelClass} key={e.id}>
                        <h3>{e.title}</h3>
                        <p>
                          {e.type} · {e.status.replaceAll("_", " ")}
                        </p>
                        <When value={e.startsAt} />
                        <Link className="block underline" href={`/dashboard/retreats/${e.id}`}>
                          View booking
                        </Link>
                        {e.requiresConfirmation && (
                          <Link
                            className="block underline"
                            href={`/dashboard/events/${e.id}/onboarding`}
                          >
                            Review health information
                          </Link>
                        )}
                      </article>
                    ))}
                </div>
              </section>
            )}
            {!data.coaching &&
              !data.programmes.some((p) => p.accessible) &&
              !data.events.some((e) => !e.past) && (
                <div className={panelClass}>
                  <p>You don't currently have any active programmes, coaching or event bookings.</p>
                  <Link className="underline" href="/coaching">
                    Explore what's available
                  </Link>
                </div>
              )}
            {(data.programmes.some((p) => !p.accessible) || data.events.some((e) => e.past)) && (
              <details className={panelClass}>
                <summary>Previous activity</summary>
                {section !== "events" &&
                  data.programmes
                    .filter((p) => !p.accessible)
                    .map((p) => (
                      <p key={p.id}>
                        <Link className="underline" href={`/dashboard/programmes/${p.id}`}>
                          {p.title}
                        </Link>{" "}
                        — {p.state}
                      </p>
                    ))}
                {section !== "programmes" &&
                  data.events
                    .filter((e) => e.past)
                    .map((e) => (
                      <p key={e.id}>
                        <Link className="underline" href={`/dashboard/retreats/${e.id}`}>
                          {e.title}
                        </Link>{" "}
                        — {e.type}
                      </p>
                    ))}
              </details>
            )}
            {section === "dashboard" && (data.legacyClasses || data.legacyMembership) && (
              <section className={panelClass}>
                <h2>Your other account services</h2>
                {data.legacyClasses && (
                  <Link className="mr-4 underline" href="/dashboard/schedule">
                    Class bookings
                  </Link>
                )}
                {data.legacyMembership && (
                  <Link className="underline" href="/dashboard/membership">
                    Membership and credits
                  </Link>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
