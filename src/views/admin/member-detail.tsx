"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Bell,
  Edit3,
  Save,
  HeartPulse,
  Shield,
  UserCheck,
  Send,
  Download,
  Trash2,
} from "lucide-react";
import { HealthProfileCard } from "../../components/admin/health-badges";
import { toast } from "sonner";
import type { AdminMemberDetailDto } from "@/lib/api/types";

export function AdminMemberDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const navigate = (href: string, opts?: { replace?: boolean }) =>
    opts?.replace ? router.replace(href) : router.push(href);
  const [member, setMember] = useState<AdminMemberDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [isInstructor, setIsInstructor] = useState(false);
  const [instructorProfileEntryId, setInstructorProfileEntryId] = useState<string>("");
  const [instructorProfiles, setInstructorProfiles] = useState<
    Array<{ id: string; name: string; slug: string; headline?: string }>
  >([]);
  const [isCoachingClient, setIsCoachingClient] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messageSending, setMessageSending] = useState(false);
  const [privacyBusy, setPrivacyBusy] = useState<"export" | "delete" | null>(null);
  const [deletePreview, setDeletePreview] = useState<{
    blocked: boolean;
    blockReason: string | null;
    deletes?: string[];
    anonymises?: string[];
    preserves?: string[];
  } | null>(null);

  const applyMemberState = (data: AdminMemberDetailDto) => {
    setMember(data);
    setNotes(data.notes || "");
    setIsInstructor(Boolean(data.isInstructor));
    setInstructorProfileEntryId(data.instructorProfileEntryId || "");
    setIsCoachingClient(Boolean(data.isCoachingClient));
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const res = await fetch(`/api/admin/members/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load member.");
        const data = (await res.json()) as AdminMemberDetailDto;
        if (!active || !data) return;
        applyMemberState(data);
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : "Failed to load member.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetch("/api/admin/instructors/profiles", { cache: "no-store" });
        if (!res.ok || !active) return;
        const rows = (await res.json()) as Array<{
          id: string;
          name: string;
          slug: string;
          headline?: string;
        }>;
        setInstructorProfiles(rows);
      } catch {
        // no-op
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!member) {
    return (
      <AdminLayout title="Member Not Found - Admin">
        <div className="py-20 text-center">
          <p className="text-muted-foreground">
            {loading ? "Loading member..." : loadError || "Member not found."}
          </p>
          <Link href="/admin/members">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Members
            </Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const statusColors: Record<string, string> = {
    active: "bg-brand-accent/10 text-brand-accent border-brand-accent/30",
    paused: "bg-amber-50 text-amber-700 border-amber-200",
    expired: "bg-secondary text-muted-foreground",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };

  const handleRoleToggle = async (role: "instructor" | "coaching", newValue: boolean) => {
    if (!member) return;
    if (role === "instructor") {
      if (newValue && !instructorProfileEntryId) {
        toast.error("Select an instructor profile before enabling instructor access.");
        return;
      }
      const response = await fetch(`/api/admin/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isInstructor: newValue,
          instructorProfileEntryId: newValue ? instructorProfileEntryId : null,
        }),
      });
      if (!response.ok) {
        toast.error("Failed to update instructor role.");
        return;
      }
      applyMemberState((await response.json()) as AdminMemberDetailDto);
      toast.success(
        newValue
          ? `${member.firstName} is now an Instructor`
          : `Instructor role removed from ${member.firstName}`
      );
    } else {
      if (!newValue && isCoachingClient) {
        const firstConfirmed = window.confirm(
          "Remove coaching client status from this member? This does not cancel any Stripe coaching subscription or remove Everfit access."
        );
        if (!firstConfirmed) return;
        const secondConfirmed = window.confirm(
          "Confirm again: remove the coaching client flag only. Billing and delivery must be handled separately."
        );
        if (!secondConfirmed) return;
      }
      const response = await fetch(`/api/admin/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isCoachingClient: newValue,
          confirmCoachingRemoval: !newValue ? "REMOVE_COACHING_CLIENT" : undefined,
        }),
      });
      if (!response.ok) {
        toast.error("Failed to update coaching role.");
        return;
      }
      applyMemberState((await response.json()) as AdminMemberDetailDto);
      toast.success(
        newValue
          ? `${member.firstName} is now a Coaching Client`
          : `Coaching Client role removed from ${member.firstName}`
      );
    }
  };

  const handleSendMessage = async () => {
    if (!member) return;
    setMessageSending(true);
    try {
      const response = await fetch(`/api/admin/members/${member.id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: messageSubject,
          message: messageBody,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        toast.error(payload.message || "Failed to send email.");
        return;
      }
      setShowMessageForm(false);
      setMessageSubject("");
      setMessageBody("");
      toast.success(`Email sent to ${member.firstName}`);
    } finally {
      setMessageSending(false);
    }
  };

  const handlePrivacyExport = async () => {
    if (!member) return;
    setPrivacyBusy("export");
    try {
      const response = await fetch(`/api/admin/members/${member.id}/privacy/export`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as {
        downloadUrl?: string;
        message?: string;
      } | null;
      if (!response.ok || !payload?.downloadUrl) {
        toast.error(payload?.message || "Failed to generate export.");
        return;
      }
      const link = document.createElement("a");
      link.href = payload.downloadUrl;
      document.body.append(link);
      link.click();
      link.remove();
      toast.success("Privacy export generated.");
    } finally {
      setPrivacyBusy(null);
    }
  };

  const handleDeletePreview = async () => {
    if (!member) return;
    const response = await fetch(`/api/admin/members/${member.id}/privacy/delete`, {
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as {
      blocked?: boolean;
      blockReason?: string | null;
      deletes?: string[];
      anonymises?: string[];
      preserves?: string[];
    } | null;
    if (!response.ok || !payload) {
      toast.error("Failed to load deletion preview.");
      return;
    }
    setDeletePreview({
      blocked: Boolean(payload.blocked),
      blockReason: payload.blockReason || null,
      deletes: Array.isArray(payload.deletes) ? payload.deletes : [],
      anonymises: Array.isArray(payload.anonymises) ? payload.anonymises : [],
      preserves: Array.isArray(payload.preserves) ? payload.preserves : [],
    });
  };

  const handlePrivacyDelete = async () => {
    if (!member) return;
    setPrivacyBusy("delete");
    try {
      const response = await fetch(`/api/admin/members/${member.id}/privacy/delete`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        toast.error(payload?.message || "Failed to anonymise member.");
        return;
      }
      toast.success("Member anonymised.");
      navigate("/admin/members");
    } finally {
      setPrivacyBusy(null);
    }
  };

  return (
    <AdminLayout title={`${member.firstName} ${member.lastName} - Admin`}>
      <div className="space-y-6">
        {/* Back nav */}
        <button
          onClick={() => navigate("/admin/members")}
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Members
        </button>

        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="bg-brand-accent text-brand-white flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-xl">
            {member.avatarInitials}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-brand-dark text-2xl">
                {member.firstName} {member.lastName}
              </h1>
              <Badge className={statusColors[member.status]}>
                {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
              </Badge>
            </div>
            <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {member.email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Joined{" "}
                {new Date(member.joinedDate).toLocaleDateString("en-GB", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {isInstructor && (
                <Badge className="border-brand-dark/30 bg-brand-dark/10 text-brand-dark">
                  <Shield className="mr-1 h-3 w-3" />
                  Instructor
                </Badge>
              )}
              {isCoachingClient && (
                <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                  <UserCheck className="mr-1 h-3 w-3" />
                  Coaching Client
                </Badge>
              )}
            </div>
            {/* Actions */}
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowMessageForm(!showMessageForm)}
              >
                <Mail className="mr-1 h-4 w-4" />
                Send Message
              </Button>
            </div>
          </div>
        </div>

        {/* Direct message form */}
        {showMessageForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Send className="text-brand-accent h-5 w-5" />
                Send Email to {member.firstName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-xs">
                This will send an email to {member.email} via Postmark.
              </p>
              <div className="space-y-2">
                <Label htmlFor="msg-subject">Subject</Label>
                <Input
                  id="msg-subject"
                  placeholder={`Hi ${member.firstName} — a quick note from Shruti`}
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="msg-body">Message</Label>
                <Textarea
                  id="msg-body"
                  rows={5}
                  placeholder={`Hi ${member.firstName},\n\n`}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                />
                <p className="text-muted-foreground text-xs">
                  The email will use your standard coaching template with the Shruti Turner
                  branding.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  disabled={!messageSubject.trim() || !messageBody.trim() || messageSending}
                  className="bg-brand-accent hover:bg-brand-accent/90 text-white"
                  onClick={() => void handleSendMessage()}
                >
                  {messageSending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-1 h-4 w-4" />
                      Send Email
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowMessageForm(false);
                    setMessageSubject("");
                    setMessageBody("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6 text-center">
              <UserCheck className="text-brand-accent mx-auto h-5 w-5" />
              <p className="text-brand-dark mt-2 text-2xl">{isCoachingClient ? "Yes" : "No"}</p>
              <p className="text-muted-foreground text-xs">1:1 client</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Shield className="text-brand-accent mx-auto h-5 w-5" />
              <p className="text-brand-dark mt-2 text-2xl">{isInstructor ? "Yes" : "No"}</p>
              <p className="text-muted-foreground text-xs">Instructor access</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Mail className="text-brand-accent mx-auto h-5 w-5" />
              <p className="text-brand-dark mt-2 text-2xl">
                {member.marketingEmails ? "On" : "Off"}
              </p>
              <p className="text-muted-foreground text-xs">Marketing emails</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Roles */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="text-brand-dark h-5 w-5" />
                  Roles
                </CardTitle>
                <span className="text-muted-foreground text-xs">Changes save automatically</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="border-border/60 bg-secondary/30 flex items-start gap-4 rounded-lg border p-4">
                <Switch
                  id="role-instructor"
                  checked={isInstructor}
                  onCheckedChange={(checked) => void handleRoleToggle("instructor", checked)}
                  className="data-[state=checked]:bg-brand-accent mt-0.5"
                />
                <label htmlFor="role-instructor" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Instructor</span>
                    {isInstructor && (
                      <Badge className="border-brand-dark/30 bg-brand-dark/10 text-brand-dark text-micro px-1.5 py-0">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Grants admin access and links the member to a public instructor profile.
                  </p>
                </label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructor-profile">Instructor Profile</Label>
                <Select
                  value={instructorProfileEntryId}
                  onValueChange={(value) => {
                    setInstructorProfileEntryId(value);
                    if (isInstructor) {
                      void (async () => {
                        const response = await fetch(`/api/admin/members/${member.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            isInstructor: true,
                            instructorProfileEntryId: value,
                          }),
                        });
                        if (!response.ok) {
                          toast.error("Failed to update instructor profile.");
                          return;
                        }
                        applyMemberState((await response.json()) as AdminMemberDetailDto);
                      })();
                    }
                  }}
                >
                  <SelectTrigger id="instructor-profile">
                    <SelectValue placeholder="Select instructor profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructorProfiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  Required when assigning instructor role. Used for retreat and article bio display.
                </p>
              </div>
              <div className="border-border/60 bg-secondary/30 flex items-start gap-4 rounded-lg border p-4">
                <Switch
                  id="role-coaching"
                  checked={isCoachingClient}
                  onCheckedChange={(checked) => void handleRoleToggle("coaching", checked)}
                  className="data-[state=checked]:bg-brand-accent mt-0.5"
                />
                <label htmlFor="role-coaching" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Coaching Client</span>
                    {isCoachingClient && (
                      <Badge className="text-micro border-amber-200 bg-amber-50 px-1.5 py-0 text-amber-700">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Marks this member as a 1:1 coaching client. Access and platform details to be
                    configured separately.
                  </p>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Health Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HeartPulse className="h-5 w-5 text-amber-600" />
                Health Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HealthProfileCard memberId={member.id} profile={member.healthProfile} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="text-brand-dark h-5 w-5" />
                Privacy Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Export the member record or anonymise personal data while preserving finance,
                dispute, auditand evidence links through an anonymised user shell.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => void handlePrivacyExport()}
                  disabled={privacyBusy !== null}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {privacyBusy === "export" ? "Generating export..." : "Export user data"}
                </Button>
                <Button variant="outline" onClick={() => void handleDeletePreview()}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Check deletion
                </Button>
              </div>
              {deletePreview ? (
                <div className="rounded-lg border p-3 text-sm">
                  <p>
                    {deletePreview.blocked
                      ? `Deletion is blocked: ${deletePreview.blockReason || "active hold"}`
                      : "Deletion can proceed. Personal data will be anonymised and active sessions revoked."}
                  </p>
                  {!deletePreview.blocked && deletePreview.deletes?.length ? (
                    <div className="mt-3 space-y-3">
                      <div>
                        <p className="font-medium">Deleted now</p>
                        <ul className="text-muted-foreground mt-1 list-disc pl-5">
                          {deletePreview.deletes.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium">Anonymised but preserved</p>
                        <ul className="text-muted-foreground mt-1 list-disc pl-5">
                          {deletePreview.anonymises?.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium">Retained for finance, audit, or disputes</p>
                        <ul className="text-muted-foreground mt-1 list-disc pl-5">
                          {deletePreview.preserves?.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : null}
                  {!deletePreview.blocked ? (
                    <Button
                      className="mt-3"
                      variant="destructive"
                      onClick={() => void handlePrivacyDelete()}
                      disabled={privacyBusy !== null}
                    >
                      {privacyBusy === "delete" ? "Anonymising..." : "Anonymise member"}
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Instructor Notes</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  if (editingNotes) {
                    const response = await fetch(`/api/admin/members/${member.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ notes }),
                    });
                    if (!response.ok) {
                      toast.error("Failed to save notes.");
                      return;
                    }
                    applyMemberState((await response.json()) as AdminMemberDetailDto);
                    toast.success("Notes saved.");
                  }
                  setEditingNotes(!editingNotes);
                }}
              >
                {editingNotes ? (
                  <>
                    <Save className="mr-1 h-4 w-4" /> Save
                  </>
                ) : (
                  <>
                    <Edit3 className="mr-1 h-4 w-4" /> Edit
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {editingNotes ? (
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Add notes about this member..."
                />
              ) : (
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {notes || "No notes yet."}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Email preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Email Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-secondary/50 flex items-center justify-between rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <Bell className="text-brand-accent h-4 w-4" />
                    <span className="text-sm">Newsletter subscriber</span>
                  </div>
                  <Badge variant={member.newsletterSubscribed ? "default" : "outline"}>
                    {member.newsletterSubscribed ? "Subscribed" : "Not subscribed"}
                  </Badge>
                </div>
                <div className="bg-secondary/50 flex items-center justify-between rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <Mail className="text-brand-accent h-4 w-4" />
                    <span className="text-sm">Marketing emails</span>
                  </div>
                  <Badge variant={member.marketingEmails ? "default" : "outline"}>
                    {member.marketingEmails ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="bg-secondary/50 flex items-center justify-between rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <Bell className="text-brand-accent h-4 w-4" />
                    <span className="text-sm">Service updates</span>
                  </div>
                  <Badge variant="outline">Transactional only</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
