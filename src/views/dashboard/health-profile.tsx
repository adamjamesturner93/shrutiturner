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
    cat.items.filter((item) => profile.conditions[item.key]).map((item) => ({
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
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-3xl">Health Profile</h1>
            <p className="text-muted-foreground mt-1">
              Help Shruti understand your body so sessions can be adapted for
              you.
            </p>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-sm text-[#4B5B32] hover:text-[#4B5B32]/80 transition-colors mt-1"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>

        {profile.lastUpdated && !editing && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
            <Calendar className="w-3 h-3" />
            Last updated{" "}
            {fmtDate(profile.lastUpdated)}
          </p>
        )}

        {editing ? (
          /* Edit mode */
          <div className="mt-6">
            <HealthProfileEditor profile={profile} onSave={handleSave} />
            <button
              onClick={() => setEditing(false)}
              className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          /* View mode */
          <div className="space-y-6 mt-6">
            {activeConditions.length === 0 ? (
              <div className="border rounded-lg p-8 text-center space-y-4">
                <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mx-auto">
                  <Activity className="w-7 h-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-muted-foreground">
                    No conditions recorded yet.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Adding your conditions helps Shruti adapt every session for
                    your body.
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
                  const catConditions = activeConditions.filter(
                    (c) => c.categoryId === cat.id
                  );
                  if (catConditions.length === 0) return null;

                  return (
                    <div
                      key={cat.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <h3 className="text-sm text-muted-foreground">
                        {cat.title}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {catConditions.map((condition) => (
                          <div key={condition.key}>
                            <Badge
                              variant="outline"
                              className="bg-[#4B5B32]/5 border-[#4B5B32]/20 text-foreground"
                            >
                              {condition.label}
                            </Badge>
                            {profile.details[condition.key] && (
                              <p className="text-xs text-muted-foreground mt-1 ml-1 max-w-sm">
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
                  <div className="border rounded-lg p-4 space-y-2">
                    <h3 className="text-sm text-muted-foreground">
                      Additional notes
                    </h3>
                    <p className="text-sm leading-relaxed">
                      {profile.additionalNotes}
                    </p>
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