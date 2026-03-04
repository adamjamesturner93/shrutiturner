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
import { useState } from "react";
import {
  ArrowLeft,
  Mail,
  Calendar,
  CreditCard,
  Gift,
  Tag,
  Bookmark,
  Bell,
  BookOpen,
  Edit3,
  Save,
  HeartPulse,
  Shield,
  UserCheck,
  Plus,
  Minus,
  Clock,
  Send,
} from "lucide-react";
import { adminMembers } from "../../data/admin-data";
import { HealthProfileCard } from "../../components/admin/health-badges";
import { toast } from "sonner";

export function AdminMemberDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const navigate = (href: string, opts?: { replace?: boolean }) =>
    opts?.replace ? router.replace(href) : router.push(href);
  const member = adminMembers.find((m) => m.id === id);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(member?.notes || "");
  const [isInstructor, setIsInstructor] = useState(member?.isInstructor || false);
  const [isCoachingClient, setIsCoachingClient] = useState(member?.isCoachingClient || false);
  const [creditBalance, setCreditBalance] = useState(member?.creditBalance || 0);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [creditAction, setCreditAction] = useState<"add" | "remove">("add");
  const [creditHistory, setCreditHistory] = useState<
    { date: string; action: "add" | "remove"; amount: number; reason: string; by: string }[]
  >([
    {
      date: "2026-02-20",
      action: "add",
      amount: 10,
      reason: "10-class bundle purchase",
      by: "System",
    },
    {
      date: "2026-02-10",
      action: "remove",
      amount: 1,
      reason: "Class booking: Adaptive Yoga Flow",
      by: "System",
    },
    {
      date: "2026-01-28",
      action: "add",
      amount: 3,
      reason: "3-class bundle purchase",
      by: "System",
    },
  ]);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messageSending, setMessageSending] = useState(false);

  if (!member) {
    return (
      <AdminLayout title="Member Not Found - Admin">
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Member not found.</p>
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
    active: "bg-[#4B5B32]/10 text-[#4B5B32] border-[#4B5B32]/30",
    paused: "bg-amber-50 text-amber-700 border-amber-200",
    expired: "bg-secondary text-muted-foreground",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };

  const handleRoleToggle = (role: "instructor" | "coaching", newValue: boolean) => {
    if (role === "instructor") {
      setIsInstructor(newValue);
      toast.success(
        newValue
          ? `${member.firstName} is now an Instructor`
          : `Instructor role removed from ${member.firstName}`
      );
      console.log(`Toggled instructor for ${member.id}:`, newValue);
    } else {
      setIsCoachingClient(newValue);
      toast.success(
        newValue
          ? `${member.firstName} is now a Coaching Client`
          : `Coaching Client role removed from ${member.firstName}`
      );
      console.log(`Toggled coaching client for ${member.id}:`, newValue);
    }
  };

  const handleCreditSubmit = () => {
    const amount = parseInt(creditAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid number of credits.");
      return;
    }
    if (!creditReason.trim()) {
      toast.error("Please provide a reason for this adjustment.");
      return;
    }
    if (creditAction === "remove" && amount > creditBalance) {
      toast.error(`Cannot remove ${amount} credits — only ${creditBalance} available.`);
      return;
    }

    const newBalance = creditAction === "add" ? creditBalance + amount : creditBalance - amount;
    setCreditBalance(newBalance);
    setCreditHistory((prev) => [
      {
        date: new Date().toISOString().split("T")[0],
        action: creditAction,
        amount,
        reason: creditReason.trim(),
        by: "Shruti Turner",
      },
      ...prev,
    ]);
    toast.success(
      `${creditAction === "add" ? "Added" : "Removed"} ${amount} credit${amount !== 1 ? "s" : ""} — balance is now ${newBalance}`
    );
    setCreditAmount("");
    setCreditReason("");
  };

  const handleSendMessage = () => {
    if (!messageSubject.trim() || !messageBody.trim()) {
      toast.error("Please fill in both the subject and body of the message.");
      return;
    }
    setMessageSending(true);
    // Simulate sending a message
    setTimeout(() => {
      setMessageSending(false);
      toast.success("Message sent successfully!");
      setShowMessageForm(false);
    }, 1500);
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
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-[#4B5B32] text-xl text-[#FAFAF8]">
            {member.avatarInitials}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl text-[#2E1F33]">
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
                <Badge className="border-[#2E1F33]/30 bg-[#2E1F33]/10 text-[#2E1F33]">
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
              {member.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  <Tag className="mr-1 h-3 w-3" />
                  {tag}
                </Badge>
              ))}
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
                <Send className="h-5 w-5 text-[#4B5B32]" />
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
                  className="bg-[#4B5B32] text-white hover:bg-[#4B5B32]/90"
                  onClick={() => {
                    setMessageSending(true);
                    console.log("Sending email to:", member.email, {
                      subject: messageSubject,
                      body: messageBody,
                    });
                    setTimeout(() => {
                      setMessageSending(false);
                      setShowMessageForm(false);
                      setMessageSubject("");
                      setMessageBody("");
                      toast.success(`Email sent to ${member.firstName}`);
                    }, 1000);
                  }}
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
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <CreditCard className="mx-auto h-5 w-5 text-[#4B5B32]" />
              <p className="mt-2 text-2xl text-[#2E1F33]">{member.membershipLabel}</p>
              <p className="text-muted-foreground text-xs">Membership</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Bookmark className="mx-auto h-5 w-5 text-[#4B5B32]" />
              <p className="mt-2 text-2xl text-[#2E1F33]">{member.totalBookings}</p>
              <p className="text-muted-foreground text-xs">Total bookings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <CreditCard className="mx-auto h-5 w-5 text-[#4B5B32]" />
              <p className="mt-2 text-2xl text-[#2E1F33]">{creditBalance}</p>
              <p className="text-muted-foreground text-xs">Credits remaining</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Gift className="mx-auto h-5 w-5 text-[#4B5B32]" />
              <p className="mt-2 text-2xl text-[#2E1F33]">{member.referralsCount}</p>
              <p className="text-muted-foreground text-xs">
                Referrals (£{member.referralBalance} balance)
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Roles */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-[#2E1F33]" />
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
                  onCheckedChange={(checked) => handleRoleToggle("instructor", checked)}
                  className="mt-0.5 data-[state=checked]:bg-[#4B5B32]"
                />
                <label htmlFor="role-instructor" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Instructor</span>
                    {isInstructor && (
                      <Badge className="border-[#2E1F33]/30 bg-[#2E1F33]/10 px-1.5 py-0 text-[10px] text-[#2E1F33]">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Grants admin access, unlimited class membership, and ability to lead classes.
                  </p>
                </label>
              </div>
              <div className="border-border/60 bg-secondary/30 flex items-start gap-4 rounded-lg border p-4">
                <Switch
                  id="role-coaching"
                  checked={isCoachingClient}
                  onCheckedChange={(checked) => handleRoleToggle("coaching", checked)}
                  className="mt-0.5 data-[state=checked]:bg-[#4B5B32]"
                />
                <label htmlFor="role-coaching" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Coaching Client</span>
                    {isCoachingClient && (
                      <Badge className="border-amber-200 bg-amber-50 px-1.5 py-0 text-[10px] text-amber-700">
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
              <HealthProfileCard memberId={member.id} />
            </CardContent>
          </Card>

          {/* Manage Credits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-[#4B5B32]" />
                Manage Credits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Current balance callout */}
              <div className="flex items-center justify-between rounded-lg border border-[#4B5B32]/20 bg-[#4B5B32]/5 p-3">
                <span className="text-muted-foreground text-sm">Current balance</span>
                <span className="text-xl text-[#2E1F33]">
                  {creditBalance} credit{creditBalance !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Add/Remove form */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="w-32">
                    <Label htmlFor="credit-action" className="sr-only">
                      Action
                    </Label>
                    <Select
                      value={creditAction}
                      onValueChange={(v) => setCreditAction(v as "add" | "remove")}
                    >
                      <SelectTrigger id="credit-action">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="add">
                          <span className="flex items-center gap-1.5">
                            <Plus className="h-3.5 w-3.5 text-[#4B5B32]" /> Add
                          </span>
                        </SelectItem>
                        <SelectItem value="remove">
                          <span className="flex items-center gap-1.5">
                            <Minus className="h-3.5 w-3.5 text-red-500" /> Remove
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Label htmlFor="credit-amount" className="sr-only">
                      Amount
                    </Label>
                    <Input
                      id="credit-amount"
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="credit-reason" className="sr-only">
                    Reason
                  </Label>
                  <Input
                    id="credit-reason"
                    placeholder="Reason (e.g. Goodwill credit, Bundle purchase)"
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleCreditSubmit}
                  size="sm"
                  className={
                    creditAction === "add"
                      ? "bg-[#4B5B32] text-white hover:bg-[#4B5B32]/90"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }
                >
                  {creditAction === "add" ? (
                    <>
                      <Plus className="h-4 w-4" /> Add Credits
                    </>
                  ) : (
                    <>
                      <Minus className="h-4 w-4" /> Remove Credits
                    </>
                  )}
                </Button>
              </div>

              {/* Recent history */}
              {creditHistory.length > 0 && (
                <div className="border-border/50 border-t pt-4">
                  <p className="text-muted-foreground mb-3 flex items-center gap-1.5 text-xs">
                    <Clock className="h-3.5 w-3.5" /> Recent credit history
                  </p>
                  <div className="space-y-2">
                    {creditHistory.slice(0, 5).map((entry, i) => (
                      <div
                        key={i}
                        className="border-border/30 flex items-start justify-between border-b py-1.5 text-sm last:border-0"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs ${
                                entry.action === "add"
                                  ? "bg-[#4B5B32]/10 text-[#4B5B32]"
                                  : "bg-red-50 text-red-600"
                              }`}
                            >
                              {entry.action === "add" ? "+" : "−"}
                              {entry.amount}
                            </span>
                            <span className="text-muted-foreground truncate">{entry.reason}</span>
                          </div>
                        </div>
                        <div className="text-muted-foreground ml-3 text-xs whitespace-nowrap">
                          {new Date(entry.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                          <span className="ml-1.5 opacity-60">· {entry.by}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Instructor Notes</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (editingNotes) {
                    // Save
                    console.log("Saving notes for", member.id, notes);
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

          {/* Subscriptions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-secondary/50 flex items-center justify-between rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-[#4B5B32]" />
                    <span className="text-sm">Newsletter</span>
                  </div>
                  <Badge variant={member.newsletterSubscribed ? "default" : "outline"}>
                    {member.newsletterSubscribed ? "Subscribed" : "Not subscribed"}
                  </Badge>
                </div>
                <div className="bg-secondary/50 flex items-center justify-between rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-[#4B5B32]" />
                    <span className="text-sm">Blog notifications</span>
                  </div>
                  <Badge variant={member.blogSubscribed ? "default" : "outline"}>
                    {member.blogSubscribed ? "Subscribed" : "Not subscribed"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="border-border/50 flex items-center justify-between border-b py-2">
                <span className="text-muted-foreground text-sm">Last class attended</span>
                <span className="text-sm">
                  {new Date(member.lastClassDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="border-border/50 flex items-center justify-between border-b py-2">
                <span className="text-muted-foreground text-sm">Member since</span>
                <span className="text-sm">
                  {new Date(member.joinedDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="border-border/50 flex items-center justify-between border-b py-2">
                <span className="text-muted-foreground text-sm">Referral code</span>
                <span className="font-mono text-sm">{member.referralCode}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground text-sm">Referral earnings (lifetime)</span>
                <span className="text-sm">£{member.referralsCount * 10}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
