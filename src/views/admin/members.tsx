"use client";

import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { Search, ChevronRight, Users, UserCheck, UserX, Pause, Shield } from "lucide-react";
import type { AdminMemberListItemDto } from "@/lib/api/types";
import { AppMetricCard, AppMetricGrid, AppPageHeader } from "@/components/app-surface";

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

export function AdminMembers() {
  const [adminMembers, setAdminMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

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

  const filtered = useMemo(() => {
    return adminMembers.filter((m) => {
      const matchesSearch =
        search === "" ||
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "lapsed"
          ? m.status === "expired" || m.status === "cancelled"
          : m.status === statusFilter);
      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "instructor" && m.isInstructor) ||
        (roleFilter === "coaching" && m.isCoachingClient);
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [adminMembers, search, statusFilter, roleFilter]);

  const statusCounts = useMemo(() => {
    const counts = { active: 0, paused: 0, cancelled: 0, expired: 0, past_due: 0 };
    adminMembers.forEach((m) => {
      counts[m.status as keyof typeof counts]++;
    });
    return counts;
  }, [adminMembers]);

  const coachingClientCount = useMemo(
    () => adminMembers.filter((member) => member.isCoachingClient).length,
    [adminMembers]
  );

  return (
    <AdminLayout title="Members - Admin">
      <div className="space-y-6">
        <AppPageHeader
          eyebrow="Member operations"
          title="Members"
          description={`${adminMembers.length} total members · ${statusCounts.active} active`}
          meta={loading ? "Loading members..." : undefined}
        />
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

        <AppMetricGrid className="lg:grid-cols-4">
          <AppMetricCard
            label="Active"
            value={statusCounts.active}
            detail="currently active members"
          />
          <AppMetricCard label="Paused" value={statusCounts.paused} detail="temporarily paused" />
          <AppMetricCard
            label="Lapsed"
            value={statusCounts.expired + statusCounts.cancelled}
            detail="cancelled or expired"
          />
          <AppMetricCard
            label="Coaching clients"
            value={coachingClientCount}
            detail="linked to a 1:1 profile"
          />
        </AppMetricGrid>

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
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <select
                  aria-label="Filter members by status"
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
                  aria-label="Filter members by role"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="border-border bg-background rounded-md border px-3 py-2 text-sm"
                >
                  <option value="all">All roles</option>
                  <option value="instructor">Instructors</option>
                  <option value="coaching">Coaching clients</option>
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

  return (
    <Link href={`/admin/members/${member.id}`}>
      <Card className="hover:border-brand-accent/30 cursor-pointer transition-colors">
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
                <p className="text-brand-dark">{member.referralsCount}</p>
                <p className="text-xs">referrals</p>
              </div>
            </div>

            <ChevronRight className="text-muted-foreground h-4 w-4 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
