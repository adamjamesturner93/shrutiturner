"use client";

import { useState } from "react";
import { AlertCircle, Clock3, PlayCircle, Trash2, Video } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ReplayAssetSummaryDto, ReplayPlaybackAccessDto } from "@/lib/api/types";

function formatDateTime(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusLabel(status: ReplayAssetSummaryDto["status"]) {
  if (status === "ready") return "Ready";
  if (status === "processing") return "Processing";
  if (status === "delete_pending") return "Delete pending";
  if (status === "deleted") return "Deleted";
  if (status === "sync_failed") return "Sync failed";
  return "Delete failed";
}

export function DashboardReplays({ initialData }: { initialData: ReplayAssetSummaryDto[] }) {
  const [openingReplayId, setOpeningReplayId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const openReplay = async (replayId: string) => {
    setOpeningReplayId(replayId);
    setError("");
    try {
      const response = await fetch(`/api/me/replays/${replayId}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | ReplayPlaybackAccessDto
        | { message?: string }
        | null;
      if (!response.ok || !payload || !("playbackUrl" in payload)) {
        throw new Error(
          payload && "message" in payload && payload.message
            ? payload.message
            : "Replay is not available right now."
        );
      }
      window.open(payload.playbackUrl, "_blank", "noopener,noreferrer");
    } catch (openError) {
      setError(
        openError instanceof Error ? openError.message : "Replay is not available right now."
      );
    } finally {
      setOpeningReplayId(null);
    }
  };

  return (
    <DashboardLayout title="Replays - Private Studio">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl">Replays</h1>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            Watch available class and small-group programme recordings here. Access ends at the
            relevant replay cutoff and the recording is then queued for deletion.
          </p>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {initialData.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Video className="text-muted-foreground mx-auto mb-3 h-8 w-8" />
              <p className="text-muted-foreground">
                No replays are currently available on your account.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {initialData.map((replay) => {
              const startsAtLabel = formatDateTime(replay.startsAt);
              const endsAtLabel = formatDateTime(replay.entitlementEndsAt);
              const deleteAfterLabel = formatDateTime(replay.deleteAfterAt);
              const deletedAtLabel = formatDateTime(replay.deletedAt);

              return (
                <Card key={replay.id} className="border-brand-accent/20">
                  <CardHeader className="gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={replay.canPlay ? "default" : "outline"}>
                        {statusLabel(replay.status)}
                      </Badge>
                      <Badge variant="outline">{replay.accessType.replaceAll("_", " ")}</Badge>
                    </div>
                    <CardTitle className="text-xl">{replay.title}</CardTitle>
                    {replay.subtitle ? (
                      <p className="text-muted-foreground text-sm">{replay.subtitle}</p>
                    ) : null}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 text-sm md:grid-cols-3">
                      <div>
                        <p className="text-muted-foreground text-xs tracking-wide uppercase">
                          Session
                        </p>
                        <p className="mt-1">{startsAtLabel || "Date pending"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs tracking-wide uppercase">
                          Replay access ends
                        </p>
                        <p className="mt-1">{endsAtLabel || "Owner-admin only"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs tracking-wide uppercase">
                          Deletion policy
                        </p>
                        <p className="mt-1">{deleteAfterLabel || "Pending policy resolution"}</p>
                      </div>
                    </div>

                    {replay.isExpired ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                        <Clock3 className="mr-2 inline h-4 w-4" />
                        Playback access has ended. The recording remains blocked even if deletion is
                        still retrying.
                      </div>
                    ) : null}

                    {replay.status === "processing" ? (
                      <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
                        <Clock3 className="mr-2 inline h-4 w-4" />
                        Replay processing is still in progress.
                      </div>
                    ) : null}

                    {replay.status === "sync_failed" || replay.status === "delete_failed" ? (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        <AlertCircle className="mr-2 inline h-4 w-4" />
                        Replay handling hit an internal error. Owner-admin can review and retry from
                        admin tooling.
                      </div>
                    ) : null}

                    {replay.status === "deleted" ? (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                        <Trash2 className="mr-2 inline h-4 w-4" />
                        Deleted {deletedAtLabel || "recently"}.
                      </div>
                    ) : null}

                    <div className="flex justify-end">
                      <Button
                        onClick={() => openReplay(replay.id)}
                        disabled={!replay.canPlay || openingReplayId === replay.id}
                      >
                        <PlayCircle className="mr-2 h-4 w-4" />
                        {openingReplayId === replay.id ? "Opening..." : "Open replay"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
