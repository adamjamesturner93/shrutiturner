"use client";
import { ProgrammeContentLoading } from "./loading";
import { programmeStateLabels } from "@/lib/programmes/presentation";
import Link from "next/link";
import { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { useProgrammeData, programmeRequest, panelClass, When } from "./shared";
import { eventIsoToWallTime, eventWallTimeToIso } from "@/lib/retreats/event-time";
import type { loadCohort } from "@/lib/programmes/access";
import { StatusPill, eyebrow } from "./visuals";
import { clearanceLabels } from "@/lib/programmes/policy";
type Wire<T> = T extends Date
  ? string
  : T extends Array<infer U>
    ? Wire<U>[]
    : T extends object
      ? { [K in keyof T]: Wire<T[K]> }
      : T;
type Cohort = Wire<Awaited<ReturnType<typeof loadCohort>>>;
type AdminData = {
  cohort: Cohort;
  confirmationDue: boolean;
  participants: {
    id: string;
    userId: string | null;
    attendeeName: string;
    attendeeEmail: string;
    paidAt: string | null;
    status: string;
    acceptedAgreementVersion: string | null;
    refundStatus: string | null;
    creditRedeemedAt: string | null;
    user: {
      emailVerified: string | null;
      healthProfile: {
        lastUpdatedAt: string;
        declarationStatus: string;
        additionalNotes: string;
        selections: { conditionKey: string; detail: string | null }[];
      } | null;
    } | null;
  }[];
  clearances: {
    id: string;
    userId: string;
    status: string;
    healthRevision: string | null;
    considerations: string;
  }[];
};
const text = (f: FormData, key: string) => String(f.get(key) || "");
const number = (f: FormData, key: string) => (f.get(key) === "" ? null : Number(f.get(key)));
const inputClass =
  "mt-2 block min-h-11 w-full rounded-lg border border-brand-dark/20 bg-background px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
export function ProgrammeAdmin({ id }: { id: string }) {
  const endpoint = `/api/admin/programmes/cohorts/${id}`;
  const { data, error, reload } = useProgrammeData<AdminData>(endpoint);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  async function save(action: string, body: unknown) {
    if (saving) return;
    setSaving(true);
    setMessage("");
    try {
      const result = await programmeRequest<unknown>(`${endpoint}/${action}`, body);
      setMessage(
        Array.isArray(result)
          ? result
              .map((r: { cleared: boolean; reason?: string }) => (r.cleared ? "Cleared" : r.reason))
              .join("; ")
          : "Saved"
      );
      reload();
      if (action === "clearance") setSelected([]);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save");
    } finally {
      setSaving(false);
    }
  }
  const c = data?.cohort;
  return (
    <AdminLayout title="Programme cohort">
      <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
        <Link
          className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
          href="/admin/programmes"
        >
          ← All programmes
        </Link>
        <header className="bg-brand-dark rounded-[1.75rem] p-6 text-white md:p-8">
          <p className="text-brand-accent-light mb-3 text-xs tracking-[0.24em] uppercase">
            Cohort management
          </p>
          <h1 className="text-3xl">{c?.title || "Programme cohort"}</h1>
          {c && (
            <div className="mt-4 flex flex-wrap gap-3">
              <StatusPill>{programmeStateLabels[c.cohortState || "draft"]}</StatusPill>
              <span className="text-sm text-white/80">
                {c.publicVisibility === "hidden"
                  ? "Hidden from public discovery"
                  : c.publicVisibility === "coming_soon"
                    ? "Coming soon on the website"
                    : "Listed on the website"}
              </span>
            </div>
          )}
        </header>
        {!data && !error && <ProgrammeContentLoading label="Loading cohort administration" />}
        {saving && <p role="status">Saving changes…</p>}
        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
        {c && data && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                [
                  "Paid participants",
                  data.participants.filter((p) => p.paidAt && p.status === "active").length,
                  `Minimum ${c.minimumParticipants}`,
                ],
                [
                  "Ready for clearance",
                  data.clearances.filter((r) => r.status === "ready").length,
                  "Review and clear eligible participants",
                ],
                [
                  "Individual review",
                  data.clearances.filter((r) => r.status === "pending_review").length,
                  "Review flagged health information individually",
                ],
              ].map(([label, count, hint]) => (
                <div key={label} role="group" aria-label={String(label)} className={panelClass}>
                  <p className={eyebrow}>{label}</p>
                  <p className="text-3xl font-semibold">{count}</p>
                  <p className="text-muted-foreground text-sm">{hint}</p>
                </div>
              ))}
            </div>
            <nav
              aria-label="Cohort sections"
              className="bg-secondary flex flex-wrap gap-2 rounded-2xl p-2"
            >
              {[
                ["participants", "Participants"],
                ["presentation", "Public page"],
                ["settings", "Settings & dates"],
                ["sessions", "Live sessions"],
                ["content", "Weekly content"],
                ["cancellation", "Cancellation & refunds"],
              ].map(([anchor, label]) => (
                <a
                  key={anchor}
                  href={`#${anchor}`}
                  onClick={() => {
                    const target = document.getElementById(anchor);
                    if (target instanceof HTMLDetailsElement) target.open = true;
                  }}
                  className="hover:bg-background rounded-xl px-4 py-3 text-sm font-medium"
                >
                  {label}
                </a>
              ))}
            </nav>
            {data.confirmationDue && (
              <p role="status">
                Confirmation decision due. Confirm this cohort, including below minimum if
                appropriate, or cancel.
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Link className="underline" href={`/dashboard/programmes/${id}`}>
                Preview participant portal
              </Link>
              <Link className="underline" href={`/programmes/${c.runSlug}?preview=1`}>
                Preview sales page
              </Link>
              <Button onClick={() => save("publish", {})}>Open sales</Button>
              <Button variant="outline" onClick={() => save("confirm", {})}>
                Confirm cohort
              </Button>
            </div>
            <details id="presentation" className={panelClass}>
              <summary>Public programme presentation</summary>
              <p>
                Publish a teaser before launch, or list a launch-ready cohort. Hidden cohorts are
                available only to staff and enrolled participants.
              </p>
              <form
                key={`${c.id}-${c.publicVisibility}`}
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  void save("presentation", {
                    publicVisibility: text(f, "publicVisibility"),
                    subtitle: text(f, "subtitle"),
                    shortDescription: text(f, "shortDescription"),
                    publicImageUrl: text(f, "publicImageUrl") || null,
                    publicImageAlt: text(f, "publicImageAlt") || null,
                    whoItsForJson: text(f, "whoItsForJson")
                      .split("\n")
                      .map((v) => v.trim())
                      .filter(Boolean),
                    weekByWeekJson: text(f, "weekByWeekJson")
                      .split("\n")
                      .map((v) => v.trim())
                      .filter(Boolean),
                  });
                }}
              >
                <label className="block">
                  Public visibility
                  <select
                    name="publicVisibility"
                    defaultValue={c.publicVisibility}
                    className={inputClass}
                  >
                    <option value="hidden">Hidden</option>
                    <option value="coming_soon">Coming soon</option>
                    <option value="listed">Listed</option>
                  </select>
                </label>
                {[
                  ["subtitle", "Subtitle"],
                  ["shortDescription", "Short introduction"],
                  ["publicImageUrl", "Image URL (HTTPS)"],
                  ["publicImageAlt", "Image description"],
                ].map(([key, label]) => (
                  <label className="block" key={key}>
                    {label}
                    <input
                      className={inputClass}
                      name={key}
                      defaultValue={String(c[key as keyof Cohort] || "")}
                    />
                  </label>
                ))}
                {[
                  ["whoItsForJson", "Who it is for — one statement per line"],
                  ["weekByWeekJson", "Public weekly journey — one title per line"],
                ].map(([key, label]) => (
                  <label className="block" key={key}>
                    {label}
                    <textarea
                      className={inputClass}
                      name={key}
                      defaultValue={
                        Array.isArray(c[key as keyof Cohort])
                          ? (c[key as keyof Cohort] as string[]).join("\n")
                          : ""
                      }
                    />
                  </label>
                ))}
                <Button type="submit">Save public presentation</Button>
              </form>
            </details>
            <section id="participants" className={panelClass}>
              <h2 className="text-2xl">Participants and clearance</h2>
              <Button
                disabled={saving || !selected.length}
                onClick={() =>
                  save("clearance", {
                    entries: data.clearances
                      .filter((r) => selected.includes(r.id))
                      .map((r) => ({ id: r.id, healthRevision: r.healthRevision })),
                    status: "cleared",
                  })
                }
              >
                Review selected ready participants and clear
              </Button>
              <p>
                Only Ready for clearance participants with unchanged, unflagged health information
                can be cleared together.
              </p>
              {data.participants.map((p) => {
                const r = data.clearances.find((r) => r.userId === p.userId);
                return (
                  <article key={p.id} className="space-y-3 border-t pt-4">
                    <h3 className="font-semibold">{p.attendeeName}</h3>
                    <p>
                      {p.attendeeEmail} · Payment: {p.paidAt ? "Paid" : "Pending"} · Account:{" "}
                      {p.user?.emailVerified ? "Activated" : "Not activated"}
                    </p>
                    <p>
                      Health confirmation:{" "}
                      {r?.healthRevision &&
                      r.healthRevision === p.user?.healthProfile?.lastUpdatedAt
                        ? "Complete"
                        : "Not started or changed"}{" "}
                      · Programme agreement:{" "}
                      {p.acceptedAgreementVersion === c.agreementVersion
                        ? "Complete"
                        : "Not started"}{" "}
                      · Clearance:{" "}
                      {r
                        ? clearanceLabels[r.status as keyof typeof clearanceLabels] || r.status
                        : "Pending participant confirmation"}
                    </p>
                    {r?.status === "ready" && (
                      <label className="flex gap-2">
                        <input
                          type="checkbox"
                          checked={selected.includes(r.id)}
                          onChange={(e) =>
                            setSelected(
                              e.target.checked
                                ? [...selected, r.id]
                                : selected.filter((id) => id !== r.id)
                            )
                          }
                        />
                        Include {p.attendeeName} in batch review
                      </label>
                    )}
                    {r && p.user?.healthProfile && (
                      <details>
                        <summary>Individual health review for {p.attendeeName}</summary>
                        <p>{p.user.healthProfile.declarationStatus}</p>
                        <p>{p.user.healthProfile.additionalNotes}</p>
                        <ul>
                          {p.user.healthProfile.selections.map((s) => (
                            <li key={s.conditionKey}>
                              {s.conditionKey}: {s.detail}
                            </li>
                          ))}
                        </ul>
                        <form
                          className="space-y-3"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const f = new FormData(e.currentTarget);
                            void save("clearance", {
                              entries: [{ id: r.id, healthRevision: r.healthRevision }],
                              status: text(f, "status"),
                              considerations: text(f, "considerations"),
                            });
                          }}
                        >
                          <label>
                            Decision
                            <select name="status" className={inputClass}>
                              <option value="cleared">Cleared</option>
                              <option value="cleared_with_considerations">
                                Cleared with considerations
                              </option>
                              <option value="not_cleared">Not currently cleared</option>
                            </select>
                          </label>
                          <label>
                            Considerations
                            <textarea
                              name="considerations"
                              defaultValue={r.considerations}
                              className={inputClass}
                            />
                          </label>
                          <Button type="submit">Save individual clearance</Button>
                        </form>
                      </details>
                    )}
                    {p.refundStatus && (
                      <div>
                        <p>Refund: {p.refundStatus}</p>
                        {p.refundStatus !== "succeeded" && (
                          <Button variant="outline" onClick={() => save(`refund/${p.id}`, {})}>
                            Process or retry refund
                          </Button>
                        )}
                      </div>
                    )}
                    {c.creditActive && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          void save(`credit/${p.id}`, {
                            reference: new FormData(e.currentTarget).get("reference"),
                            service: new FormData(e.currentTarget).get("service"),
                          });
                        }}
                      >
                        <p>
                          Coaching credit:{" "}
                          {p.creditRedeemedAt
                            ? "Redeemed"
                            : c.creditEndsAt && new Date(c.creditEndsAt) < new Date()
                              ? "Expired"
                              : "Eligible"}
                        </p>
                        <label>
                          Eligible coaching service
                          <select name="service" className={inputClass}>
                            {c.creditServices.map((s) => (
                              <option value={s} key={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Coaching reference
                          <input name="reference" className={inputClass} />
                        </label>
                        <Button type="submit" disabled={Boolean(p.creditRedeemedAt)}>
                          Mark credit redeemed
                        </Button>
                      </form>
                    )}
                  </article>
                );
              })}
            </section>
            <details id="settings" className={panelClass}>
              <summary>Programme settings and dates</summary>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  const dates = Object.fromEntries(
                    [
                      "startDate",
                      "liveCoachingEndsAt",
                      "structuredProgrammeEndsAt",
                      "followUpAccessEndsAt",
                      "confirmationDeadline",
                      "communityOpenAt",
                      "enrolmentClosesAt",
                    ].map((key) => [key, eventWallTimeToIso(text(f, key), c.timezone)])
                  );
                  void save("settings", {
                    ...dates,
                    resourcesJson: Array.from({ length: 6 }, (_, i) => ({
                      title: text(f, `resourceTitle${i}`),
                      body: text(f, `resourceBody${i}`),
                    })).filter((r) => r.title),
                    title: text(f, "title"),
                    salesCopy: text(f, "salesCopy"),
                    equipment: text(f, "equipment"),
                    refundWording: text(f, "refundWording"),
                    salePricePence:
                      number(f, "price") === null ? null : Math.round(Number(f.get("price")) * 100),
                    maximumParticipants: number(f, "maximumParticipants"),
                    minimumParticipants: number(f, "minimumParticipants"),
                    enrolmentOpen: f.has("enrolmentOpen"),
                    closingBody: text(f, "closingBody"),
                    closingVideoUrl: text(f, "closingVideoUrl") || null,
                    reminder24h: f.has("reminder24h"),
                    reminder1h: f.has("reminder1h"),
                    creditActive: f.has("creditActive"),
                    creditAmountPence:
                      number(f, "creditAmount") === null
                        ? null
                        : Math.round(Number(f.get("creditAmount")) * 100),
                    creditStartsAt: text(f, "creditStartsAt")
                      ? eventWallTimeToIso(text(f, "creditStartsAt"), c.timezone)
                      : null,
                    creditEndsAt: text(f, "creditEndsAt")
                      ? eventWallTimeToIso(text(f, "creditEndsAt"), c.timezone)
                      : null,
                    creditServices: text(f, "creditServices")
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  });
                }}
              >
                <label>
                  Cohort title
                  <input name="title" defaultValue={c.title} className={inputClass} />
                </label>
                {[
                  ["salesCopy", "Sales description"],
                  ["equipment", "Equipment requirements"],
                  ["refundWording", "Refund and cancellation wording"],
                  ["closingBody", "What Next? content"],
                ].map(([key, label]) => (
                  <label className="block" key={key}>
                    {label}
                    <textarea
                      name={key}
                      defaultValue={String(c[key as keyof Cohort] || "")}
                      className={inputClass}
                    />
                  </label>
                ))}
                <label className="block">
                  Price (£)
                  <input
                    name="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    defaultValue={c.salePricePence ? c.salePricePence / 100 : ""}
                    className={inputClass}
                  />
                </label>
                {["maximumParticipants", "minimumParticipants"].map((key) => (
                  <label key={key} className="block">
                    {key === "maximumParticipants"
                      ? "Maximum participants"
                      : "Minimum participants"}
                    <input
                      name={key}
                      type="number"
                      min="1"
                      defaultValue={String(c[key as keyof Cohort] || "")}
                      className={inputClass}
                    />
                  </label>
                ))}
                {[
                  ["startDate", "Programme start"],
                  ["liveCoachingEndsAt", "Live coaching ends (exclusive)"],
                  ["structuredProgrammeEndsAt", "Structured programme ends (exclusive)"],
                  ["followUpAccessEndsAt", "Access ends (exclusive)"],
                  ["confirmationDeadline", "Confirmation deadline"],
                  ["communityOpenAt", "Community opens"],
                  ["enrolmentClosesAt", "Enrolment closes"],
                  ["creditStartsAt", "Credit eligibility starts"],
                  ["creditEndsAt", "Credit deadline"],
                ].map(([key, label]) => (
                  <label className="block" key={key}>
                    {label} — UK time
                    <input
                      type="datetime-local"
                      name={key}
                      defaultValue={
                        c[key as keyof Cohort]
                          ? eventIsoToWallTime(String(c[key as keyof Cohort]), c.timezone)
                          : ""
                      }
                      className={inputClass}
                    />
                  </label>
                ))}
                {[
                  ["enrolmentOpen", "Enrolment open"],
                  ["reminder24h", "24-hour live reminders"],
                  ["reminder1h", "1-hour live reminders"],
                  ["creditActive", "Alumni credit active"],
                ].map(([key, label]) => (
                  <label className="flex gap-3" key={key}>
                    <input
                      type="checkbox"
                      name={key}
                      defaultChecked={Boolean(c[key as keyof Cohort])}
                    />
                    {label}
                  </label>
                ))}
                <label className="block">
                  Credit amount (£)
                  <input
                    name="creditAmount"
                    type="number"
                    step="0.01"
                    defaultValue={c.creditAmountPence ? c.creditAmountPence / 100 : ""}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  Eligible coaching services (comma separated)
                  <input
                    name="creditServices"
                    defaultValue={c.creditServices.join(", ")}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  What Next? educational video URL
                  <input
                    name="closingVideoUrl"
                    type="url"
                    defaultValue={c.closingVideoUrl || ""}
                    className={inputClass}
                  />
                </label>
                <h3>Programme resources</h3>
                {Array.from({ length: 6 }, (_, i) => {
                  const r = Array.isArray(c.resourcesJson)
                    ? (c.resourcesJson[i] as { title?: string; body?: string })
                    : null;
                  return (
                    <fieldset key={i}>
                      <legend>Resource {i + 1}</legend>
                      <label>
                        Title
                        <input
                          className={inputClass}
                          name={`resourceTitle${i}`}
                          defaultValue={r?.title || ""}
                        />
                      </label>
                      <label>
                        Written guide
                        <textarea
                          className={inputClass}
                          name={`resourceBody${i}`}
                          defaultValue={r?.body || ""}
                        />
                      </label>
                    </fieldset>
                  );
                })}
                <Button type="submit">Save settings</Button>
              </form>
            </details>
            <section className="space-y-4">
              <h2 id="sessions" className="scroll-mt-24 text-2xl">
                Live sessions
              </h2>
              <p className="text-muted-foreground">
                Manage the weekly schedule, teaching availability and recordings.
              </p>
              {c.sessions.map((s) => (
                <details key={s.id} className={panelClass}>
                  <summary>{s.title}</summary>
                  <form
                    className="space-y-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      void save(`sessions/${s.id}`, {
                        title: text(f, "title"),
                        startsAt: eventWallTimeToIso(text(f, "startsAt"), c.timezone),
                        exerciseKeys: text(f, "exerciseKeys")
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      });
                    }}
                  >
                    <label>
                      Session title
                      <input name="title" defaultValue={s.title} className={inputClass} />
                    </label>
                    <label>
                      Starts (UK time, 45 minutes)
                      <input
                        type="datetime-local"
                        name="startsAt"
                        defaultValue={eventIsoToWallTime(s.startsAt, c.timezone)}
                        className={inputClass}
                      />
                    </label>
                    <label>
                      Exercises taught (comma separated identifiers)
                      <input
                        name="exerciseKeys"
                        defaultValue={s.exerciseKeys.join(", ")}
                        className={inputClass}
                      />
                    </label>
                    <Button type="submit">Save session</Button>
                  </form>
                  <Link className="underline" href={`/dashboard/programmes/${id}/live/${s.id}`}>
                    Open live session
                  </Link>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => save(`recording/${s.id}`, { action: "start" })}>
                      Start recording
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => save(`recording/${s.id}`, { action: "stop" })}
                    >
                      Stop recording
                    </Button>
                    <Button variant="outline" onClick={() => save(`teaching/${s.id}`, {})}>
                      Confirm teaching occurred
                    </Button>
                  </div>
                  {s.taughtAt && (
                    <p>
                      Teaching confirmed <When value={s.taughtAt} />
                    </p>
                  )}
                </details>
              ))}
            </section>
            <details className={panelClass}>
              <summary>Add a recording or coach demonstration</summary>
              <p>
                Register a finished recording from the connected Daily account. Participants receive
                a temporary playback link after access checks.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  void save("recordings", {
                    recordingId: text(f, "recordingId"),
                    sessionId: text(f, "sessionId") || undefined,
                    coachDemonstration: f.has("coachDemonstration"),
                  });
                }}
              >
                <label>
                  Daily recording reference
                  <input name="recordingId" required className={inputClass} />
                </label>
                <label>
                  Session
                  <select name="sessionId" className={inputClass}>
                    {c.sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <input type="checkbox" name="coachDemonstration" />
                  This is an authorised standalone coach demonstration
                </label>
                <Button type="submit">Add recording</Button>
              </form>
            </details>
            <section className="space-y-4">
              <h2 id="content" className="scroll-mt-24 text-2xl">
                Weekly content
              </h2>
              <p className="text-muted-foreground">
                Education releases on Monday. Workouts unlock when the required teaching is
                available.
              </p>
              {c.weeks.map((w) => (
                <WeekEditor
                  key={w.id}
                  week={w}
                  cohort={c}
                  save={(body) => save(`weeks/${w.id}`, body)}
                />
              ))}
            </section>
            <details id="cancellation" className={panelClass}>
              <summary>Cancel cohort and track refunds</summary>
              <p>
                This closes sales and participant access and queues cancellation communications.
                Paid places will require refunds.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void save("cancel", { reason: new FormData(e.currentTarget).get("reason") });
                }}
              >
                <label>
                  Cancellation reason
                  <textarea name="reason" required className={inputClass} />
                </label>
                <Button variant="destructive" type="submit">
                  Cancel cohort
                </Button>
              </form>
            </details>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
function WeekEditor({
  week: w,
  cohort: c,
  save,
}: {
  week: Cohort["weeks"][number];
  cohort: Cohort;
  save: (body: unknown) => Promise<void>;
}) {
  const rows = Array.isArray(w.workoutJson)
    ? (w.workoutJson as {
        key: string;
        name: string;
        prescription: string;
        instruction?: string;
        alternatives?: string;
        sessionId?: string;
        demonstrationId?: string;
        timestamp?: number;
      }[])
    : [];
  return (
    <details className={panelClass}>
      <summary>
        Week {w.number} — {w.title}
      </summary>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void save({
            title: text(f, "title"),
            theme: text(f, "theme"),
            education: text(f, "education"),
            videoUrl: text(f, "videoUrl") || null,
            takeaways: text(f, "takeaways").split("\n").filter(Boolean),
            releasesAt: eventWallTimeToIso(text(f, "releasesAt"), c.timezone),
            reflectionAt: eventWallTimeToIso(text(f, "reflectionAt"), c.timezone),
            reflection: text(f, "reflection"),
            published: f.has("published"),
            workoutPublished: f.has("workoutPublished"),
            workoutJson: Array.from({ length: Math.max(rows.length + 1, 5) }, (_, i) => ({
              key: text(f, `key${i}`),
              name: text(f, `name${i}`),
              prescription: text(f, `prescription${i}`),
              instruction: text(f, `instruction${i}`),
              alternatives: text(f, `alternatives${i}`),
              sessionId: text(f, `sessionId${i}`) || undefined,
              demonstrationId: text(f, `demonstrationId${i}`) || undefined,
              timestamp: Number(f.get(`timestamp${i}`) || 0),
            })).filter((r) => r.name),
          });
        }}
      >
        {[
          ["title", "Week title"],
          ["theme", "Theme"],
          ["education", "Educational summary/transcript"],
          ["videoUrl", "Educational video URL"],
          ["reflection", "Friday reflection"],
        ].map(([key, label]) => (
          <label className="block" key={key}>
            {label}
            <textarea
              name={key}
              defaultValue={String(w[key as keyof typeof w] || "")}
              className={inputClass}
            />
          </label>
        ))}
        <label className="block">
          Takeaways (one per line)
          <textarea name="takeaways" defaultValue={w.takeaways.join("\n")} className={inputClass} />
        </label>
        {[
          ["releasesAt", "Monday release"],
          ["reflectionAt", "Friday prompt"],
        ].map(([key, label]) => (
          <label key={key} className="block">
            {label} — UK time
            <input
              name={key}
              type="datetime-local"
              defaultValue={eventIsoToWallTime(String(w[key as keyof typeof w]), c.timezone)}
              className={inputClass}
            />
          </label>
        ))}
        <h3>Independent workout exercises</h3>
        <p>Use this week's or earlier taught exercises, or an authorised demonstration.</p>
        {Array.from({ length: Math.max(rows.length + 1, 5) }, (_, i) => (
          <fieldset key={i} className="grid gap-3 rounded border p-3 md:grid-cols-2">
            <legend>Exercise {i + 1}</legend>
            {[
              ["key", "Exercise identifier"],
              ["name", "Exercise name"],
              ["prescription", "Sets/reps/time"],
              ["instruction", "Key instruction"],
              ["alternatives", "Variations"],
              ["demonstrationId", "Authorised demonstration reference"],
              ["timestamp", "Replay timestamp (seconds)"],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  name={`${key}${i}`}
                  defaultValue={String(rows[i]?.[key as keyof (typeof rows)[number]] || "")}
                  className={inputClass}
                />
              </label>
            ))}
            <label>
              Taught in session
              <select
                name={`sessionId${i}`}
                defaultValue={rows[i]?.sessionId || w.sessionId || ""}
                className={inputClass}
              >
                <option value="">Use demonstration</option>
                {c.sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>
        ))}
        <label className="flex gap-2">
          <input type="checkbox" name="published" defaultChecked={w.published} />
          Publish education at release time
        </label>
        <label className="flex gap-2">
          <input type="checkbox" name="workoutPublished" defaultChecked={w.workoutPublished} />
          Publish workout when teaching is available
        </label>
        <Button type="submit">Save week</Button>
      </form>
    </details>
  );
}
