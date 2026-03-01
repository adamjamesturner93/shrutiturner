"use client";

import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import Link from "next/link";
import {
  Mountain,
  MapPin,
  Calendar,
  Users,
  PoundSterling,
  ChevronRight,
} from "lucide-react";
import { adminRetreats, type AdminRetreat } from "../../data/admin-data";
import { CreateRetreatModal } from "../../components/admin/create-retreat-modal";
import { useState } from "react";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  open: { label: "Open", variant: "default" },
  "sold-out": { label: "Sold Out", variant: "destructive" },
  completed: { label: "Completed", variant: "outline" },
  draft: { label: "Draft", variant: "secondary" },
};

export function AdminRetreats() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const totalRevenue = adminRetreats.reduce((s, r) => s + r.revenue, 0);
  const totalBooked = adminRetreats.reduce((s, r) => s + r.bookedSpaces, 0);

  return (
    <AdminLayout title="Retreats - Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl text-[#2E1F33]">Retreat Management</h1>
            <p className="text-muted-foreground mt-1">
              {adminRetreats.length} retreats · {totalBooked} total bookings · £
              {totalRevenue.toLocaleString()} revenue
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#4B5B32] hover:bg-[#4B5B32]/90"
          >
            <Mountain className="w-4 h-4 mr-2" />
            Create Retreat
          </Button>
        </div>

        <CreateRetreatModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onCreate={(data) => {
            console.log("Created retreat:", data);
          }}
        />

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Mountain className="w-5 h-5 text-[#4B5B32]" />
                <div>
                  <p className="text-2xl text-[#2E1F33]">{adminRetreats.length}</p>
                  <p className="text-xs text-muted-foreground">Total retreats</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#4B5B32]" />
                <div>
                  <p className="text-2xl text-[#2E1F33]">{totalBooked}</p>
                  <p className="text-xs text-muted-foreground">Total bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <PoundSterling className="w-5 h-5 text-[#4B5B32]" />
                <div>
                  <p className="text-2xl text-[#2E1F33]">
                    £{totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Total revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Retreat cards */}
        <div className="space-y-4">
          {adminRetreats.map((retreat) => (
            <RetreatCard key={retreat.id} retreat={retreat} />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

function RetreatCard({ retreat }: { retreat: AdminRetreat }) {
  const statusConfig = STATUS_CONFIG[retreat.status];
  const fillPercent = Math.round(
    (retreat.bookedSpaces / retreat.totalSpaces) * 100
  );

  return (
    <Link href={`/admin/retreats/${retreat.id}`}>
      <Card className="hover:border-[#4B5B32]/30 transition-colors cursor-pointer">
        <CardContent className="py-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#4B5B32]/10 flex items-center justify-center flex-shrink-0">
              <Mountain className="w-6 h-6 text-[#4B5B32]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-base">{retreat.title}</p>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {retreat.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(retreat.startDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  -{" "}
                  {new Date(retreat.endDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              {/* Capacity */}
              <div className="mt-3 flex items-center gap-4">
                <div className="flex-1 max-w-48">
                  <div className="flex justify-between text-xs mb-1">
                    <span>
                      {retreat.bookedSpaces}/{retreat.totalSpaces} booked
                    </span>
                    <span className="text-muted-foreground">{fillPercent}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        fillPercent >= 90
                          ? "bg-destructive"
                          : fillPercent >= 70
                          ? "bg-amber-500"
                          : "bg-[#4B5B32]"
                      }`}
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-[#4B5B32]">
                  £{retreat.revenue.toLocaleString()}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}