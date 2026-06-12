"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "../../components/dashboard-layout";
import { HealthProfilePageSkeleton } from "../../components/dashboard-skeleton";
import { HealthProfileEditor } from "../../components/health-profile-editor";
import { Badge } from "../../components/ui/badge";
import { Calendar, Pencil } from "lucide-react";
import { AppEmptyState, AppPageHeader } from "@/components/app-surface";
import {
  EMPTY_HEALTH_PROFILE,
  HEALTH_CATEGORIES,
  type HealthProfile,
} from "../../data/health-profile-data";
import { useI18n } from "../../lib/use-i18n";
import { useAuth } from "@/context/auth-context";

type LegalAcceptanceResponse = {
  message?: string;
  code?: string;
  requiredAcceptances?: Array<{
    type: string;
  }>;
};

export function HealthProfilePage({ initialProfile }: { initialProfile?: HealthProfile }) {
  const { fmtDate } = useI18n();
  const { user, acceptHealthDataConsent, refreshAccountProfile } = useAuth();
  const [profile, setProfile] = useState<HealthProfile>(initialProfile || EMPTY_HEALTH_PROFILE);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(!initialProfile);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialProfile) return;

    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/me/health-profile", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load health profile.");
        const data = (await res.json()) as HealthProfile;
        if (active) setProfile(data);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load health profile.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [initialProfile]);

  const activeConditions = HEALTH_CATEGORIES.flatMap((cat) =>
    cat.items
      .filter((item) => profile.conditions[item.key])
      .map((item) => ({
        ...item,
        category: cat.title,
        categoryId: cat.id,
      }))
  );

  const handleSave = async (updated: HealthProfile, consentAccepted: boolean) => {
    setError("");
    try {
      if (
        consentAccepted &&
        (!user?.hasConsentedToHealthData || user.needsHealthDataConsentRefresh)
      ) {
        await acceptHealthDataConsent();
      }

      let res = await fetch("/api/me/health-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as LegalAcceptanceResponse | null;
        const requiresHealthDataRefresh =
          res.status === 409 &&
          payload?.code === "LEGAL_ACCEPTANCE_REQUIRED" &&
          payload.requiredAcceptances?.some((item) => item.type === "health_data");

        if (requiresHealthDataRefresh && consentAccepted) {
          await acceptHealthDataConsent();
          res = await fetch("/api/me/health-profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated),
          });
        }
      }

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as LegalAcceptanceResponse | null;
        if (
          res.status === 409 &&
          payload?.code === "LEGAL_ACCEPTANCE_REQUIRED" &&
          payload.requiredAcceptances?.some((item) => item.type === "health_data")
        ) {
          throw new Error(
            "Health data consent is required before saving this profile. Tick the consent box and try again."
          );
        }
        throw new Error(payload?.message || "Failed to save health profile.");
      }

      const next = (await res.json()) as HealthProfile;
      await refreshAccountProfile();
      setProfile(next);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save health profile.");
    }
  };

  const handleConfirmUnchanged = async () => {
    setConfirming(true);
    setError("");
    try {
      if (!user?.hasConsentedToHealthData || user.needsHealthDataConsentRefresh) {
        await acceptHealthDataConsent();
      }

      const res = await fetch("/api/me/health-profile", {
        method: "POST",
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as LegalAcceptanceResponse | null;
        if (
          res.status === 409 &&
          payload?.code === "LEGAL_ACCEPTANCE_REQUIRED" &&
          payload.requiredAcceptances?.some((item) => item.type === "health_data")
        ) {
          throw new Error(
            "Health data consent is required before confirming your health declaration."
          );
        }
        throw new Error(payload?.message || "Failed to confirm health declaration.");
      }
      const next = (await res.json()) as HealthProfile;
      setProfile(next);
      await refreshAccountProfile();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to confirm health declaration.");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Health Profile - Private Studio">
        <HealthProfilePageSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Health Profile - Private Studio">
      <div className="space-y-6">
        <AppPageHeader
          eyebrow="Health and safety"
          title="Health Profile"
          description="Help Shruti understand your body so sessions can be tailored for you."
          meta={
            <p className="max-w-xl text-sm leading-relaxed">
              The health information you share is used to assess suitability, tailor training and
              deliver sessions safely.
            </p>
          }
          actions={
            !editing ? (
              <button
                onClick={() => setEditing(true)}
                className="mt-1 flex items-center gap-1.5 rounded-full border border-white/16 bg-white/8 px-3 py-2 text-sm font-medium text-[rgba(250,250,248,0.96)] transition-colors hover:bg-white/14 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            ) : null
          }
          className="mb-2"
        />

        <div className="max-w-5xl">
          {!editing && profile.needsReview ? (
            <div className="mb-6 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-amber-900">Please review your health declaration.</p>
                <p className="mt-1 text-xs text-amber-800">
                  Confirm that nothing has changed, or update it to capture new injuries, flares, or
                  recovery changes.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => void handleConfirmUnchanged()}
                  disabled={confirming}
                  className="rounded-full border border-amber-300 bg-white px-3 py-2 text-sm text-amber-900 transition-colors hover:bg-amber-100 disabled:opacity-60"
                >
                  {confirming ? "Confirming..." : "Nothing has changed"}
                </button>
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-full border border-amber-300 bg-amber-100 px-3 py-2 text-sm text-amber-900 transition-colors hover:bg-amber-200"
                >
                  Update declaration
                </button>
              </div>
            </div>
          ) : null}

          {profile.lastUpdated && !editing && (
            <p className="text-muted-foreground mb-6 flex items-center gap-1.5 text-xs">
              <Calendar className="h-3 w-3" />
              Last updated {fmtDate(profile.lastUpdated)}
            </p>
          )}

          {editing ? (
            <div className="mt-6">
              <HealthProfileEditor
                profile={profile}
                onSave={handleSave}
                initialConsentAccepted={Boolean(user?.hasConsentedToHealthData)}
              />
              <button
                onClick={() => setEditing(false)}
                className="text-muted-foreground hover:text-foreground mt-3 text-sm transition-colors"
              >
                Cancel
              </button>
              {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {profile.declarationStatus === "none_declared" ? (
                <AppEmptyState
                  title="Nothing relevant is recorded right now."
                  description="If that changes, update this declaration before your next class so sessions can be adapted safely."
                  action={
                    <button
                      onClick={() => setEditing(true)}
                      className="text-brand-accent text-sm hover:underline"
                    >
                      Review declaration
                    </button>
                  }
                  className="py-10"
                />
              ) : activeConditions.length === 0 && !profile.additionalNotes ? (
                <AppEmptyState
                  title="No health declaration recorded yet."
                  description="Complete your declaration so booking and join flows can use the right prompts."
                  action={
                    <button
                      onClick={() => setEditing(true)}
                      className="text-brand-accent text-sm hover:underline"
                    >
                      Complete declaration
                    </button>
                  }
                  className="py-10"
                />
              ) : (
                <>
                  {HEALTH_CATEGORIES.map((cat) => {
                    const catConditions = activeConditions.filter((c) => c.categoryId === cat.id);
                    if (catConditions.length === 0) return null;

                    return (
                      <div key={cat.id} className="space-y-3 rounded-lg border p-4">
                        <h3 className="text-muted-foreground text-sm">{cat.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          {catConditions.map((condition) => (
                            <div key={condition.key}>
                              <Badge
                                variant="outline"
                                className="text-foreground border-brand-accent/20 bg-brand-accent/5"
                              >
                                {condition.label}
                              </Badge>
                              {profile.details[condition.key] && (
                                <p className="text-muted-foreground mt-1 ml-1 max-w-sm text-xs">
                                  {profile.details[condition.key]}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {profile.additionalNotes && (
                    <div className="space-y-2 rounded-lg border p-4">
                      <h3 className="text-muted-foreground text-sm">Additional notes</h3>
                      <p className="text-sm leading-relaxed">{profile.additionalNotes}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {!editing && error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        </div>
      </div>
    </DashboardLayout>
  );
}
