"use client";
import { programmeStateLabels } from "@/lib/programmes/presentation";
import Link from "next/link";
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { VideoRoom } from "@/components/video/video-room";
import { useProgrammeData, programmeRequest, panelClass, When } from "./shared";
import { ProgrammeCommunity } from "./community";
import { ProgrammeOnboarding } from "./onboarding";
import type { getProgrammePortal, getProgrammeWeek } from "@/lib/programmes/content-service";
import { StatusPill, ActionLink, eyebrow } from "./visuals";
import { dateLabel } from "@/lib/programmes/presentation";
import { CalendarDays, BookOpen, MessageCircle } from "lucide-react";
type Portal = Awaited<ReturnType<typeof getProgrammePortal>>;
type Week = Awaited<ReturnType<typeof getProgrammeWeek>>;
export function ProgrammePortal({ id, path = [] }: { id: string; path?: string[] }) {
  const { data: p, error } = useProgrammeData<Portal>(`/api/me/programmes/${id}`);
  const [joining, setJoining] = useState<string | null>(null);
  const base = `/dashboard/programmes/${id}`;
  const section = path[0] || "home";
  return (
    <DashboardLayout handlesLegalAgreements title={p?.title || "Programme"}>
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
        <Link
          href="/dashboard/programmes"
          className="inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4"
        >
          ← Your programmes
        </Link>
        <header className="bg-brand-dark relative overflow-hidden rounded-[1.75rem] p-6 text-white md:p-9">
          <div
            aria-hidden="true"
            className="absolute -top-20 -right-10 h-64 w-64 rounded-full border-[30px] border-white/5"
          />
          <p className="text-brand-accent-light mb-3 text-xs font-medium tracking-[0.24em] uppercase">
            Your programme with Shruti
          </p>
          <h1 className="relative max-w-3xl text-3xl md:text-4xl">
            {p?.title || "Your programme"}
          </h1>
          {p && (
            <div className="relative mt-5 flex flex-wrap items-center gap-3">
              <StatusPill>{programmeStateLabels[p.state] || p.state}</StatusPill>
              <span className="text-sm text-white/80">
                Starts {dateLabel(p.startsAt, p.timezone)}
              </span>
            </div>
          )}
        </header>
        {error && <p role="alert">{error}</p>}
        {!p && !error && <p role="status">Loading programme…</p>}
        {p && (
          <>
            {!p.accessible ? (
              <div className={panelClass}>
                <h2>Programme history</h2>
                <p>Your enrolment is recorded. Protected programme access has ended.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-muted-foreground text-sm">
                    A place to learn, train and ask questions.
                  </p>
                  <Button asChild variant="outline">
                    <Link href={`${base}/onboarding`}>Onboarding checklist</Link>
                  </Button>
                </div>
                <nav
                  aria-label="Programme"
                  className="bg-secondary flex gap-1 overflow-x-auto rounded-2xl p-2"
                >
                  {["Home", "Weeks", "Live", "Community", "Resources"].map((label) => (
                    <Link
                      key={label}
                      aria-current={section === label.toLowerCase() ? "page" : undefined}
                      className={`shrink-0 rounded-xl px-4 py-3 text-sm font-medium transition ${section === label.toLowerCase() ? "bg-brand-dark text-white shadow-sm" : "text-brand-dark hover:bg-background"}`}
                      href={`${base}/${label.toLowerCase()}`}
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
                {p.state === "follow_up" && (
                  <div className={panelClass}>
                    <h2>
                      Your {p.weeks.length === 5 ? "five" : p.weeks.length} coached weeks are
                      complete.
                    </h2>
                    <p>
                      Everything from the programme remains available until{" "}
                      <When
                        value={
                          p.accessEndsAt
                            ? new Date(new Date(p.accessEndsAt).getTime() - 1).toISOString()
                            : null
                        }
                      />
                      . You can continue using the workouts, recordings and community, but there are
                      no further live sessions or new weekly workouts.
                    </p>
                    <p>
                      Shruti may reply asynchronously to reasonable follow-up questions. This does
                      not include ongoing 1:1 coaching or guaranteed response times.
                    </p>
                  </div>
                )}
                {!p.canExercise && (
                  <div className={panelClass}>
                    <h2>{p.clearanceMessage}</h2>
                    <p>
                      You can explore the programme and join the community when it opens. Your
                      workouts and live sessions will unlock once your health information is
                      complete and reviewed by your coach.
                    </p>
                    {p.clearanceStatus === "pending_confirmation" && (
                      <Link className="underline" href={`${base}/onboarding`}>
                        Complete onboarding
                      </Link>
                    )}
                    {!p.agreementsComplete && (
                      <Link className="block underline" href={`${base}/onboarding`}>
                        Review required agreements
                      </Link>
                    )}
                  </div>
                )}
                {section === "onboarding" && <ProgrammeOnboarding id={id} />}
                {section === "home" && (
                  <>
                    <p>{p.introduction}</p>
                    <ol aria-label="Programme weeks" className="grid grid-cols-5 gap-2">
                      {p.weeks.map((w) => (
                        <li
                          key={w.id}
                          className={`rounded-xl border-t-4 p-3 text-center text-sm ${w.id === p.currentWeek ? "border-brand-accent bg-secondary font-semibold" : "border-brand-dark/10 text-muted-foreground"}`}
                        >
                          {w.released ? (
                            <Link
                              className="block py-1 underline underline-offset-4"
                              href={`${base}/weeks/${w.id}`}
                            >
                              Week {w.number}
                            </Link>
                          ) : (
                            <span className="block py-1">Week {w.number}</span>
                          )}
                        </li>
                      ))}
                    </ol>
                    {!p.currentWeek && (
                      <article className={panelClass}>
                        <h2>Get ready for your first week</h2>
                        <p>
                          Your weekly education will appear here when the programme begins. In the
                          meantime, review your onboarding and add the live sessions to your
                          calendar.
                        </p>
                        <ActionLink href={`${base}/onboarding`}>Review onboarding</ActionLink>
                      </article>
                    )}
                    {p.currentWeek && <ProgrammeWeekView id={id} weekId={p.currentWeek} />}
                    <h2 className="flex items-center gap-3 text-2xl">
                      <CalendarDays aria-hidden="true" className="text-primary h-6 w-6" />
                      Next live session
                    </h2>
                    {!p.sessions.some((s) => s.upcoming) && (
                      <p className="text-muted-foreground">
                        No further live sessions are scheduled. Available recordings are in Live.
                      </p>
                    )}
                    {p.sessions
                      .filter((s) => s.upcoming)
                      .slice(0, 1)
                      .map((s) => (
                        <article className={panelClass} key={s.id}>
                          <h3>{s.title}</h3>
                          <When value={s.startsAt} />
                          <Link className="block underline" href={`${base}/live`}>
                            View live session
                          </Link>
                        </article>
                      ))}
                    {p.canCommunity && (
                      <>
                        <h2 className="flex items-center gap-3 text-2xl">
                          <MessageCircle aria-hidden="true" className="text-primary h-6 w-6" />
                          Latest from your community
                        </h2>
                        <ProgrammeCommunity id={id} preview />
                      </>
                    )}
                  </>
                )}
                {section === "weeks" &&
                  (path[1] ? (
                    <ProgrammeWeekView id={id} weekId={path[1]} />
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {p.weeks.map((w) => (
                        <article className={panelClass} key={w.id}>
                          <div className="flex items-center justify-between gap-3">
                            <span className={eyebrow}>Week {w.number}</span>
                            <StatusPill>{w.released ? "Available" : "Coming up"}</StatusPill>
                          </div>
                          <h2>{w.title}</h2>
                          {w.released ? (
                            <Link className="underline" href={`${base}/weeks/${w.id}`}>
                              Open week
                            </Link>
                          ) : (
                            <p>Available {dateLabel(w.releasesAt, p.timezone)}</p>
                          )}
                        </article>
                      ))}
                    </div>
                  ))}
                {section === "live" && (
                  <>
                    <div>
                      <h2 className="text-2xl">Live workouts &amp; recordings</h2>
                      <p className="text-muted-foreground mt-2">
                        Train together, or revisit a session in your own time.
                      </p>
                    </div>
                    <div className="bg-secondary rounded-xl p-4">
                      <span className="font-medium">Equipment</span>
                      <p>{p.equipment}</p>
                    </div>
                    {!p.sessions.length && (
                      <p>Session details will appear here once the schedule is ready.</p>
                    )}
                    {joining ? (
                      <VideoRoom
                        sessionId={joining}
                        roomTokenEndpoint={`/api/me/programmes/${id}/live/${joining}`}
                        attendanceEndpoint={null}
                        chatEndpoint={null}
                        displayModeEndpoint={null}
                        mode="small-group"
                        isInstructor={p.staff}
                        onStartRecording={
                          p.staff
                            ? async () => {
                                await programmeRequest(
                                  `/api/admin/programmes/cohorts/${id}/recording/${joining}`,
                                  { action: "start" }
                                );
                              }
                            : undefined
                        }
                        onStopRecording={
                          p.staff
                            ? async () => {
                                await programmeRequest(
                                  `/api/admin/programmes/cohorts/${id}/recording/${joining}`,
                                  { action: "stop" }
                                );
                              }
                            : undefined
                        }
                        className={p.title}
                        classTime=""
                        classDuration="45 minutes"
                        registeredCount={0}
                        isRecorded
                        chatEnabled={false}
                        initialMuted
                        initialCameraOn={false}
                        onLeave={() => setJoining(null)}
                      />
                    ) : (
                      [...p.sessions]
                        .sort(
                          (a, b) =>
                            Number(b.upcoming) - Number(a.upcoming) ||
                            new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
                        )
                        .map((s) => (
                          <article key={s.id} className={panelClass}>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <h3>{s.title}</h3>
                              <StatusPill>
                                {s.status === "completed"
                                  ? "Previous session"
                                  : s.upcoming
                                    ? "Upcoming"
                                    : "Session ended"}
                              </StatusPill>
                            </div>
                            <When value={s.startsAt} />
                            {s.canJoin && (
                              <Button onClick={() => setJoining(s.id)}>Join live session</Button>
                            )}
                            {s.status === "completed" &&
                              (s.replayId ? (
                                <ProgrammeReplay id={id} replayId={s.replayId} />
                              ) : (
                                <p>
                                  {p.canExercise
                                    ? "Recording is processing or unavailable."
                                    : "Exercise replay requires clearance."}
                                </p>
                              ))}
                          </article>
                        ))
                    )}
                  </>
                )}
                {section === "community" &&
                  (p.canCommunity ? (
                    <ProgrammeCommunity id={id} />
                  ) : (
                    <article className={panelClass}>
                      <MessageCircle aria-hidden="true" className="text-primary h-8 w-8" />
                      <h2>Your community is opening soon</h2>
                      <p>
                        Community opens <When value={p.communityOpenAt} />.
                      </p>
                      <p>
                        Until then, you can complete onboarding and explore your programme
                        information.
                      </p>
                    </article>
                  ))}
                {section === "resources" && (
                  <>
                    <div>
                      <h2 className="flex items-center gap-3 text-2xl">
                        <BookOpen aria-hidden="true" className="text-primary h-6 w-6" />
                        Resources
                      </h2>
                      <p className="text-muted-foreground mt-2">
                        Practical guides to support your training, all in one place.
                      </p>
                    </div>
                    <article className={panelClass}>
                      <h3>Equipment guide</h3>
                      <p>{p.equipment}</p>
                    </article>
                    {p.resources.map((r, i) => (
                      <article key={i} className={panelClass}>
                        <h3>{r.title}</h3>
                        <p className="whitespace-pre-wrap">{r.body}</p>
                      </article>
                    ))}
                  </>
                )}
                {p.closingBody && ["home", "resources"].includes(section) && (
                  <article className={panelClass}>
                    <h2>What Next?</h2>
                    <p className="whitespace-pre-wrap">{p.closingBody}</p>
                    {p.closingVideoUrl && (
                      <video
                        controls
                        src={p.closingVideoUrl}
                        aria-label="What Next?"
                        className="w-full"
                      />
                    )}
                  </article>
                )}
                {p.credit?.status === "Eligible" && (
                  <article className={panelClass}>
                    <h2>Your alumni coaching credit</h2>
                    <p>
                      You have £{((p.credit.amountPence || 0) / 100).toFixed(2)} of your programme
                      fee available towards eligible 1:1 coaching if you join by{" "}
                      <When value={p.credit.endsAt} />.
                    </p>
                    <Link className="underline" href="/coaching">
                      Explore coaching
                    </Link>
                  </article>
                )}
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
function ProgrammeWeekView({ id, weekId }: { id: string; weekId: string }) {
  const { data: w, error } = useProgrammeData<Week>(`/api/me/programmes/${id}/weeks/${weekId}`);
  return (
    <section className="space-y-5">
      {error && <p role="alert">{error}</p>}
      {w && (
        <>
          <div className="border-brand-accent border-l-4 py-2 pl-5">
            <p className={eyebrow}>Week {w.number}</p>
            <h2 className="mt-2 text-3xl">{w.title}</h2>
          </div>
          <article className={panelClass}>
            <p className={eyebrow}>Learn · This week’s theme</p>
            <h3>{w.theme}</h3>
            <p className="whitespace-pre-wrap">{w.education}</p>
            {w.videoUrl && (
              <video controls src={w.videoUrl} aria-label={w.theme} className="w-full" />
            )}
            <ul className="list-disc pl-5">
              {w.takeaways.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </article>
          {w.live && (
            <article className={panelClass}>
              <h3>{w.live.title}</h3>
              <When value={w.live.startsAt} />
              <p>45 minutes · {w.live.equipment}</p>
              {w.live.canJoin && (
                <Link className="underline" href={`/dashboard/programmes/${id}/live`}>
                  Join live session
                </Link>
              )}
              {w.live.replayId && <ProgrammeReplay id={id} replayId={w.live.replayId} />}
            </article>
          )}
          <article className={panelClass}>
            <p className={eyebrow}>Practise · In your own time</p>
            <h3>Your independent workout</h3>
            {!w.canExercise ? (
              <p>{w.clearanceMessage}</p>
            ) : !w.canWorkout ? (
              <p>
                {w.availability === "preparing_recording"
                  ? "Your teaching recording is being prepared. Your workout will be available shortly."
                  : "Your independent workout will be available after this week's live session."}
              </p>
            ) : (
              <ol className="space-y-5">
                {w.workout.map((e, i) => (
                  <li key={i} className="bg-secondary/60 rounded-xl p-4">
                    <h4>
                      {e.name} — {e.prescription}
                    </h4>
                    <p>{e.instruction}</p>
                    <p>{e.alternatives}</p>
                    {e.replayId && (
                      <ProgrammeReplay id={id} replayId={e.replayId} timestamp={e.timestamp} />
                    )}
                  </li>
                ))}
              </ol>
            )}
          </article>
          {w.reflection && (
            <article className={panelClass}>
              <p className={eyebrow}>Reflect · Your community</p>
              <h3>This week's reflection</h3>
              <p>{w.reflection}</p>
              <Link className="underline" href={`/dashboard/programmes/${id}/community`}>
                Join the discussion
              </Link>
            </article>
          )}
        </>
      )}
    </section>
  );
}
export function ProgrammeReplay({
  id,
  replayId,
  timestamp = 0,
}: {
  id: string;
  replayId: string;
  timestamp?: number;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  return (
    <div>
      {url ? (
        <video
          controls
          src={`${url}#t=${timestamp}`}
          aria-label="Exercise replay"
          className="w-full"
        />
      ) : (
        <Button
          variant="outline"
          onClick={() =>
            programmeRequest<{ url: string }>(`/api/me/programmes/${id}/replays/${replayId}`)
              .then((r) => setUrl(r.url))
              .catch((e: Error) => setError(e.message))
          }
        >
          Watch replay{timestamp ? ` from ${timestamp}s` : ""}
        </Button>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
