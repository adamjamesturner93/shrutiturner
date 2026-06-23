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
import { useState } from "react";
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
  Settings,
  ArrowRight,
} from "lucide-react";
import { getTimezoneOptions } from "../lib/date-i18n";
import type { AccountDto, OnboardingStateDto } from "@/lib/api/types";
import { AppPageHeader } from "@/components/app-surface";
import { getApiErrorMessage, isApiSuccess } from "@/lib/api/client";

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

type AccountTab = "profile" | "preferences" | "notifications";

const TABS: { key: AccountTab; label: string; icon: typeof User }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "preferences", label: "Preferences", icon: Settings },
  { key: "notifications", label: "Notifications", icon: Bell },
];

const ONBOARDING_STEP_LABELS: Record<OnboardingStateDto["missingSteps"][number], string> = {
  profile: "Complete your profile details",
  legal: "Accept the current legal agreements",
  source: "Tell Shruti how you heard about the studio",
  health: "Finish your health profile and consent",
};

function getDisplayName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

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

export function AccountPage({ initialAccount }: { initialAccount: AccountDto }) {
  const { logout, acceptTermsAndHealth, refreshAccountProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<AccountTab>("profile");

  const [displayName, setDisplayName] = useState(
    getDisplayName(initialAccount.profile.firstName, initialAccount.profile.lastName)
  );
  const [email, setEmail] = useState(initialAccount.profile.email || "");
  const [dob, setDob] = useState(initialAccount.profile.dob || "");
  const [gender, setGender] = useState(toSelectValue(initialAccount.profile.gender));
  const [ethnicity, setEthnicity] = useState(toSelectValue(initialAccount.profile.ethnicity));
  const [timezone, setTimezone] = useState(initialAccount.profile.timezone || "Europe/London");
  const [dateFormat, setDateFormat] = useState(initialAccount.profile.dateFormat || "DD/MM/YYYY");
  const [notifications, setNotifications] = useState({
    classReminders: initialAccount.notifications.classReminders,
    scheduleUpdates: initialAccount.notifications.scheduleUpdates,
    programAnnouncements: initialAccount.notifications.programAnnouncements,
    marketingEmails: initialAccount.notifications.marketingEmails,
  });

  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(initialAccount.profile.hasAgreedToTerms);
  const [hasAgreedToHealth, setHasAgreedToHealth] = useState(
    initialAccount.profile.hasAgreedToHealth
  );
  const [termsAgreedAt, setTermsAgreedAt] = useState<string | null>(
    initialAccount.profile.termsAgreedAt
  );
  const [healthAgreedAt, setHealthAgreedAt] = useState<string | null>(
    initialAccount.profile.healthAgreedAt
  );

  const [onboardingState, setOnboardingState] = useState<OnboardingStateDto | null>(
    initialAccount.profile.onboarding
  );

  const [profileSaved, setProfileSaved] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [notificationsSaved, setNotificationsSaved] = useState(false);
  const [legalSaving, setLegalSaving] = useState<"terms" | "health" | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [emailChangeCode, setEmailChangeCode] = useState("");
  const [emailChangeRequested, setEmailChangeRequested] = useState(false);
  const [emailChangeBusy, setEmailChangeBusy] = useState<"request" | "confirm" | null>(null);
  const [emailChangeMessage, setEmailChangeMessage] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [dobError, setDobError] = useState("");
  const [error, setError] = useState("");
  const [legalError, setLegalError] = useState("");
  const [emailChangeError, setEmailChangeError] = useState("");

  const applyAccountData = (data: AccountDto) => {
    setDisplayName(getDisplayName(data.profile.firstName, data.profile.lastName));
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
    setOnboardingState(data.profile.onboarding);
    setNotifications({
      classReminders: data.notifications.classReminders,
      scheduleUpdates: data.notifications.scheduleUpdates,
      programAnnouncements: data.notifications.programAnnouncements,
      marketingEmails: data.notifications.marketingEmails,
    });
    setNewEmail("");
    setEmailChangeCode("");
    setEmailChangeRequested(false);
    setEmailChangeMessage("");
    setEmailChangeError("");
  };

  const reloadAccount = async () => {
    const accountRes = await fetch("/api/me", { cache: "no-store" });
    if (!accountRes.ok) throw new Error("Failed to load account.");
    const payload = (await accountRes.json().catch(() => null)) as unknown;
    if (!isApiSuccess<AccountDto>(payload)) {
      throw new Error("Failed to load account.");
    }
    const data = payload.data;
    applyAccountData(data);
    return data;
  };

  const handleDobChange = (value: string) => {
    setDob(value);
    setDobError("");
    if (value && calculateAge(value) < 18) {
      setDobError(
        "You must be 18 or over to use this service. Shruti's insurance covers adults only."
      );
    }
  };

  const handleEmailChangeRequest = async () => {
    setEmailChangeError("");
    setEmailChangeMessage("");
    setEmailChangeBusy("request");
    try {
      const response = await fetch("/api/me/email-change/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextEmail: newEmail }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { success: true; data: { pendingEmail: string } }
        | { error?: { message?: string } }
        | null;
      if (!response.ok || !payload || !("success" in payload)) {
        throw new Error(
          payload && "error" in payload
            ? payload.error?.message || "Unable to request email change."
            : "Unable to request email change."
        );
      }
      setEmailChangeRequested(true);
      setEmailChangeMessage(`Verification code sent to ${payload.data.pendingEmail}.`);
    } catch (error) {
      setEmailChangeError(
        error instanceof Error ? error.message : "Unable to request email change."
      );
    } finally {
      setEmailChangeBusy(null);
    }
  };

  const handleEmailChangeConfirm = async () => {
    setEmailChangeError("");
    setEmailChangeMessage("");
    setEmailChangeBusy("confirm");
    try {
      const response = await fetch("/api/me/email-change/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextEmail: newEmail, code: emailChangeCode }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { success: true; data: { email: string } }
        | { error?: { message?: string } }
        | null;
      if (!response.ok || !payload || !("success" in payload)) {
        throw new Error(
          payload && "error" in payload
            ? payload.error?.message || "Unable to confirm email change."
            : "Unable to confirm email change."
        );
      }
      setEmailChangeMessage("Email updated.");
      await reloadAccount();
    } catch (error) {
      setEmailChangeError(
        error instanceof Error ? error.message : "Unable to confirm email change."
      );
    } finally {
      setEmailChangeBusy(null);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Delete this account? Personal data will be anonymised and active sessions will be revoked."
    );
    if (!confirmed) return;

    setDeleteBusy(true);
    setEmailChangeError("");
    try {
      const response = await fetch("/api/me/privacy/delete", { method: "POST" });
      const payload = (await response.json().catch(() => null)) as
        | { success: true; data: { deleted: boolean } }
        | { error?: { message?: string } }
        | null;

      if (!response.ok || !payload || !("success" in payload)) {
        throw new Error(
          payload && "error" in payload
            ? payload.error?.message || "Unable to delete account."
            : "Unable to delete account."
        );
      }

      await logout();
    } catch (error) {
      setEmailChangeError(error instanceof Error ? error.message : "Unable to delete account.");
    } finally {
      setDeleteBusy(false);
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
          firstName: displayName.trim(),
          lastName: "",
          dob: dob || null,
          gender: fromSelectValue(gender),
          ethnicity: fromSelectValue(ethnicity),
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as unknown;
        throw new Error(getApiErrorMessage(payload, "Failed to save profile."));
      }
      await refreshAccountProfile();
      await reloadAccount();
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
      await reloadAccount();
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
        const payload = (await res.json().catch(() => null)) as unknown;
        throw new Error(getApiErrorMessage(payload, "Failed to save preferences."));
      }
      await refreshAccountProfile();
      await reloadAccount();
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
        const payload = (await res.json().catch(() => null)) as unknown;
        throw new Error(getApiErrorMessage(payload, "Failed to update notification preferences."));
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
      <AppPageHeader
        eyebrow="Account"
        title="Your account"
        description="Keep the practical details current so Shruti can contact you, use the right name and keep required agreements in place."
        className="mb-6"
      />
      {error ? <p className="mb-6 text-sm text-red-600">{error}</p> : null}

      <div className="bg-background mb-8 rounded-lg border p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">Profile</p>
            <p className="mt-2 text-lg">{displayName ? "Ready" : "Needs your name"}</p>
            <p className="text-muted-foreground mt-1 text-sm">How Shruti addresses you.</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">Email</p>
            <p className="mt-2 text-lg">Verified sign-in</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Used for account access and updates.
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">Agreements</p>
            <p className="mt-2 text-lg">
              {hasAgreedToTerms && hasAgreedToHealth ? "Accepted" : "Review needed"}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">Terms and health waiver status.</p>
          </div>
        </div>
      </div>
      <>
        {onboardingState && !onboardingState.isComplete ? (
          <div className="bg-background mb-8 flex flex-col gap-4 rounded-lg border p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Onboarding</Badge>
                <span className="text-muted-foreground text-sm">
                  {onboardingState.missingSteps.length} step
                  {onboardingState.missingSteps.length === 1 ? "" : "s"} remaining
                </span>
              </div>
              <p className="text-sm leading-relaxed">
                Finish the remaining setup steps so your studio account, legal agreements and health
                profile stay complete.
              </p>
              <div className="flex flex-wrap gap-2">
                {onboardingState.missingSteps.map((step) => (
                  <Badge key={step} variant="secondary">
                    {ONBOARDING_STEP_LABELS[step]}
                  </Badge>
                ))}
              </div>
            </div>
            <Link href="/dashboard?onboarding=true">
              <Button>
                Continue onboarding
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : null}

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

        <div className="max-w-3xl">
          {activeTab === "profile" ? (
            <div className="space-y-8">
              <div className="bg-background space-y-5 rounded-lg border p-6">
                <div className="mb-2 flex items-center gap-3">
                  <User className="text-primary h-5 w-5" />
                  <h2 className="text-xl">Personal Details</h2>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">What should I call you?</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    autoComplete="name"
                  />
                  <p className="text-muted-foreground text-xs">
                    This is the name used in your account, emails and 1:1 support.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} readOnly disabled />
                  <p className="text-muted-foreground text-xs">
                    Change requests are verified with a code sent to the new address before the
                    account email is updated.
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

              <div className="bg-background space-y-5 rounded-lg border p-6">
                <div className="mb-2 flex items-center gap-3">
                  <Mail className="text-primary h-5 w-5" />
                  <h2 className="text-xl">Sign-in email</h2>
                </div>
                <p className="text-muted-foreground text-sm">
                  Your email is used for sign-in, account updates and messages about your 1:1
                  support.
                </p>
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Change sign-in email</p>
                    <p className="text-muted-foreground text-xs">
                      Account history stays attached to your profile. The new address must be
                      verified before it replaces the current one.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      type="email"
                      value={newEmail}
                      onChange={(event) => setNewEmail(event.target.value)}
                      placeholder="new-email@example.com"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!newEmail || emailChangeBusy !== null}
                      onClick={handleEmailChangeRequest}
                    >
                      {emailChangeBusy === "request" ? "Sending..." : "Send code"}
                    </Button>
                  </div>
                  {emailChangeRequested ? (
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Input
                        value={emailChangeCode}
                        onChange={(event) => setEmailChangeCode(event.target.value)}
                        inputMode="numeric"
                        placeholder="Enter 6-digit code"
                      />
                      <Button
                        type="button"
                        disabled={!emailChangeCode || emailChangeBusy !== null}
                        onClick={handleEmailChangeConfirm}
                      >
                        {emailChangeBusy === "confirm" ? "Confirming..." : "Confirm change"}
                      </Button>
                    </div>
                  ) : null}
                  {emailChangeMessage ? (
                    <p className="text-sm text-emerald-700">{emailChangeMessage}</p>
                  ) : null}
                  {emailChangeError ? (
                    <p className="text-sm text-red-600">{emailChangeError}</p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-800">Delete account</p>
                    <p className="mt-1 text-xs text-red-700">
                      This anonymises personal data, revokes active sessions and keeps only records
                      that must be retained for audit, disputes or finance.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={deleteBusy}
                    onClick={handleDeleteAccount}
                  >
                    {deleteBusy ? "Deleting..." : "Delete account"}
                  </Button>
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

              <section
                className="bg-background space-y-4 rounded-lg border p-6"
                aria-labelledby="privacy-legal-heading"
              >
                <div className="mb-2 flex items-center gap-3">
                  <Shield className="text-primary h-5 w-5" />
                  <h2 id="privacy-legal-heading" className="text-xl">
                    Privacy & Legal
                  </h2>
                </div>

                {!hasAgreedToTerms || !hasAgreedToHealth ? (
                  <div
                    className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4"
                    data-testid="legal-pending-panel"
                  >
                    <p className="text-sm text-amber-800">
                      You still need to accept required agreements.
                    </p>
                    {legalError ? <p className="text-sm text-red-600">{legalError}</p> : null}
                    {!hasAgreedToTerms ? (
                      <label
                        className="flex items-start gap-3 rounded-lg border border-amber-200 bg-white p-3"
                        data-testid="accept-terms-checkbox"
                      >
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
                      <label
                        className="flex items-start gap-3 rounded-lg border border-amber-200 bg-white p-3"
                        data-testid="accept-health-checkbox"
                      >
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
              </section>
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

          {activeTab === "notifications" ? (
            <div className="space-y-8">
              {/* <div className="bg-background space-y-4 rounded-lg border p-6">
                <div className="mb-2 flex items-center gap-3">
                  <Bell className="text-primary h-5 w-5" />
                  <h2 className="text-xl">Coaching & Resource Notifications</h2>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center justify-between py-2">
                    <span className="text-sm">Coaching reminders</span>
                    <input
                      type="checkbox"
                      checked={notifications.classReminders}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          classReminders: e.target.checked,
                        }))
                      }
                      className="accent-brand-accent"
                    />
                  </label>
                  <label className="flex items-center justify-between py-2">
                    <span className="text-sm">New article and resource updates</span>
                    <input
                      type="checkbox"
                      checked={notifications.scheduleUpdates}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          scheduleUpdates: e.target.checked,
                        }))
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
              </div> */}

              <div className="bg-background space-y-4 rounded-lg border p-6">
                <div className="mb-2 flex items-center gap-3">
                  <Mail className="text-primary h-5 w-5" />
                  <h2 className="text-xl">Email Subscriptions</h2>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm">Newsletter & Blog Updates</span>
                      <p className="text-muted-foreground text-xs">
                        Articles, coaching updates and training insights
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.marketingEmails}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          marketingEmails: e.target.checked,
                        }))
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
      </>
    </DashboardLayout>
  );
}
