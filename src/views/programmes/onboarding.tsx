"use client";
import { DelayedProgrammeLoading } from "./loading";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HealthProfileEditor } from "@/components/health-profile-editor";
import { normalizeHealthProfile } from "@/data/health-profile-data";
import type { HealthProfile } from "@/data/health-profile-data";
import { useAuth } from "@/context/auth-context";
import { useProgrammeData, programmeRequest, panelClass } from "./shared";
import type { programmeAccess } from "@/lib/programmes/access";
import { StatusPill, eyebrow } from "./visuals";
import { clearanceLabels } from "@/lib/programmes/policy";
type Onboarding = {
  status: string;
  healthRevision: string | null;
  health: HealthProfile;
  agreementVersion: string;
  refundWording: string;
  agreements: Awaited<ReturnType<typeof programmeAccess>>["agreements"];
};
export function ProgrammeOnboarding({ id, event = false }: { id: string; event?: boolean }) {
  const endpoint = event
    ? `/api/me/events/${id}/onboarding`
    : `/api/me/programmes/${id}/onboarding`;
  const { data, error, reload } = useProgrammeData<Onboarding>(endpoint);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const { acceptHealthDataConsent } = useAuth();
  async function save(profile: HealthProfile, consent: boolean) {
    if (consent) await acceptHealthDataConsent();
    const response = await fetch("/api/me/health-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    if (!response.ok) throw new Error("Please check your health information and consent.");
    setEditing(false);
    reload();
  }
  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <p className={eyebrow}>Before you begin</p>
        <h2 className="text-3xl">Onboarding</h2>
        <p className="text-muted-foreground">
          A few practical steps so you can take part with confidence.
        </p>
      </div>
      {!data && !error && <DelayedProgrammeLoading label="Loading onboarding" />}
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {data && (
        <>
          <ul className="bg-secondary [&>li]:bg-background grid gap-3 rounded-2xl p-5 sm:grid-cols-2 [&>li]:rounded-xl [&>li]:p-4">
            <li>Account activated — complete</li>
            <li>
              Health confirmation and review —{" "}
              <StatusPill>
                {clearanceLabels[data.status as keyof typeof clearanceLabels] || data.status}
              </StatusPill>
            </li>
            <li>
              Required agreements —{" "}
              {data.agreements.every((a) => a.isCurrent) ? "Complete" : "Not started"}
            </li>
            {!event && (
              <li>
                <a className="underline" href={`/api/me/programmes/${id}/calendar`}>
                  Add all live sessions to your calendar (.ics)
                </a>
              </li>
            )}
            {!event && (
              <li>
                <Link className="underline" href={`/dashboard/programmes/${id}/community`}>
                  Introduce yourself when community opens
                </Link>
              </li>
            )}
          </ul>
          <article className={panelClass}>
            <h3>Your current health information</h3>
            <p>
              You only need to update information that has changed. Confirm it separately for this
              offering.
            </p>
            {editing ? (
              <HealthProfileEditor profile={normalizeHealthProfile(data.health)} onSave={save} />
            ) : (
              <>
                <p>
                  {data.health.declarationStatus === "incomplete"
                    ? "Please complete your health questionnaire."
                    : "Use the button below to review your current health profile."}
                </p>
                <Button onClick={() => setEditing(true)}>
                  Review or update health questionnaire
                </Button>
              </>
            )}
          </article>
          <form
            className={panelClass}
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await programmeRequest(endpoint, {
                  healthConfirmed: true,
                  healthRevision: data.healthRevision,
                  agreementVersion: data.agreementVersion,
                  acceptances: data.agreements.map((a) => ({
                    type: a.type,
                    policyVersionId: a.policyVersionId,
                    version: a.currentVersion,
                    acknowledged: true,
                  })),
                });
                setMessage("Your confirmation is saved and is waiting for your coach's clearance.");
                reload();
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "Unable to save");
              }
            }}
          >
            <h3>Confirm your information and agreements</h3>
            <p className="whitespace-pre-wrap">{data.refundWording}</p>
            <label className="flex gap-3">
              <input type="checkbox" required />I have reviewed my health information and confirm it
              is accurate for this offering.
            </label>
            <label className="flex gap-3">
              <input type="checkbox" required />
              <span>
                I accept the{" "}
                <Link href="/terms" className="underline">
                  terms
                </Link>
                ,{" "}
                <Link href="/health-declaration" className="underline">
                  exercise participation waiver
                </Link>
                ,{" "}
                <Link href="/privacy" className="underline">
                  health-data consent
                </Link>{" "}
                and programme agreements shown above.
              </span>
            </label>
            <Button type="submit" disabled={!data.healthRevision}>
              Confirm health information and agreements
            </Button>
          </form>
        </>
      )}
    </section>
  );
}
