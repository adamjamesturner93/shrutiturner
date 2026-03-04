"use client";

import { useState } from "react";
import { DashboardLayout } from "../../components/dashboard-layout";
import { HealthProfileEditor } from "../../components/health-profile-editor";
import { Badge } from "../../components/ui/badge";
import { Calendar, Pencil, Activity } from "lucide-react";
import {
  MOCK_HEALTH_PROFILE,
  HEALTH_CATEGORIES,
  type HealthProfile,
} from "../../data/health-profile-data";
import { useI18n } from "../../lib/use-i18n";

export function HealthProfilePage() {
  const { fmtDate } = useI18n();
  const [profile, setProfile] = useState<HealthProfile>(MOCK_HEALTH_PROFILE);
  const [editing, setEditing] = useState(false);

  const activeConditions = HEALTH_CATEGORIES.flatMap((cat) =>
    cat.items
      .filter((item) => profile.conditions[item.key])
      .map((item) => ({
        ...item,
        category: cat.title,
        categoryId: cat.id,
      }))
  );

  const handleSave = (updated: HealthProfile) => {
    setProfile(updated);
    setEditing(false);
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
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="mt-1 flex items-center gap-1.5 text-sm text-[#4B5B32] transition-colors hover:text-[#4B5B32]/80"
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

        {editing ? (
          /* Edit mode */
          <div className="mt-6">
            <HealthProfileEditor profile={profile} onSave={handleSave} />
            <button
              onClick={() => setEditing(false)}
              className="text-muted-foreground hover:text-foreground mt-3 text-sm transition-colors"
            >
              Cancel
            </button>
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
                  className="text-sm text-[#4B5B32] hover:underline"
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
                              className="text-foreground border-[#4B5B32]/20 bg-[#4B5B32]/5"
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
      </div>
    </DashboardLayout>
  );
}
