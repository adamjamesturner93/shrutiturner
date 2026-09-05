"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, BedDouble, Plus, Save, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminRetreatVenueDto } from "@/lib/api/types";

type RoomGroupDraft = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  capacityPerRoom: number;
  bedSetup: string;
  allowShared: boolean;
  privateGuestCounts: number[];
  roomNamesText: string;
};

function draftFromVenue(venue: AdminRetreatVenueDto): RoomGroupDraft[] {
  return venue.roomGroups.map((group) => ({
    ...group,
    roomNamesText: group.roomNames.join("\n"),
  }));
}

function newRoomGroup(): RoomGroupDraft {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    quantity: 1,
    capacityPerRoom: 2,
    bedSetup: "fixed_twin",
    allowShared: true,
    privateGuestCounts: [1, 2],
    roomNamesText: "",
  };
}

export function AdminRetreatVenues({ initialData }: { initialData: AdminRetreatVenueDto[] }) {
  const [venues, setVenues] = useState(initialData);
  const [drafts, setDrafts] = useState<Record<string, RoomGroupDraft[]>>(
    Object.fromEntries(initialData.map((venue) => [venue.contentfulVenueId, draftFromVenue(venue)]))
  );
  const [savingVenueId, setSavingVenueId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateGroup(
    venueId: string,
    groupId: string,
    update: (group: RoomGroupDraft) => RoomGroupDraft
  ) {
    setDrafts((current) => ({
      ...current,
      [venueId]: (current[venueId] || []).map((group) =>
        group.id === groupId ? update(group) : group
      ),
    }));
  }

  async function saveVenue(venueId: string) {
    setSavingVenueId(venueId);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/retreats/venues/${venueId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomGroups: (drafts[venueId] || []).map((group) => ({
            name: group.name,
            description: group.description,
            quantity: group.quantity,
            capacityPerRoom: group.capacityPerRoom,
            bedSetup: group.bedSetup,
            allowShared: group.allowShared,
            privateGuestCounts: group.privateGuestCounts,
            roomNames: group.roomNamesText
              .split(/\r?\n/)
              .map((name) => name.trim())
              .filter(Boolean),
          })),
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | AdminRetreatVenueDto
        | { message?: string }
        | null;
      if (!response.ok) {
        throw new Error(
          payload && "message" in payload ? payload.message : "Unable to save venue."
        );
      }
      const venue = payload as AdminRetreatVenueDto;
      setVenues((current) =>
        current.map((candidate) =>
          candidate.contentfulVenueId === venue.contentfulVenueId ? venue : candidate
        )
      );
      setDrafts((current) => ({ ...current, [venueId]: draftFromVenue(venue) }));
      setMessage(`${venue.name} room setup saved.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save venue.");
    } finally {
      setSavingVenueId("");
    }
  }

  return (
    <AdminLayout title="Retreat venue rooms - Admin">
      <div className="space-y-6">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-3 -ml-3">
            <Link href="/admin/retreats">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retreats
            </Link>
          </Button>
          <h1 className="text-brand-dark text-2xl">Venue room setup</h1>
          <p className="text-muted-foreground mt-1 max-w-3xl">
            Venue copy stays in Contentful. Add the real rooms here once, then each new retreat can
            set its own prices without creating duplicate stock.
          </p>
        </div>

        {message ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}
        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        ) : null}

        {venues.map((venue) => {
          const groups = drafts[venue.contentfulVenueId] || [];
          return (
            <Card key={venue.contentfulVenueId}>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>{venue.name}</CardTitle>
                  <p className="text-muted-foreground mt-1 text-sm">{venue.displayLocation}</p>
                </div>
                <Badge variant={venue.configured ? "default" : "secondary"}>
                  {venue.configured ? "Rooms configured" : "Setup needed"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-5">
                {groups.map((group, groupIndex) => (
                  <fieldset key={group.id} className="space-y-4 rounded-xl border p-4">
                    <legend className="px-2 font-medium">Room group {groupIndex + 1}</legend>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`${group.id}-name`}>Group name</Label>
                        <Input
                          id={`${group.id}-name`}
                          value={group.name}
                          placeholder="Convertible king/twin"
                          onChange={(event) =>
                            updateGroup(venue.contentfulVenueId, group.id, (current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${group.id}-layout`}>Bed setup</Label>
                        <select
                          id={`${group.id}-layout`}
                          value={group.bedSetup}
                          onChange={(event) =>
                            updateGroup(venue.contentfulVenueId, group.id, (current) => ({
                              ...current,
                              bedSetup: event.target.value,
                              allowShared:
                                event.target.value === "fixed_double" ||
                                event.target.value === "single"
                                  ? false
                                  : current.allowShared,
                            }))
                          }
                          className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                        >
                          <option value="fixed_double">Fixed double/king</option>
                          <option value="fixed_twin">Fixed twin</option>
                          <option value="convertible_double_twin">Convertible double/twin</option>
                          <option value="single">Single</option>
                          <option value="bunk_or_dorm">Bunk or dorm</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${group.id}-description`}>Public description</Label>
                      <Textarea
                        id={`${group.id}-description`}
                        value={group.description}
                        onChange={(event) =>
                          updateGroup(venue.contentfulVenueId, group.id, (current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`${group.id}-quantity`}>Number of rooms</Label>
                        <Input
                          id={`${group.id}-quantity`}
                          type="number"
                          min="1"
                          max="100"
                          value={group.quantity}
                          onChange={(event) =>
                            updateGroup(venue.contentfulVenueId, group.id, (current) => ({
                              ...current,
                              quantity: Number(event.target.value),
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${group.id}-capacity`}>Guests each room can sleep</Label>
                        <Input
                          id={`${group.id}-capacity`}
                          type="number"
                          min="1"
                          max="20"
                          value={group.capacityPerRoom}
                          onChange={(event) =>
                            updateGroup(venue.contentfulVenueId, group.id, (current) => {
                              const capacity = Number(event.target.value);
                              return {
                                ...current,
                                capacityPerRoom: capacity,
                                privateGuestCounts: current.privateGuestCounts.filter(
                                  (count) => count <= capacity
                                ),
                              };
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Default selling options</p>
                      <label className="flex items-center gap-3 text-sm">
                        <Checkbox
                          checked={group.allowShared}
                          disabled={
                            group.bedSetup === "fixed_double" ||
                            group.bedSetup === "single" ||
                            group.capacityPerRoom < 2
                          }
                          onCheckedChange={(checked) =>
                            updateGroup(venue.contentfulVenueId, group.id, (current) => ({
                              ...current,
                              allowShared: checked === true,
                            }))
                          }
                        />
                        Sell individual shared places
                      </label>
                      <div>
                        <p className="text-muted-foreground mb-2 text-xs">
                          Allow a private-room booking for:
                        </p>
                        <div className="flex flex-wrap gap-4">
                          {Array.from(
                            { length: Math.max(group.capacityPerRoom, 0) },
                            (_, index) => index + 1
                          ).map((count) => (
                            <label key={count} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={group.privateGuestCounts.includes(count)}
                                onCheckedChange={(checked) =>
                                  updateGroup(venue.contentfulVenueId, group.id, (current) => ({
                                    ...current,
                                    privateGuestCounts:
                                      checked === true
                                        ? [...new Set([...current.privateGuestCounts, count])].sort(
                                            (a, b) => a - b
                                          )
                                        : current.privateGuestCounts.filter(
                                            (value) => value !== count
                                          ),
                                  }))
                                }
                              />
                              {count} {count === 1 ? "guest" : "guests"}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${group.id}-rooms`}>
                        Room names (optional, one per line)
                      </Label>
                      <Textarea
                        id={`${group.id}-rooms`}
                        value={group.roomNamesText}
                        placeholder={`${group.name || "Room"} 1\n${group.name || "Room"} 2`}
                        onChange={(event) =>
                          updateGroup(venue.contentfulVenueId, group.id, (current) => ({
                            ...current,
                            roomNamesText: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDrafts((current) => ({
                          ...current,
                          [venue.contentfulVenueId]: groups.filter(
                            (candidate) => candidate.id !== group.id
                          ),
                        }))
                      }
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Remove group
                    </Button>
                  </fieldset>
                ))}
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setDrafts((current) => ({
                        ...current,
                        [venue.contentfulVenueId]: [...groups, newRoomGroup()],
                      }))
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add room group
                  </Button>
                  <Button
                    type="button"
                    disabled={savingVenueId !== "" || groups.length === 0}
                    onClick={() => void saveVenue(venue.contentfulVenueId)}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {savingVenueId === venue.contentfulVenueId ? "Saving..." : "Save venue rooms"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {venues.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <BedDouble className="text-muted-foreground mx-auto h-8 w-8" />
              <p className="text-muted-foreground mt-3">
                Publish an in-person retreat venue in Contentful first.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AdminLayout>
  );
}
