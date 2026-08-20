"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AppPageHeader } from "@/components/app-surface";
import { InlineLoadingStatus } from "@/components/loading-region";

type AuditRow = {
  id: string;
  createdAt: string;
  actionType: string;
  targetType: string;
  targetId: string | null;
  reason: string | null;
  requestPath?: string | null;
  requestIp?: string | null;
  metadataJson?: Record<string, unknown> | null;
  actor: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
};

export function AdminAuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionType, setActionType] = useState("");
  const [targetType, setTargetType] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (actionType.trim()) params.set("actionType", actionType.trim());
      if (targetType.trim()) params.set("targetType", targetType.trim());
      const response = await fetch(`/api/admin/audit?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) {
        if (active) setLoading(false);
        return;
      }
      const payload = (await response.json()) as { success: true; data: AuditRow[] };
      if (active) {
        setRows(payload.data);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [actionType, targetType]);

  const csvHref = `/api/admin/audit?format=csv${actionType ? `&actionType=${encodeURIComponent(actionType)}` : ""}${targetType ? `&targetType=${encodeURIComponent(targetType)}` : ""}`;

  return (
    <AdminLayout title="Audit Log - Shruti Turner">
      <div className="space-y-6">
        <AppPageHeader
          eyebrow="Admin audit"
          title="Audit Log"
          description="Append-only record of admin actions, privacy operations and platform setting changes."
        />

        <Card>
          <CardHeader className="flex flex-row items-end justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Filters</CardTitle>
            </div>
            <Button asChild variant="outline">
              <a href={csvHref}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </a>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Input
              value={actionType}
              onChange={(event) => setActionType(event.target.value)}
              placeholder="Filter by action type"
            />
            <Input
              value={targetType}
              onChange={(event) => setTargetType(event.target.value)}
              placeholder="Filter by target type"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <InlineLoadingStatus label="Loading audit log…" /> : null}
            {!loading && !rows.length ? (
              <p className="text-muted-foreground text-sm">No audit entries found.</p>
            ) : null}
            {rows.map((row) => (
              <div key={row.id} className="rounded-lg border p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">{row.actionType}</div>
                  <div className="text-muted-foreground">
                    {new Date(row.createdAt).toLocaleString("en-GB")}
                  </div>
                </div>
                <div className="text-muted-foreground mt-2">
                  {row.actor.firstName || row.actor.lastName
                    ? `${row.actor.firstName || ""} ${row.actor.lastName || ""}`.trim()
                    : row.actor.email}
                </div>
                <div className="mt-2">
                  {row.targetType}
                  {row.targetId ? ` · ${row.targetId}` : ""}
                </div>
                {row.reason ? <div className="mt-2">{row.reason}</div> : null}
                {row.requestPath ? (
                  <div className="text-muted-foreground mt-2 text-xs">
                    {row.requestPath}
                    {row.requestIp ? ` · ${row.requestIp}` : ""}
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
