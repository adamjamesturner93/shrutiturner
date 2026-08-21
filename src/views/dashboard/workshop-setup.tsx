"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { HealthProfileEditor } from "@/components/health-profile-editor";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HealthProfile } from "@/data/health-profile-data";
import type { WorkshopSetupState } from "@/lib/retreats/workshop-setup";

type SetupData = {
  bookingId?: string;
  title: string;
  startsAt: string;
  timezone: string;
  setup: WorkshopSetupState;
};

export function WorkshopSetupPage({
  initialData,
  initialHealthProfile,
  refreshEndpoint,
  continueHref,
  continueLabel = "Open workshop room",
}: {
  initialData: SetupData;
  initialHealthProfile: HealthProfile;
  refreshEndpoint?: string;
  continueHref?: string;
  continueLabel?: string;
}) {
  const [data, setData] = useState(initialData);
  const [firstName, setFirstName] = useState(initialData.setup.profile.firstName);
  const [lastName, setLastName] = useState(initialData.setup.profile.lastName);
  const [dob, setDob] = useState(initialData.setup.profile.dob);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedWaiver, setAcceptedWaiver] = useState(false);
  const [acceptedHealthData, setAcceptedHealthData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = async () => {
    const endpoint = refreshEndpoint || `/api/me/retreats/${data.bookingId}/setup`;
    const response = await fetch(endpoint, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Unable to refresh workshop setup.");
    const payload = (await response.json()) as SetupData;
    setData(payload);
  };

  const saveProfileAndAgreements = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const missing = data.setup.missing;
      if (missing.includes("terms") && !acceptedTerms) throw new Error("Accept the current terms.");
      if (missing.includes("health_waiver") && !acceptedWaiver) {
        throw new Error("Accept the health and liability waiver.");
      }
      if (missing.includes("health_data") && !acceptedHealthData) {
        throw new Error("Accept the health-data consent.");
      }
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          dob,
          hasAgreedToTerms: missing.includes("terms") ? acceptedTerms : undefined,
          hasAgreedToHealth: missing.includes("health_waiver") ? acceptedWaiver : undefined,
          hasConsentedToHealthData: missing.includes("health_data")
            ? acceptedHealthData
            : undefined,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) throw new Error(payload?.message || "Unable to save account details.");
      await refresh();
      setNotice("Account details and agreements saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save setup.");
    } finally {
      setSaving(false);
    }
  };

  const saveHealthProfile = async (profile: HealthProfile, consentAccepted: boolean) => {
    setError("");
    if (!consentAccepted && data.setup.missing.includes("health_data")) {
      throw new Error("Health-data consent is required.");
    }
    if (data.setup.missing.includes("health_data")) {
      const consentResponse = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasConsentedToHealthData: true }),
      });
      if (!consentResponse.ok) throw new Error("Unable to save health-data consent.");
    }
    const response = await fetch("/api/me/health-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    if (!response.ok) throw new Error(payload?.message || "Unable to save your health profile.");
    await refresh();
    setNotice("Health profile saved.");
  };

  const missing = data.setup.missing;

  return (
    <DashboardLayout title="Workshop setup">
      <main className="mx-auto max-w-4xl space-y-6 py-8">
        <header>
          <p className="text-brand-accent text-sm tracking-[0.16em] uppercase">Online workshop</p>
          <h1 className="mt-2 text-3xl">Get ready for {data.title}</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl">
            Complete the items below once. Only the information needed to deliver the workshop
            safely is required.
          </p>
        </header>

        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}
        {notice ? (
          <p
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            {notice}
          </p>
        ) : null}

        {data.setup.complete ? (
          <section className="marketing-panel rounded-[1.5rem] p-6 text-center">
            <CheckCircle2 className="text-brand-accent mx-auto h-10 w-10" />
            <h2 className="mt-3 text-2xl">You&apos;re ready to join</h2>
            <p className="text-muted-foreground mt-2">
              Your workshop profile and agreements are current.
            </p>
            <Button asChild className="mt-5">
              <Link href={continueHref || `/dashboard/retreats/${data.bookingId}/live`}>
                {continueLabel}
              </Link>
            </Button>
          </section>
        ) : (
          <>
            <section className="marketing-panel rounded-[1.5rem] p-6">
              <h2 className="text-2xl">Account and agreements</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="workshop-first-name">First name</Label>
                  <Input
                    id="workshop-first-name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workshop-last-name">Last name</Label>
                  <Input
                    id="workshop-last-name"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workshop-dob">Date of birth</Label>
                  <Input
                    id="workshop-dob"
                    type="date"
                    value={dob}
                    onChange={(event) => setDob(event.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm">
                {missing.includes("terms") ? (
                  <label className="flex items-start gap-3">
                    <Checkbox
                      checked={acceptedTerms}
                      onCheckedChange={(value) => setAcceptedTerms(value === true)}
                    />
                    <span>
                      I agree to the current{" "}
                      <Link className="underline" href="/terms" target="_blank">
                        Terms &amp; Conditions
                      </Link>
                      .
                    </span>
                  </label>
                ) : null}
                {missing.includes("health_waiver") ? (
                  <label className="flex items-start gap-3">
                    <Checkbox
                      checked={acceptedWaiver}
                      onCheckedChange={(value) => setAcceptedWaiver(value === true)}
                    />
                    <span>
                      I agree to the current{" "}
                      <Link className="underline" href="/health-declaration" target="_blank">
                        Health &amp; Liability Waiver
                      </Link>
                      .
                    </span>
                  </label>
                ) : null}
                {missing.includes("health_data") ? (
                  <label className="flex items-start gap-3">
                    <Checkbox
                      checked={acceptedHealthData}
                      onCheckedChange={(value) => setAcceptedHealthData(value === true)}
                    />
                    <span>
                      I consent to the health information I provide being used to deliver the
                      workshop safely.
                    </span>
                  </label>
                ) : null}
              </div>
              <Button
                className="mt-5"
                onClick={() => void saveProfileAndAgreements()}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save account details"}
              </Button>
            </section>

            {missing.includes("health_profile") ? (
              <section className="marketing-panel rounded-[1.5rem] p-6">
                <h2 className="text-2xl">Health profile</h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  Share relevant context or confirm that there is nothing relevant to declare.
                </p>
                <div className="mt-5">
                  <HealthProfileEditor
                    profile={initialHealthProfile}
                    onSave={saveHealthProfile}
                    compact
                    requireConsentAcknowledgement={missing.includes("health_data")}
                    initialConsentAccepted={!missing.includes("health_data")}
                  />
                </div>
              </section>
            ) : null}
          </>
        )}
      </main>
    </DashboardLayout>
  );
}
