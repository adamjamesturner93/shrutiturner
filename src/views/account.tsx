"use client";

import { DashboardLayout } from "../components/dashboard-layout";
import { useAuth } from "../context/auth-context";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Shield,
  Bell,
  LogOut,
  HeartPulse,
  Globe,
  Calendar,
  Info,
  Check,
  History,
  Settings,
} from "lucide-react";
import { getTimezoneOptions } from "../lib/date-i18n";
import type { AccountDto, DashboardSummaryDto } from "@/lib/api/types";

const UNANSWERED_VALUE = "__unanswered__";
const PREFER_NOT_TO_SAY_VALUE = "prefer_not_to_say";

const GENDER_OPTIONS = [
  { value: UNANSWERED_VALUE, label: "Not answered" },
  { value: PREFER_NOT_TO_SAY_VALUE, label: "Prefer not to say" },
  { value: "Female", label: "Female" },
  { value: "Male", label: "Male" },
  { value: "Non-binary", label: "Non-binary" },
  { value: "Other", label: "Other" },
];

const ETHNICITY_OPTIONS = [
  { value: UNANSWERED_VALUE, label: "Not answered" },
  { value: PREFER_NOT_TO_SAY_VALUE, label: "Prefer not to say" },
  { value: "Asian", label: "Asian or Asian British" },
  { value: "Black", label: "Black, African, Caribbean or Black British" },
  { value: "Mixed", label: "Mixed or multiple ethnic groups" },
  { value: "White", label: "White" },
  { value: "Other", label: "Other ethnic group" },
];

const DATE_FORMAT_OPTIONS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (31/01/2026)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (01/31/2026)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2026-01-31)" },
];

type AccountTab = "profile" | "preferences" | "activity" | "notifications";

const TABS: { key: AccountTab; label: string; icon: typeof User }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "preferences", label: "Preferences", icon: Settings },
  { key: "activity", label: "Activity", icon: History },
  { key: "notifications", label: "Notifications", icon: Bell },
];

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function formatDateForDisplay(dateStr: string, format: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  switch (format) {
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    default:
      return `${day}/${month}/${year}`;
  }
}

function toSelectValue(value: string | null | undefined) {
  return value && value.trim() ? value : UNANSWERED_VALUE;
}

function fromSelectValue(value: string) {
  return value === UNANSWERED_VALUE ? null : value;
}

export function AccountPage() {
  const { logout, acceptTermsAndHealth, refreshAccountProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<AccountTab>("profile");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [ethnicity, setEthnicity] = useState("");
  const [timezone, setTimezone] = useState("Europe/London");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [notifications, setNotifications] = useState({
    classReminders: true,
    scheduleUpdates: true,
    programAnnouncements: true,
    marketingEmails: true,
  });

  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const [hasAgreedToHealth, setHasAgreedToHealth] = useState(false);
  const [termsAgreedAt, setTermsAgreedAt] = useState<string | null>(null);
  const [healthAgreedAt, setHealthAgreedAt] = useState<string | null>(null);

  const [activity, setActivity] = useState<DashboardSummaryDto | null>(null);

  const [profileSaved, setProfileSaved] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [notificationsSaved, setNotificationsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [legalSaving, setLegalSaving] = useState<"terms" | "health" | null>(null);

  const [dobError, setDobError] = useState("");
  const [error, setError] = useState("");
  const [legalError, setLegalError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [accountRes, activityRes] = await Promise.all([
          fetch("/api/me", { cache: "no-store" }),
          fetch("/api/me/dashboard", { cache: "no-store" }),
        ]);

        if (!accountRes.ok) throw new Error("Failed to load account.");
        const data = (await accountRes.json()) as AccountDto;
        if (!active) return;

        setFirstName(data.profile.firstName || "");
        setLastName(data.profile.lastName || "");
        setEmail(data.profile.email || "");
        setDob(data.profile.dob || "");
        setGender(toSelectValue(data.profile.gender));
        setEthnicity(toSelectValue(data.profile.ethnicity));
        setTimezone(data.profile.timezone || "Europe/London");
        setDateFormat(data.profile.dateFormat || "DD/MM/YYYY");
        setHasAgreedToTerms(data.profile.hasAgreedToTerms);
        setHasAgreedToHealth(data.profile.hasAgreedToHealth);
        setTermsAgreedAt(data.profile.termsAgreedAt);
        setHealthAgreedAt(data.profile.healthAgreedAt);
        setNotifications({
          classReminders: data.notifications.classReminders,
          scheduleUpdates: data.notifications.scheduleUpdates,
          programAnnouncements: data.notifications.programAnnouncements,
          marketingEmails: data.notifications.marketingEmails,
        });

        if (activityRes.ok) {
          const activityData = (await activityRes.json()) as DashboardSummaryDto;
          if (active) setActivity(activityData);
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load account.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const handleDobChange = (value: string) => {
    setDob(value);
    setDobError("");
    if (value && calculateAge(value) < 18) {
      setDobError(
        "You must be 18 or over to use this service. Shruti's insurance covers adults only."
      );
    }
  };

  const handleProfileSave = async () => {
    if (dob && calculateAge(dob) < 18) {
      setDobError(
        "You must be 18 or over to use this service. Shruti's insurance covers adults only."
      );
      return;
    }

    setError("");
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          dob: dob || null,
          gender: fromSelectValue(gender),
          ethnicity: fromSelectValue(ethnicity),
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(payload.message || "Failed to save profile.");
      }
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save profile.");
    }
  };

  const handleLegalAcceptance = async (type: "terms" | "health") => {
    setLegalSaving(type);
    setLegalError("");
    setError("");

    try {
      await acceptTermsAndHealth(type === "terms", type === "health");
      await refreshAccountProfile();

      const accountRes = await fetch("/api/me", { cache: "no-store" });
      if (!accountRes.ok) {
        throw new Error("Failed to refresh agreement status.");
      }

      const data = (await accountRes.json()) as AccountDto;
      setHasAgreedToTerms(data.profile.hasAgreedToTerms);
      setHasAgreedToHealth(data.profile.hasAgreedToHealth);
      setTermsAgreedAt(data.profile.termsAgreedAt);
      setHealthAgreedAt(data.profile.healthAgreedAt);
    } catch (e) {
      setLegalError(e instanceof Error ? e.message : "Failed to update legal agreements.");
    } finally {
      setLegalSaving(null);
    }
  };

  const handlePrefsSave = async () => {
    setError("");
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone, dateFormat }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(payload.message || "Failed to save preferences.");
      }
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save preferences.");
    }
  };

  const handleNotificationsSave = async () => {
    setError("");
    try {
      const res = await fetch("/api/me/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifications),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(payload.message || "Failed to update notification preferences.");
      }
      setNotificationsSaved(true);
      setTimeout(() => setNotificationsSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update notification preferences.");
    }
  };

  const currentTimePreview = new Date().toLocaleString("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: dateFormat === "MM/DD/YYYY",
  });

  const currentDatePreview = formatDateForDisplay(new Date().toISOString(), dateFormat);

  return (
    <DashboardLayout title="Account - Shruti Turner">
      <h1 className="mb-2 text-3xl">Account Settings</h1>
      <p className="text-muted-foreground mb-6">
        Manage your profile, preferences, and notifications.
      </p>
      {loading ? <p className="text-muted-foreground mb-6 text-sm">Loading account...</p> : null}
      {error ? <p className="mb-6 text-sm text-red-600">{error}</p> : null}

      <div className="mb-8 flex gap-1 overflow-x-auto border-b">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-4 py-2.5 text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {tab.label}
              </span>
              {activeTab === tab.key ? (
                <span className="bg-primary absolute right-0 bottom-0 left-0 h-0.5" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="max-w-2xl">
        {activeTab === "profile" ? (
          <div className="space-y-8">
            <div className="bg-background space-y-5 rounded-lg border p-6">
              <div className="mb-2 flex items-center gap-3">
                <User className="text-primary h-5 w-5" />
                <h2 className="text-xl">Personal Details</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} readOnly disabled />
                <p className="text-muted-foreground text-xs">
                  Your sign-in email is fixed here because it is linked to billing and account
                  records.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={dob}
                  onChange={(e) => handleDobChange(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className={dobError ? "border-red-500" : ""}
                />
                {dobError ? (
                  <p className="flex items-start gap-1.5 text-sm text-red-600">
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    {dobError}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Required for insurance purposes. You must be 18 or over.
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gender">
                    Gender <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Not answered" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ethnicity">
                    Ethnicity <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <Select value={ethnicity} onValueChange={setEthnicity}>
                    <SelectTrigger id="ethnicity">
                      <SelectValue placeholder="Not answered" />
                    </SelectTrigger>
                    <SelectContent>
                      {ETHNICITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handleProfileSave} disabled={!!dobError}>
                  Save Profile
                </Button>
                {profileSaved ? (
                  <span className="text-brand-accent flex items-center gap-1 text-sm">
                    <Check className="h-4 w-4" />
                    Saved
                  </span>
                ) : null}
              </div>
            </div>

            <div className="bg-background space-y-4 rounded-lg border p-6">
              <div className="mb-2 flex items-center gap-3">
                <HeartPulse className="text-primary h-5 w-5" />
                <h2 className="text-xl">Health Profile</h2>
              </div>
              <p className="text-muted-foreground text-sm">
                Keep your health conditions up to date so sessions can be adapted for your body.
              </p>
              <Link href="/dashboard/health">
                <Button variant="outline">View & Edit Health Profile</Button>
              </Link>
            </div>

            <div className="bg-background space-y-4 rounded-lg border p-6">
              <div className="mb-2 flex items-center gap-3">
                <Shield className="text-primary h-5 w-5" />
                <h2 className="text-xl">Privacy & Legal</h2>
              </div>

              {!hasAgreedToTerms || !hasAgreedToHealth ? (
                <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm text-amber-800">
                    You still need to accept required agreements.
                  </p>
                  {legalError ? <p className="text-sm text-red-600">{legalError}</p> : null}
                  {!hasAgreedToTerms ? (
                    <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-white p-3">
                      <input
                        type="checkbox"
                        className="accent-brand-accent mt-0.5"
                        disabled={legalSaving !== null}
                        onChange={async (e) => {
                          if (!e.target.checked) return;
                          await handleLegalAcceptance("terms");
                        }}
                      />
                      <span className="text-sm leading-relaxed">
                        I agree to the{" "}
                        <Link href="/terms" className="text-primary underline" target="_blank">
                          Terms & Conditions
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-primary underline" target="_blank">
                          Privacy Policy
                        </Link>
                      </span>
                    </label>
                  ) : null}
                  {!hasAgreedToHealth ? (
                    <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-white p-3">
                      <input
                        type="checkbox"
                        className="accent-brand-accent mt-0.5"
                        disabled={legalSaving !== null}
                        onChange={async (e) => {
                          if (!e.target.checked) return;
                          await handleLegalAcceptance("health");
                        }}
                      />
                      <span className="text-sm leading-relaxed">
                        I agree to the{" "}
                        <Link
                          href="/health-declaration"
                          className="text-primary underline"
                          target="_blank"
                        >
                          Health & Liability Waiver
                        </Link>
                      </span>
                    </label>
                  ) : null}
                </div>
              ) : (
                <div className="border-brand-accent/20 bg-brand-accent/5 space-y-2 rounded-lg border p-4">
                  <div className="text-brand-accent flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4" />
                    Terms accepted{" "}
                    {termsAgreedAt
                      ? `(${new Date(termsAgreedAt).toLocaleDateString("en-GB")})`
                      : ""}
                  </div>
                  <div className="text-brand-accent flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4" />
                    Health & Liability Waiver accepted{" "}
                    {healthAgreedAt
                      ? `(${new Date(healthAgreedAt).toLocaleDateString("en-GB")})`
                      : ""}
                  </div>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <Link href="/terms" className="text-primary block hover:underline">
                  Terms & Conditions
                </Link>
                <Link href="/privacy" className="text-primary block hover:underline">
                  Privacy Policy
                </Link>
                <Link href="/health-declaration" className="text-primary block hover:underline">
                  Health & Liability Waiver
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "preferences" ? (
          <div className="bg-background space-y-5 rounded-lg border p-6">
            <div className="mb-2 flex items-center gap-3">
              <Globe className="text-primary h-5 w-5" />
              <h2 className="text-xl">Regional Preferences</h2>
            </div>
            <p className="text-muted-foreground text-sm">
              These settings control how dates and times appear in schedule and reminders.
            </p>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getTimezoneOptions().map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select value={dateFormat} onValueChange={setDateFormat}>
                <SelectTrigger id="dateFormat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMAT_OPTIONS.map((fmt) => (
                    <SelectItem key={fmt.value} value={fmt.value}>
                      {fmt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-secondary/30 space-y-2 rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="text-primary h-4 w-4" />
                <span className="text-muted-foreground">Preview:</span>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Today's date: </span>
                  {currentDatePreview}
                </p>
                <p>
                  <span className="text-muted-foreground">Current time: </span>
                  {currentTimePreview}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handlePrefsSave}>Save Preferences</Button>
              {prefsSaved ? (
                <span className="text-brand-accent flex items-center gap-1 text-sm">
                  <Check className="h-4 w-4" />
                  Saved
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        {activeTab === "activity" ? (
          <div className="bg-background space-y-4 rounded-lg border p-6">
            <div className="mb-2 flex items-center gap-3">
              <History className="text-primary h-5 w-5" />
              <h2 className="text-xl">Recent Activity</h2>
            </div>
            {!activity ? (
              <p className="text-muted-foreground text-sm">No activity available yet.</p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">Upcoming classes</p>
                    <p className="text-xl">{activity.upcomingClasses.length}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">Booked this week</p>
                    <p className="text-xl">{activity.attendance.thisWeekBookedCount}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">Attended all-time</p>
                    <p className="text-xl">{activity.attendance.attendedCount}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {activity.upcomingClasses.length === 0 ? (
                    <p className="text-muted-foreground py-3 text-sm">
                      No upcoming class activity.
                    </p>
                  ) : (
                    activity.upcomingClasses.slice(0, 10).map((item) => (
                      <div
                        key={item.bookingId}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="text-sm">{item.className}</p>
                          <p className="text-muted-foreground text-xs">
                            {new Date(item.startsAtUtc).toLocaleString("en-GB")}
                          </p>
                        </div>
                        <Badge variant="outline">{item.entitlementType}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        ) : null}

        {activeTab === "notifications" ? (
          <div className="space-y-8">
            <div className="bg-background space-y-4 rounded-lg border p-6">
              <div className="mb-2 flex items-center gap-3">
                <Bell className="text-primary h-5 w-5" />
                <h2 className="text-xl">Class Notifications</h2>
              </div>
              <div className="space-y-3">
                <label className="flex items-center justify-between py-2">
                  <span className="text-sm">Class reminders (2 hours before)</span>
                  <input
                    type="checkbox"
                    checked={notifications.classReminders}
                    onChange={(e) =>
                      setNotifications((prev) => ({ ...prev, classReminders: e.target.checked }))
                    }
                    className="accent-brand-accent"
                  />
                </label>
                <label className="flex items-center justify-between py-2">
                  <span className="text-sm">New class schedule updates</span>
                  <input
                    type="checkbox"
                    checked={notifications.scheduleUpdates}
                    onChange={(e) =>
                      setNotifications((prev) => ({ ...prev, scheduleUpdates: e.target.checked }))
                    }
                    className="accent-brand-accent"
                  />
                </label>
                <label className="flex items-center justify-between py-2">
                  <span className="text-sm">Programme announcements</span>
                  <input
                    type="checkbox"
                    checked={notifications.programAnnouncements}
                    onChange={(e) =>
                      setNotifications((prev) => ({
                        ...prev,
                        programAnnouncements: e.target.checked,
                      }))
                    }
                    className="accent-brand-accent"
                  />
                </label>
              </div>
            </div>

            <div className="bg-background space-y-4 rounded-lg border p-6">
              <div className="mb-2 flex items-center gap-3">
                <Mail className="text-primary h-5 w-5" />
                <h2 className="text-xl">Email Subscriptions</h2>
              </div>
              <div className="space-y-3">
                <label className="flex items-center justify-between py-2">
                  <div>
                    <span className="text-sm">Newsletter & Updates</span>
                    <p className="text-muted-foreground text-xs">
                      Articles, class updates, and training insights
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.marketingEmails}
                    onChange={(e) =>
                      setNotifications((prev) => ({ ...prev, marketingEmails: e.target.checked }))
                    }
                    className="accent-brand-accent"
                  />
                </label>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={handleNotificationsSave}>
                  Update Preferences
                </Button>
                {notificationsSaved ? (
                  <span className="text-brand-accent flex items-center gap-1 text-sm">
                    <Check className="h-4 w-4" />
                    Saved
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="bg-background mt-8 rounded-lg border p-6">
          <Button
            variant="outline"
            onClick={async () => {
              await logout();
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
