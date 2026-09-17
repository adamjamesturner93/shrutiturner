"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CalendarDays, MapPin, MessageCircle, Compass, Users } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useProgrammeData } from "./shared";
import { ProgrammeVisual, StatusPill, ActionLink, cardSurface, eyebrow } from "./visuals";
import { dateLabel, dateRange, sessionLabel, timeLabel } from "@/lib/programmes/presentation";
import type { getClientHub } from "@/lib/programmes/hub-service";
type Hub = Awaited<ReturnType<typeof getClientHub>>;
type Event = Hub["events"][number];
function EventCard({ event: e }: { event: Event }) {
  return (
    <article className={cardSurface} aria-label={e.title}>
      <ProgrammeVisual image={e.image} alt={e.imageAlt} position={e.imagePosition} compact />
      <div className="space-y-5 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className={eyebrow}>{e.type}</span>
          <StatusPill attention={e.status === "Balance due"}>{e.status}</StatusPill>
        </div>
        <h3 className="text-2xl leading-tight">{e.title}</h3>
        <div className="space-y-3 text-sm">
          <p className="flex items-start gap-3">
            <CalendarDays aria-hidden="true" className="text-primary h-4 w-4 shrink-0" />
            <span>
              {dateRange(e.startsAt, e.endsAt, e.timezone)}
              {e.type === "Workshop" && (
                <span className="text-muted-foreground mt-1 block">
                  {timeLabel(e.startsAt, e.timezone)}–{timeLabel(e.endsAt, e.timezone)}
                  {e.online ? ` · ${e.timezone === "Europe/London" ? "UK time" : e.timezone}` : ""}
                </span>
              )}
            </span>
          </p>
          <p className="flex items-center gap-3">
            <MapPin aria-hidden="true" className="text-primary h-4 w-4" />
            {e.online ? "Online" : e.location}
          </p>
          {e.bookingCount > 1 && (
            <p className="flex items-center gap-3">
              <Users aria-hidden="true" className="text-primary h-4 w-4" />
              {e.attendeeCount} attendees · {e.bookingCount} bookings
            </p>
          )}
        </div>
        {e.balanceSummary && <p className="text-muted-foreground text-sm">{e.balanceSummary}</p>}
        <ActionLink href={e.href}>
          {e.bookingCount > 1
            ? "Manage bookings"
            : e.status === "Balance due"
              ? "Manage booking"
              : "View details"}
        </ActionLink>
        {e.requiresConfirmation && e.onboardingHref && (
          <Link className="block text-sm underline underline-offset-4" href={e.onboardingHref}>
            Review health information
          </Link>
        )}
      </div>
    </article>
  );
}
function ProgrammeCard({ programme: p }: { programme: Hub["programmes"][number] }) {
  const next = p.sessions.find((s) => s.upcoming);
  const active = p.state === "active";
  const label = active
    ? `Week ${p.currentWeekNumber || 1} of ${p.weeks.length}`
    : p.state === "follow_up"
      ? "Follow-up access"
      : "Getting ready";
  return (
    <article className={`${cardSurface} border-t-brand-accent border-t-4`}>
      <div className="space-y-5 p-6 md:p-7">
        <div className="flex flex-wrap items-center gap-3">
          <span className={eyebrow}>Your programme</span>
          <StatusPill>{label}</StatusPill>
        </div>
        <h3 className="text-2xl leading-tight">{p.title}</h3>
        {active && p.currentTheme ? (
          <div className="border-brand-accent border-l-2 pl-4">
            <p className="text-lg">{p.currentTheme}</p>
            <p className="text-muted-foreground mt-2 text-sm">
              {p.workoutStatus === "ready"
                ? "Your independent workout is ready."
                : p.workoutStatus === "health_required"
                  ? p.clearanceMessage
                  : p.workoutStatus === "awaiting_teaching"
                    ? "Your independent workout will be available after this week's live session."
                    : "Your independent workout will be available soon."}
            </p>
          </div>
        ) : p.state === "follow_up" ? (
          <p className="text-muted-foreground leading-relaxed">
            Your coached weeks are complete. Revisit your recordings, workouts and community. There
            are no further live sessions or new weekly workouts.
          </p>
        ) : (
          <p className="text-muted-foreground">
            {p.startsAt &&
              dateRange(
                p.startsAt,
                p.structuredProgrammeEndsAt
                  ? new Date(new Date(p.structuredProgrammeEndsAt).getTime() - 1)
                  : null,
                p.timezone
              )}
          </p>
        )}
        {next && p.state !== "follow_up" && (
          <p className="text-sm">
            <span className="text-muted-foreground block">Next live session</span>
            {sessionLabel(next.startsAt, p.timezone)}
          </p>
        )}
        {!active && !p.canExercise && <p className="text-sm">{p.clearanceMessage}</p>}
        {p.accessEndsAt && (
          <p className="text-muted-foreground text-xs">
            Access until {dateLabel(new Date(new Date(p.accessEndsAt).getTime() - 1), p.timezone)}
          </p>
        )}
        {p.credit?.status === "Eligible" && (
          <p className="text-sm">
            £{((p.credit.amountPence || 0) / 100).toFixed(2)} available towards eligible 1:1
            coaching.
          </p>
        )}
        <ActionLink href={`/dashboard/programmes/${p.id}`}>
          {active ? "Continue programme" : "Open programme"}
        </ActionLink>
      </div>
    </article>
  );
}
export function ClientHub({
  section = "dashboard",
  eventId,
}: {
  section?: "dashboard" | "programmes" | "events";
  eventId?: string;
}) {
  const { data, error } = useProgrammeData<Hub>("/api/me/hub");
  const dashboard = section === "dashboard";
  const group = eventId ? data?.events.find((e) => e.id === eventId) : null;
  const activeProgrammes = data?.programmes.filter((p) => p.accessible) || [];
  const upcoming = data?.events.filter((e) => !e.past) || [];
  const pastProgrammes =
    section !== "events" ? data?.programmes.filter((p) => !p.accessible) || [] : [];
  const pastEvents = section !== "programmes" ? data?.events.filter((e) => e.past) || [] : [];
  const empty = dashboard
    ? !data?.coaching && !activeProgrammes.length && !upcoming.length
    : section === "programmes"
      ? !activeProgrammes.length
      : !upcoming.length;
  return (
    <DashboardLayout
      handlesLegalAgreements
      title={dashboard ? "Dashboard" : section === "events" ? "Events" : "Programmes"}
    >
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 md:px-8 md:py-12">
        <header className="space-y-3">
          <p className={eyebrow}>My Studio</p>
          <h1 className="text-3xl md:text-4xl">
            {eventId
              ? group?.title || "Your event bookings"
              : dashboard
                ? `Welcome${data?.firstName ? `, ${data.firstName}` : " back"}`
                : section === "events"
                  ? "Events"
                  : "Programmes"}
          </h1>
          <p className="text-muted-foreground">
            {dashboard
              ? "Your next steps, support and upcoming plans, all in one place."
              : section === "events"
                ? "Your workshops and retreats."
                : "Your programmes, ready when you are."}
          </p>
        </header>
        {error && <p role="alert">{error}</p>}
        {!data && !error && <p role="status">Loading your account…</p>}
        {data && eventId ? (
          group ? (
            <section className="space-y-5">
              <Link href="/dashboard/events" className="underline">
                All events
              </Link>
              <p>
                {dateRange(group.startsAt, group.endsAt, group.timezone)} · {group.location}
              </p>
              <h2 className="text-2xl">Your bookings</h2>
              {group.bookings.map((b) => (
                <article
                  key={b.id}
                  className={`${cardSurface} flex flex-wrap items-center justify-between gap-5 p-6`}
                >
                  <div className="space-y-3">
                    <h3 className="text-lg">{b.reference}</h3>
                    <p>
                      {b.attendeeCount} {b.attendeeCount === 1 ? "attendee" : "attendees"}
                    </p>
                    <StatusPill attention={b.due}>{b.status}</StatusPill>
                  </div>
                  <ActionLink href={b.canPay ? `${b.href}#payment` : b.href}>
                    {b.canPay ? "Manage payment" : "View booking"}
                  </ActionLink>
                </article>
              ))}
            </section>
          ) : (
            <p>This event is not available in your account.</p>
          )
        ) : (
          data && (
            <>
              {dashboard && data.actions.length > 0 && (
                <section aria-labelledby="next-up" className="space-y-5">
                  <h2 id="next-up" className="text-2xl">
                    Next up
                  </h2>
                  <div className="grid gap-5 md:grid-cols-2">
                    {data.actions.map((a) => (
                      <article
                        key={a.id}
                        className="border-brand-accent/20 bg-brand-accent/5 rounded-[1.5rem] border p-6"
                      >
                        <div className="space-y-4">
                          <p className={eyebrow}>
                            {a.actionable && a.rank < 2
                              ? "Action needed"
                              : a.actionable
                                ? "Coming up"
                                : "An update for you"}
                          </p>
                          <h3 className="text-xl">{a.title}</h3>
                          <p>{a.detail}</p>
                          {a.at && (
                            <p className="text-muted-foreground text-sm">
                              {a.online
                                ? sessionLabel(a.at, a.timezone)
                                : dateLabel(a.at, a.timezone)}
                              {a.location && !a.online ? ` · ${a.location}` : ""}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {a.actionable && <ActionLink href={a.href}>{a.label}</ActionLink>}
                            {a.secondaryHref && (
                              <ActionLink href={a.secondaryHref} secondary>
                                {a.secondaryLabel}
                              </ActionLink>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
              {dashboard && data.coaching && (
                <section className="space-y-5">
                  <h2 className="text-2xl">Your coaching</h2>
                  <article className="marketing-grid text-brand-white flex flex-col justify-between gap-7 rounded-[1.75rem] p-7 sm:flex-row sm:items-center">
                    <div className="space-y-3">
                      <MessageCircle
                        aria-hidden="true"
                        className="text-brand-accent-light h-8 w-8"
                      />
                      <h3 className="text-2xl">1:1 Coaching with Shruti</h3>
                      <p className="text-brand-white/80">
                        {data.coaching.status === "completed"
                          ? "Past coaching and resources"
                          : data.coaching.status === "paused"
                            ? "Your coaching is paused"
                            : "Personal support for your training"}
                      </p>
                      {data.coaching.nextCheckInAt && (
                        <p className="text-sm">
                          Next check-in: {dateLabel(data.coaching.nextCheckInAt)}
                        </p>
                      )}
                    </div>
                    <ActionLink secondary href="/dashboard/coaching">
                      Open coaching
                    </ActionLink>
                  </article>
                </section>
              )}
              {section !== "events" && activeProgrammes.length > 0 && (
                <section className="space-y-5">
                  <h2 className="text-2xl">
                    {dashboard ? "Your programmes" : "Active programmes"}
                  </h2>
                  <div className="grid gap-6 md:grid-cols-2">
                    {activeProgrammes.map((p) => (
                      <ProgrammeCard key={p.id} programme={p} />
                    ))}
                  </div>
                </section>
              )}
              {section !== "programmes" && upcoming.length > 0 && (
                <section className="space-y-5">
                  <h2 className="text-2xl">Upcoming events</h2>
                  <div className="grid gap-6 md:grid-cols-2">
                    {upcoming.map((e) => (
                      <EventCard key={e.id} event={e} />
                    ))}
                  </div>
                </section>
              )}
              {empty && (
                <p className="text-muted-foreground bg-secondary/40 rounded-xl p-6">
                  {dashboard
                    ? "You don't currently have any active programmes, coaching or event bookings."
                    : section === "programmes"
                      ? "You don't have any active programmes right now."
                      : "You don't have any upcoming events right now."}
                </p>
              )}
              {(pastProgrammes.length > 0 || pastEvents.length > 0) && (
                <details className="border-brand-dark/10 border-t pt-5 text-sm">
                  <summary className="text-muted-foreground cursor-pointer py-3">
                    Previous activity ({pastProgrammes.length + pastEvents.length})
                  </summary>
                  <ul className="mt-3 space-y-4">
                    {pastProgrammes.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/dashboard/programmes/${p.id}`}
                          className="underline underline-offset-4"
                        >
                          {p.title}
                        </Link>
                        <span className="text-muted-foreground">
                          {" "}
                          · {p.state === "cancelled" ? "Cancelled" : "Past programme"}
                        </span>
                      </li>
                    ))}
                    {pastEvents.map((e) => (
                      <li key={e.id}>
                        <Link href={e.href} className="underline underline-offset-4">
                          {e.title}
                        </Link>
                        <span className="text-muted-foreground">
                          {" "}
                          · {e.type} · {dateLabel(e.startsAt, e.timezone)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {dashboard && (data.legacyClasses || data.legacyMembership) && (
                <details className="text-sm">
                  <summary className="cursor-pointer py-3">Your other account services</summary>
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
                </details>
              )}
              {dashboard && (
                <section
                  aria-labelledby="explore-title"
                  className="bg-brand-dark relative overflow-hidden rounded-[1.75rem] p-6 text-white md:p-8"
                >
                  <div
                    aria-hidden="true"
                    className="absolute -top-24 -right-16 h-72 w-72 rounded-full border-[40px] border-white/5"
                  />
                  <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="max-w-lg space-y-3">
                      <div className="text-brand-accent-light flex items-center gap-3">
                        <Compass aria-hidden="true" className="h-5 w-5" />
                        <span className="text-xs font-medium tracking-[0.24em] uppercase">
                          Explore
                        </span>
                      </div>
                      <h2 id="explore-title" className="text-2xl md:text-3xl">
                        See what's coming up
                      </h2>
                      <p className="text-white/80">
                        Find your next opportunity to move, learn and connect.
                      </p>
                      {data.discovery.map((p) => (
                        <Link
                          key={p.href}
                          href={p.href}
                          className="block rounded-xl bg-white/10 p-4 transition hover:bg-white/15"
                        >
                          <span className="text-brand-accent-light mb-1 block text-xs font-medium">
                            {p.availability}
                          </span>
                          <span className="font-medium">
                            {p.title} <span aria-hidden="true">→</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                    <div className="flex shrink-0 flex-col gap-3">
                      <Button asChild variant="secondary" className="min-h-11">
                        <Link href="/programmes">
                          Programmes <span aria-hidden="true">→</span>
                        </Link>
                      </Button>
                      <Button asChild variant="secondary" className="min-h-11">
                        <Link href="/retreats">
                          Retreats &amp; Workshops <span aria-hidden="true">→</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </section>
              )}
            </>
          )
        )}
      </div>
    </DashboardLayout>
  );
}
