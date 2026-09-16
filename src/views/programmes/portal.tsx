"use client";
import Link from "next/link";
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { VideoRoom } from "@/components/video/video-room";
import { useProgrammeData, programmeRequest, panelClass, When } from "./shared";
import { ProgrammeCommunity } from "./community";
import { ProgrammeOnboarding } from "./onboarding";
import type { getProgrammePortal, getProgrammeWeek } from "@/lib/programmes/content-service";
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
        <h1 className="text-3xl">{p?.title || "Your programme"}</h1>
        {error && <p role="alert">{error}</p>}
        {!p && !error && <p role="status">Loading programme…</p>}
        {p && (
          <>
            <p>
              {p.state.replaceAll("_", " ")} · <When value={p.startsAt} />
            </p>
            {!p.accessible ? (
              <div className={panelClass}>
                <h2>Programme history</h2>
                <p>Your enrolment is recorded. Protected programme access has ended.</p>
              </div>
            ) : (
              <>
                <Link className="underline" href={`${base}/onboarding`}>
                  Onboarding checklist
                </Link>
                <nav aria-label="Programme" className="flex flex-wrap gap-4 border-b py-3">
                  {["Home", "Weeks", "Live", "Community", "Resources"].map((label) => (
                    <Link
                      key={label}
                      aria-current={section === label.toLowerCase() ? "page" : undefined}
                      className="underline underline-offset-4"
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
                    <ol aria-label="Programme weeks" className="flex flex-wrap gap-3">
                      {p.weeks.map((w) => (
                        <li key={w.id}>Week {w.number}</li>
                      ))}
                    </ol>
                    {p.currentWeek && <ProgrammeWeekView id={id} weekId={p.currentWeek} />}
                    <h2 className="text-2xl">Next live session</h2>
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
                        <h2 className="text-2xl">Latest from your community</h2>
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
                          <h2>
                            Week {w.number} — {w.title}
                          </h2>
                          {w.released ? (
                            <Link className="underline" href={`${base}/weeks/${w.id}`}>
                              Open week
                            </Link>
                          ) : (
                            <p>
                              Available <When value={w.releasesAt} />
                            </p>
                          )}
                        </article>
                      ))}
                    </div>
                  ))}
                {section === "live" && (
                  <>
                    <p>{p.equipment}</p>
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
                      p.sessions.map((s) => (
                        <article key={s.id} className={panelClass}>
                          <h2>{s.title}</h2>
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
                    <p>
                      Community opens <When value={p.communityOpenAt} />.
                    </p>
                  ))}
                {section === "resources" && (
                  <>
                    <h2 className="text-2xl">Resources</h2>
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
          <h2 className="text-2xl">
            Week {w.number} — {w.title}
          </h2>
          <article className={panelClass}>
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
                  <li key={i}>
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
