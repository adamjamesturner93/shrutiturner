"use client";

import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import {
  Search,
  ChevronRight,
  Users,
  UserCheck,
  UserX,
  Pause,
  Shield,
  AlertTriangle,
} from "lucide-react";
import type { AdminMemberListItemDto } from "@/lib/api/types";

type AdminMember = AdminMemberListItemDto & {
  status: "active" | "paused" | "cancelled" | "expired" | "past_due";
};

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  active: { label: "Active", variant: "default" },
  paused: { label: "Paused", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  expired: { label: "Expired", variant: "outline" },
  past_due: { label: "Past due", variant: "destructive" },
};

/** Compute at-risk status for a member */
function getAtRiskStatus(m: AdminMember): "high" | "medium" | "credits-expiring" | null {
  const today = new Date();
  const twoWeeksAgo = new Date(today.getTime() - 14 * 86400000);
  const fourWeeksAgo = new Date(today.getTime() - 28 * 86400000);
  const lastClass = new Date(m.lastClassDate);
  if (m.status !== "active") return null;
  if (lastClass < fourWeeksAgo && m.membershipPlan) return "high";
  if (lastClass < twoWeeksAgo) return "medium";
  if (!m.membershipPlan && m.creditBalance > 0 && m.creditBalance <= 2) return "credits-expiring";
  return null;
}

export function AdminMembers() {
  const [adminMembers, setAdminMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/members", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load members.");
        const data = (await res.json()) as AdminMember[];
        if (active) setAdminMembers(data);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load members.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const atRiskCounts = useMemo(() => {
    let high = 0,
      medium = 0,
      creditsExpiring = 0;
    adminMembers.forEach((m) => {
      const risk = getAtRiskStatus(m);
      if (risk === "high") high++;
      else if (risk === "medium") medium++;
      else if (risk === "credits-expiring") creditsExpiring++;
    });
    return { high, medium, creditsExpiring, total: high + medium + creditsExpiring };
  }, [adminMembers]);

  const filtered = useMemo(() => {
    return adminMembers.filter((m) => {
      const matchesSearch =
        search === "" ||
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        m.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "lapsed"
          ? m.status === "expired" || m.status === "cancelled"
          : m.status === statusFilter);
      const matchesPlan =
        planFilter === "all" ||
        (planFilter === "none" && !m.membershipPlan) ||
        m.membershipPlan === planFilter;
      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "instructor" && m.isInstructor) ||
        (roleFilter === "coaching" && m.isCoachingClient);
      const matchesRisk = (() => {
        if (riskFilter === "all") return true;
        const risk = getAtRiskStatus(m);
        if (riskFilter === "any-risk") return risk !== null;
        return risk === riskFilter;
      })();
      return matchesSearch && matchesStatus && matchesPlan && matchesRole && matchesRisk;
    });
  }, [adminMembers, search, statusFilter, planFilter, roleFilter, riskFilter]);

  const statusCounts = useMemo(() => {
    const counts = { active: 0, paused: 0, cancelled: 0, expired: 0, past_due: 0 };
    adminMembers.forEach((m) => {
      counts[m.status as keyof typeof counts]++;
    });
    return counts;
  }, [adminMembers]);

  return (
    <AdminLayout title="Members - Admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-brand-dark text-2xl">Members</h1>
          <p className="text-muted-foreground mt-1">
            {adminMembers.length} total members · {statusCounts.active} active
          </p>
          {loading ? (
            <p className="text-muted-foreground mt-2 text-sm">Loading members...</p>
          ) : null}
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </div>

        {/* Stat pills */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "active" ? "all" : "active")}
            className={`focus-visible:ring-brand-accent/50 flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none ${
              statusFilter === "active"
                ? "border-brand-accent bg-brand-accent text-brand-white"
                : "bg-brand-accent/10 hover:border-brand-accent/40 hover:bg-brand-accent/5 border-transparent"
            }`}
          >
            <UserCheck
              className={`h-4 w-4 ${statusFilter === "active" ? "text-brand-white" : "text-brand-accent"}`}
            />
            <span>{statusCounts.active} active</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "paused" ? "all" : "paused")}
            className={`focus-visible:ring-brand-accent/50 flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none ${
              statusFilter === "paused"
                ? "border-brand-accent bg-brand-accent text-brand-white"
                : "bg-secondary text-foreground hover:border-brand-accent/40 hover:bg-brand-accent/5 border-transparent"
            }`}
          >
            <Pause
              className={`h-4 w-4 ${statusFilter === "paused" ? "text-brand-white" : "text-muted-foreground"}`}
            />
            <span>{statusCounts.paused} paused</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "lapsed" ? "all" : "lapsed")}
            className={`focus-visible:ring-brand-accent/50 flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none ${
              statusFilter === "lapsed"
                ? "border-brand-accent bg-brand-accent text-brand-white"
                : "bg-secondary text-foreground hover:border-brand-accent/40 hover:bg-brand-accent/5 border-transparent"
            }`}
          >
            <UserX
              className={`h-4 w-4 ${statusFilter === "lapsed" ? "text-brand-white" : "text-muted-foreground"}`}
            />
            <span>{statusCounts.expired + statusCounts.cancelled} lapsed</span>
          </button>
          {atRiskCounts.total > 0 && (
            <button
              onClick={() => setRiskFilter(riskFilter === "any-risk" ? "all" : "any-risk")}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
                riskFilter !== "all"
                  ? "border border-amber-300 bg-amber-100 text-amber-800"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              <span>{atRiskCounts.total} at risk</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search name, email, or tag..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border-border bg-background rounded-md border px-3 py-2 text-sm"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="lapsed">Lapsed (expired + cancelled)</option>
                  <option value="past_due">Past due</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="border-border bg-background rounded-md border px-3 py-2 text-sm"
                >
                  <option value="all">All plans</option>
                  <option value="instructor">Instructor</option>
                  <option value="movewell">Move Well</option>
                  <option value="none">Pay as you Go</option>
                </select>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="border-border bg-background rounded-md border px-3 py-2 text-sm"
                >
                  <option value="all">All roles</option>
                  <option value="instructor">Instructors</option>
                  <option value="coaching">Coaching clients</option>
                </select>
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="border-border bg-background rounded-md border px-3 py-2 text-sm"
                >
                  <option value="all">All risks</option>
                  <option value="any-risk">Any risk</option>
                  <option value="high">High risk</option>
                  <option value="medium">Medium risk</option>
                  <option value="credits-expiring">Credits expiring</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Member list */}
        <div className="space-y-2">
          {filtered.map((member) => (
            <MemberRow key={member.id} member={member} />
          ))}
          {!loading && filtered.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="text-muted-foreground mx-auto mb-3 h-8 w-8" />
                <p className="text-muted-foreground">
                  {error ? "Unable to load members." : "No members match your filters."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function MemberRow({ member }: { member: AdminMember }) {
  const statusConfig = STATUS_CONFIG[member.status];
  const riskStatus = getAtRiskStatus(member);

  return (
    <Link href={`/admin/members/${member.id}`}>
      <Card
        className={`hover:border-brand-accent/30 cursor-pointer transition-colors ${riskStatus === "high" ? "border-amber-300/50" : ""}`}
      >
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="bg-brand-accent text-brand-white flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm">
              {member.avatarInitials}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm">
                  {member.firstName} {member.lastName}
                </p>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                {riskStatus && (
                  <Badge
                    className={
                      riskStatus === "high"
                        ? "border-red-200 bg-red-50 text-xs text-red-700"
                        : riskStatus === "medium"
                          ? "border-amber-200 bg-amber-50 text-xs text-amber-700"
                          : "border-orange-200 bg-orange-50 text-xs text-orange-700"
                    }
                  >
                    <AlertTriangle className="mr-0.5 h-3 w-3" />
                    {riskStatus === "high"
                      ? "High risk"
                      : riskStatus === "medium"
                        ? "At risk"
                        : "Credits expiring"}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground truncate text-xs">
                {member.email} · {member.membershipLabel}
              </p>
            </div>

            {/* Role badges */}
            <div className="hidden flex-shrink-0 items-center gap-1 sm:flex">
              {member.isInstructor && (
                <Badge className="border-brand-dark/30 bg-brand-dark/10 text-brand-dark text-xs">
                  <Shield className="mr-0.5 h-3 w-3" />
                  Instructor
                </Badge>
              )}
              {member.isCoachingClient && (
                <Badge className="border-amber-200 bg-amber-50 text-xs text-amber-700">
                  <UserCheck className="mr-0.5 h-3 w-3" />
                  Coaching
                </Badge>
              )}
            </div>

            {/* Stats */}
            <div className="text-muted-foreground hidden items-center gap-6 text-sm md:flex">
              <div className="text-center">
                <p className="text-brand-dark">{member.totalBookings}</p>
                <p className="text-xs">bookings</p>
              </div>
              <div className="text-center">
                <p className="text-brand-dark">{member.creditBalance}</p>
                <p className="text-xs">credits</p>
              </div>
              <div className="text-center">
                <p className="text-brand-dark">{member.referralsCount}</p>
                <p className="text-xs">referrals</p>
              </div>
            </div>

            {/* Tags (desktop) */}
            <div className="hidden flex-shrink-0 items-center gap-1 lg:flex">
              {member.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {member.tags.length > 2 && (
                <span className="text-muted-foreground text-xs">+{member.tags.length - 2}</span>
              )}
            </div>

            <ChevronRight className="text-muted-foreground h-4 w-4 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
