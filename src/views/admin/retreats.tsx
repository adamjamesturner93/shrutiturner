"use client";

import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import Link from "next/link";
import { Mountain, MapPin, Calendar, Users, PoundSterling, ChevronRight } from "lucide-react";
import { adminRetreats, type AdminRetreat } from "../../data/admin-data";
import { CreateRetreatModal } from "../../components/admin/create-retreat-modal";
import { useState } from "react";

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
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
            <h1 className="text-brand-dark text-2xl">Retreat Management</h1>
            <p className="text-muted-foreground mt-1">
              {adminRetreats.length} retreats · {totalBooked} total bookings · £
              {totalRevenue.toLocaleString()} revenue
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-brand-accent hover:bg-brand-accent/90"
          >
            <Mountain className="mr-2 h-4 w-4" />
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Mountain className="text-brand-accent h-5 w-5" />
                <div>
                  <p className="text-brand-dark text-2xl">{adminRetreats.length}</p>
                  <p className="text-muted-foreground text-xs">Total retreats</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="text-brand-accent h-5 w-5" />
                <div>
                  <p className="text-brand-dark text-2xl">{totalBooked}</p>
                  <p className="text-muted-foreground text-xs">Total bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <PoundSterling className="text-brand-accent h-5 w-5" />
                <div>
                  <p className="text-brand-dark text-2xl">£{totalRevenue.toLocaleString()}</p>
                  <p className="text-muted-foreground text-xs">Total revenue</p>
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
  const fillPercent = Math.round((retreat.bookedSpaces / retreat.totalSpaces) * 100);

  return (
    <Link href={`/admin/retreats/${retreat.id}`}>
      <Card className="hover:border-brand-accent/30 cursor-pointer transition-colors">
        <CardContent className="py-5">
          <div className="flex items-start gap-4">
            <div className="bg-brand-accent/10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg">
              <Mountain className="text-brand-accent h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base">{retreat.title}</p>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              </div>
              <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {retreat.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
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
                <div className="max-w-48 flex-1">
                  <div className="mb-1 flex justify-between text-xs">
                    <span>
                      {retreat.bookedSpaces}/{retreat.totalSpaces} booked
                    </span>
                    <span className="text-muted-foreground">{fillPercent}%</span>
                  </div>
                  <div className="bg-secondary h-2 overflow-hidden rounded-full">
                    <div
                      className={`h-full rounded-full ${
                        fillPercent >= 90
                          ? "bg-destructive"
                          : fillPercent >= 70
                            ? "bg-amber-500"
                            : "bg-brand-accent"
                      }`}
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
                </div>
                <span className="text-brand-accent text-sm">
                  £{retreat.revenue.toLocaleString()}
                </span>
              </div>
            </div>
            <ChevronRight className="text-muted-foreground mt-1 h-4 w-4 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
