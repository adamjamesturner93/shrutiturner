"use client";

import { DashboardLayout } from "../components/dashboard-layout";
import { useAuth } from "../context/auth-context";
import { Button } from "../components/ui/button";
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
import { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { getTimezoneOptions } from "../lib/date-i18n";
import { useI18n } from "../lib/use-i18n";

/* ──────────── Static data ──────────── */

const GENDER_OPTIONS = [
  { value: "", label: "Prefer not to say" },
  { value: "Female", label: "Female" },
  { value: "Male", label: "Male" },
  { value: "Non-binary", label: "Non-binary" },
  { value: "Other", label: "Other" },
];

const ETHNICITY_OPTIONS = [
  { value: "", label: "Prefer not to say" },
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

/* ──────────── Helpers ──────────── */

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

/* ──────────── Component ──────────── */

export function AccountPage() {
  const { user, logout } = useAuth();

  // Profile form state
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [dob, setDob] = useState(user?.dob || "");
  const [gender, setGender] = useState(user?.gender || "");
  const [ethnicity, setEthnicity] = useState(user?.ethnicity || "");
  const [timezone, setTimezone] = useState(user?.timezone || "Europe/London");
  const [dateFormat, setDateFormat] = useState(user?.dateFormat || "DD/MM/YYYY");

  // Save feedback
  const [profileSaved, setProfileSaved] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  // Validation
  const [dobError, setDobError] = useState("");

  // Sync if user changes (e.g. login)
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setEmail(user.email);
      setDob(user.dob || "");
      setGender(user.gender || "");
      setEthnicity(user.ethnicity || "");
      setTimezone(user.timezone);
      setDateFormat(user.dateFormat);
    }
  }, [user]);

  const handleDobChange = (value: string) => {
    setDob(value);
    setDobError("");
    if (value) {
      const age = calculateAge(value);
      if (age < 18) {
        setDobError(
          "You must be 18 or over to use this service. Shruti's insurance covers adults only."
        );
      }
    }
  };

  const handleProfileSave = () => {
    if (dob && calculateAge(dob) < 18) {
      setDobError(
        "You must be 18 or over to use this service. Shruti's insurance covers adults only."
      );
      return;
    }
    // In production: PATCH /api/user/me
    console.log("Saving profile:", {
      firstName,
      lastName,
      email,
      dob: dob || null,
      gender: gender || null,
      ethnicity: ethnicity || null,
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handlePrefsSave = () => {
    // In production: PATCH /api/user/me
    console.log("Saving preferences:", { timezone, dateFormat });
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 3000);
  };

  // Current time in selected timezone for preview
  const currentTimePreview = new Date().toLocaleString("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: dateFormat === "MM/DD/YYYY",
  });

  const currentDatePreview = formatDateForDisplay(
    new Date().toISOString(),
    dateFormat
  );

  return (
    <DashboardLayout title="Account - Shruti Turner">
      <h1 className="text-3xl mb-2">Account Settings</h1>
      <p className="text-muted-foreground mb-8">
        Manage your profile, preferences, and notifications.
      </p>

      <div className="max-w-2xl space-y-8">
        {/* ── Profile ── */}
        <div className="bg-background border rounded-lg p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-xl">Profile</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
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
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Date of Birth */}
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
            {dobError && (
              <p className="text-sm text-red-600 flex items-start gap-1.5">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {dobError}
              </p>
            )}
            {!dobError && (
              <p className="text-xs text-muted-foreground">
                Required for insurance purposes. You must be 18 or over.
              </p>
            )}
          </div>

          {/* Gender & Ethnicity (optional) */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">
                Gender{" "}
                <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Prefer not to say" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || "empty"} value={opt.value || "prefer_not_to_say"}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ethnicity">
                Ethnicity{" "}
                <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Select value={ethnicity} onValueChange={setEthnicity}>
                <SelectTrigger id="ethnicity">
                  <SelectValue placeholder="Prefer not to say" />
                </SelectTrigger>
                <SelectContent>
                  {ETHNICITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || "empty"} value={opt.value || "prefer_not_to_say"}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Gender and ethnicity are optional. This information helps ensure
            inclusive service delivery and is never shared publicly.
          </p>

          <div className="flex items-center gap-3">
            <Button onClick={handleProfileSave} disabled={!!dobError}>
              Save Profile
            </Button>
            {profileSaved && (
              <span className="text-sm text-[#4B5B32] flex items-center gap-1">
                <Check className="w-4 h-4" />
                Saved
              </span>
            )}
          </div>
        </div>

        {/* ── Regional Preferences ── */}
        <div className="bg-background border rounded-lg p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-xl">Regional Preferences</h2>
          </div>

          <p className="text-sm text-muted-foreground">
            These settings control how dates and times appear in your schedule,
            booking confirmations, and reminder emails.
          </p>

          {/* Timezone */}
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

          {/* Date Format */}
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

          {/* Live Preview */}
          <div className="bg-secondary/30 border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Preview:</span>
            </div>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Today's date: </span>
                <span>{currentDatePreview}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Current time: </span>
                <span>{currentTimePreview}</span>
              </p>
              <p>
                <span className="text-muted-foreground">
                  Example class time:{" "}
                </span>
                <span>
                  Monday{" "}
                  {dateFormat === "MM/DD/YYYY" ? "9:00 AM" : "09:00"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handlePrefsSave}>Save Preferences</Button>
            {prefsSaved && (
              <span className="text-sm text-[#4B5B32] flex items-center gap-1">
                <Check className="w-4 h-4" />
                Saved
              </span>
            )}
          </div>
        </div>

        {/* ── Health Profile link ── */}
        <div className="bg-background border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <HeartPulse className="w-5 h-5 text-primary" />
            <h2 className="text-xl">Health Profile</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Keep your health conditions up to date so Shruti can adapt sessions
            for your body.
          </p>
          <Link href="/dashboard/health">
            <Button variant="outline">View & Edit Health Profile</Button>
          </Link>
        </div>

        {/* ── Notifications ── */}
        <div className="bg-background border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-xl">Notifications</h2>
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between py-2">
              <span className="text-sm">Class reminders (2 hours before)</span>
              <input
                type="checkbox"
                defaultChecked
                className="accent-[#4B5B32]"
              />
            </label>
            <label className="flex items-center justify-between py-2">
              <span className="text-sm">New class schedule updates</span>
              <input
                type="checkbox"
                defaultChecked
                className="accent-[#4B5B32]"
              />
            </label>
            <label className="flex items-center justify-between py-2">
              <span className="text-sm">Program announcements</span>
              <input
                type="checkbox"
                defaultChecked
                className="accent-[#4B5B32]"
              />
            </label>
          </div>

          <div className="pt-3 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              Email subscriptions
            </p>
            <div className="space-y-3">
              <label className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm">Newsletter</span>
                  <p className="text-xs text-muted-foreground">
                    Monthly insights and training tips
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="accent-[#4B5B32]"
                />
              </label>
              <label className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm">Blog updates</span>
                  <p className="text-xs text-muted-foreground">
                    New article notifications
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="accent-[#4B5B32]"
                />
              </label>
            </div>
          </div>

          <Button variant="outline">Update Preferences</Button>
        </div>

        {/* ── Privacy & Legal ── */}
        <div className="bg-background border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-xl">Privacy & Legal</h2>
          </div>
          <div className="space-y-2 text-sm">
            <Link href="/terms" className="block text-primary hover:underline">
              Terms & Conditions
            </Link>
            <Link href="/privacy" className="block text-primary hover:underline">
              Privacy Policy
            </Link>
            <Link href="/health-declaration"
              className="block text-primary hover:underline"
            >
              Health Declaration
            </Link>
          </div>
          <div className="pt-4 border-t">
            <Button variant="outline">Request Data Export</Button>
          </div>
        </div>

        {/* ── Sign out ── */}
        <div className="bg-background border rounded-lg p-6">
          <Button
            variant="outline"
            onClick={() => {
              logout();
              window.location.href = "/";
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