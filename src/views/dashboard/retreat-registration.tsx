"use client";
import { useState } from "react";
import type { HealthProfile } from "@/data/health-profile-data";
import type { getOwnRetreatRegistration } from "@/lib/retreats/registration-service";
import { WorkshopSetupPage } from "@/views/dashboard/workshop-setup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Data = Awaited<ReturnType<typeof getOwnRetreatRegistration>>;
export function RetreatRegistration({
  initialData,
  healthProfile,
}: {
  initialData: Data;
  healthProfile: HealthProfile;
}) {
  const [data, setData] = useState(initialData);
  const [practical, setPractical] = useState(data.practical);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  async function save() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/me/retreat-registrations/${data.attendeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...practical, confirmed }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error?.message || result.message || "Unable to save registration.");
      setData(result.data);
      setDirty(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save registration.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <WorkshopSetupPage
      initialData={data}
      initialHealthProfile={healthProfile}
      refreshEndpoint={`/api/me/retreat-registrations/${data.attendeeId}`}
      eventLabel={data.residential ? "Retreat registration" : "Workshop registration"}
      completionBlocked={dirty || !data.linked || (data.residential && !data.practicalConfirmedAt)}
      continueHref={
        data.residential ? "/dashboard/retreats" : `/dashboard/retreats/${data.bookingId}/live`
      }
      continueLabel={data.residential ? "Back to my retreats" : "Open workshop room"}
    >
      <section className="marketing-panel rounded-3xl p-6">
        <h2 className="text-2xl">Your registration</h2>
        <p className="text-muted-foreground mt-2">
          Only you and authorised staff can see the private details you provide here. The purchaser
          can see whether your registration is complete.
        </p>
        {data.residential ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {(
              [
                ["phone", "Your phone"],
                ["emergencyContactName", "Emergency contact name"],
                ["emergencyContactPhone", "Emergency contact phone"],
                ["dietaryRequirements", "Dietary requirements (leave blank if none)"],
                ["mobilityNeeds", "Access or mobility needs (leave blank if none)"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={practical[key]}
                  onChange={(event) => {
                    setPractical({ ...practical, [key]: event.target.value });
                    setConfirmed(false);
                    setDirty(true);
                  }}
                />
              </div>
            ))}
          </div>
        ) : null}
        {data.residential ? (
          <label className="mt-5 flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            These are my details and I confirm they are current.
          </label>
        ) : null}
        <Button
          className="mt-4"
          onClick={() => void save()}
          disabled={saving || (data.residential && !confirmed)}
        >
          {saving ? "Saving…" : data.residential ? "Save my registration details" : "Link my place"}
        </Button>
        {data.practicalConfirmedAt && !dirty ? (
          <p role="status" className="mt-3">
            Practical details confirmed.
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-destructive mt-3">
            {error}
          </p>
        ) : null}
      </section>
    </WorkshopSetupPage>
  );
}
