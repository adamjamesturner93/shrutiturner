"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "../../components/dashboard-layout";
import { HealthProfileEditor } from "../../components/health-profile-editor";
import { Badge } from "../../components/ui/badge";
import { Calendar, Pencil, Activity } from "lucide-react";
import {
  EMPTY_HEALTH_PROFILE,
  HEALTH_CATEGORIES,
  type HealthProfile,
} from "../../data/health-profile-data";
import { useI18n } from "../../lib/use-i18n";
import { useAuth } from "@/context/auth-context";

export function HealthProfilePage() {
  const { fmtDate } = useI18n();
  const { user, acceptHealthDataConsent, refreshAccountProfile } = useAuth();
  const [profile, setProfile] = useState<HealthProfile>(EMPTY_HEALTH_PROFILE);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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
  }, []);

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
      const res = await fetch("/api/me/health-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("Failed to save health profile.");
      const next = (await res.json()) as HealthProfile;
      if (consentAccepted && !user?.hasConsentedToHealthData) {
        await acceptHealthDataConsent();
        await refreshAccountProfile();
      }
      setProfile(next);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save health profile.");
    }
  };

  return (
    <DashboardLayout title="Health Profile - Private Studio">
      <div className="max-w-2xl">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h1 className="text-3xl">Health Profile</h1>
            <p className="text-muted-foreground mt-1">
              Help Shruti understand your body so sessions can be adapted for you.
            </p>
            <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-relaxed">
              The health information you share is used to assess suitability, tailor training, and
              deliver sessions safely.
            </p>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-brand-accent hover:text-brand-accent/80 mt-1 flex items-center gap-1.5 text-sm transition-colors"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
          )}
        </div>

        {profile.lastUpdated && !editing && (
          <p className="text-muted-foreground mb-6 flex items-center gap-1.5 text-xs">
            <Calendar className="h-3 w-3" />
            Last updated {fmtDate(profile.lastUpdated)}
          </p>
        )}

        {loading ? (
          <p className="text-muted-foreground mt-6 text-sm">Loading health profile...</p>
        ) : editing ? (
          /* Edit mode */
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
          /* View mode */
          <div className="mt-6 space-y-6">
            {activeConditions.length === 0 ? (
              <div className="space-y-4 rounded-lg border p-8 text-center">
                <div className="bg-secondary mx-auto flex h-14 w-14 items-center justify-center rounded-full">
                  <Activity className="text-muted-foreground h-7 w-7" />
                </div>
                <div>
                  <p className="text-muted-foreground">No conditions recorded yet.</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Adding your conditions helps Shruti adapt every session for your body.
                  </p>
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="text-brand-accent text-sm hover:underline"
                >
                  Add your conditions
                </button>
              </div>
            ) : (
              <>
                {/* Grouped by category */}
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

                {/* Additional notes */}
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
    </DashboardLayout>
  );
}
