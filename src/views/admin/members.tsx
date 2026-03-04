"use client";

import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import Link from "next/link";
import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ChevronRight,
  Users,
  UserCheck,
  UserX,
  Pause,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { adminMembers, type AdminMember } from "../../data/admin-data";

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  active: { label: "Active", variant: "default" },
  paused: { label: "Paused", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  expired: { label: "Expired", variant: "outline" },
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");

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
  }, []);

  const filtered = useMemo(() => {
    return adminMembers.filter((m) => {
      const matchesSearch =
        search === "" ||
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        m.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "all" || m.status === statusFilter;
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
  }, [search, statusFilter, planFilter, roleFilter, riskFilter]);

  const statusCounts = useMemo(() => {
    const counts = { active: 0, paused: 0, cancelled: 0, expired: 0 };
    adminMembers.forEach((m) => {
      counts[m.status]++;
    });
    return counts;
  }, []);

  return (
    <AdminLayout title="Members - Admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl text-[#2E1F33]">Members</h1>
          <p className="text-muted-foreground mt-1">
            {adminMembers.length} total members · {statusCounts.active} active
          </p>
        </div>

        {/* Stat pills */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-full bg-[#4B5B32]/10 px-4 py-2 text-sm">
            <UserCheck className="h-4 w-4 text-[#4B5B32]" />
            <span>{statusCounts.active} active</span>
          </div>
          <div className="bg-secondary flex items-center gap-2 rounded-full px-4 py-2 text-sm">
            <Pause className="text-muted-foreground h-4 w-4" />
            <span>{statusCounts.paused} paused</span>
          </div>
          <div className="bg-secondary flex items-center gap-2 rounded-full px-4 py-2 text-sm">
            <UserX className="text-muted-foreground h-4 w-4" />
            <span>{statusCounts.expired + statusCounts.cancelled} lapsed</span>
          </div>
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
                  <option value="unlimited">Unlimited</option>
                  <option value="committed">Committed</option>
                  <option value="steady">Steady</option>
                  <option value="none">No plan</option>
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
          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="text-muted-foreground mx-auto mb-3 h-8 w-8" />
                <p className="text-muted-foreground">No members match your filters.</p>
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
        className={`cursor-pointer transition-colors hover:border-[#4B5B32]/30 ${riskStatus === "high" ? "border-amber-300/50" : ""}`}
      >
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#4B5B32] text-sm text-[#FAFAF8]">
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
                <Badge className="border-[#2E1F33]/30 bg-[#2E1F33]/10 text-xs text-[#2E1F33]">
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
                <p className="text-[#2E1F33]">{member.totalBookings}</p>
                <p className="text-xs">bookings</p>
              </div>
              <div className="text-center">
                <p className="text-[#2E1F33]">{member.creditBalance}</p>
                <p className="text-xs">credits</p>
              </div>
              <div className="text-center">
                <p className="text-[#2E1F33]">{member.referralsCount}</p>
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
