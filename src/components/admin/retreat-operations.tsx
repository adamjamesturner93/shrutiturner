"use client";
import { useState } from "react";
import Link from "next/link";
import type { AdminRetreatDetailDto, AdminRetreatAttendeeDto } from "@/lib/api/types";
import {
  getBookingBalance,
  isConfirmedRetreatBooking,
  REGISTRATION_LABELS,
} from "@/lib/retreats/operations";
import { getBedPreferenceLabel } from "@/lib/retreats/bed-preference";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Booking = AdminRetreatDetailDto["bookings"][number];
const money = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
export function bookingGuests(booking: Booking): AdminRetreatAttendeeDto[] {
  const attendees = [...(booking.attendees || [])];
  const expected = Math.max(booking.attendeeCount || 1, 1);
  while (attendees.length < expected) {
    const index = attendees.length;
    attendees.push({
      id: "",
      bookingId: booking.id,
      name: index === 0 ? booking.attendeeName : `Guest ${index + 1} — details needed`,
      email: index === 0 ? booking.attendeeEmail : "",
      isPrimary: index === 0,
      accountLinked: false,
      status: "pending_claim",
      complete: false,
      missing: ["guest_details"],
      phone: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      dietaryRequirements: "",
      mobilityNeeds: "",
      practicalConfirmedAt: null,
      invitations: [],
    });
  }
  return attendees;
}

export function RetreatOperationsOverview({
  retreat,
  navigate,
}: {
  retreat: AdminRetreatDetailDto;
  navigate: (section: string, filter?: string) => void;
}) {
  const confirmed = retreat.bookings.filter((booking) =>
    isConfirmedRetreatBooking(booking.bookingStatus)
  );
  const guests = confirmed.flatMap(bookingGuests);
  const missing = guests.filter((guest) => !guest.complete).length;
  const balances = confirmed.map((booking) => getBookingBalance(booking));
  const usesLiveRoom = retreat.eventKind === "online_workshop";
  const requiresAccommodation = retreat.eventKind === "residential_retreat";
  const metrics = [
    {
      label: "Confirmed guests",
      value: `${guests.length} / ${retreat.capacity}`,
      section: "attendees",
    },
    { label: "Confirmed bookings", value: String(confirmed.length), section: "attendees" },
    {
      label: "Registrations needed",
      value: String(missing),
      section: "attendees",
      filter: "incomplete",
    },
    {
      label: usesLiveRoom
        ? "Live session"
        : requiresAccommodation
          ? "Unassigned bookings"
          : "Registrations complete",
      value: usesLiveRoom
        ? retreat.liveRoomPrepared
          ? "Prepared"
          : "Not prepared"
        : requiresAccommodation
          ? String(confirmed.filter((booking) => !booking.roomUnitId).length)
          : `${guests.length - missing} / ${guests.length}`,
      section: usesLiveRoom || requiresAccommodation ? "delivery" : "attendees",
      filter: requiresAccommodation ? "unassigned" : missing ? "incomplete" : "confirmed",
    },
    {
      label: "Outstanding balance",
      value: money(balances.reduce((sum, balance) => sum + balance.outstandingPence, 0)),
      section: "payments",
    },
    {
      label: "Overdue",
      value: money(balances.reduce((sum, balance) => sum + balance.overduePence, 0)),
      section: "payments",
      filter: "overdue",
    },
  ];
  return (
    <section aria-labelledby="retreat-overview-title" className="space-y-5">
      <h2 id="retreat-overview-title" className="text-2xl">
        {retreat.status === "completed" ? "Event wrap-up" : "At a glance"}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <button
            key={metric.label}
            type="button"
            onClick={() => navigate(metric.section, metric.filter)}
            className="marketing-panel rounded-2xl border p-5 text-left focus-visible:ring-2"
          >
            <span className="block text-2xl font-medium">{metric.value}</span>
            <span className="text-muted-foreground text-sm">{metric.label}</span>
          </button>
        ))}
      </div>
      <p className="text-muted-foreground text-sm">
        Counts exclude cancelled bookings and unfinished checkouts. Payment totals refer to
        confirmed bookings; gifts and refunds are listed under Payments.
      </p>
      {missing > 0 ? (
        <div className="rounded-xl border p-5">
          <h3 className="font-medium">Next: help your guests get ready</h3>
          <p className="my-2">
            {missing} {missing === 1 ? "person still needs" : "people still need"} to complete
            registration.
          </p>
          <Button onClick={() => navigate("attendees", "incomplete")}>
            Review incomplete registrations
          </Button>
        </div>
      ) : null}
    </section>
  );
}

export function RetreatTicketPrices({
  retreat,
  reload,
}: {
  retreat: AdminRetreatDetailDto;
  reload: () => Promise<void>;
}) {
  const [prices, setPrices] = useState(
    Object.fromEntries(
      retreat.ratePlans.map((rate) => [rate.id, String(rate.totalPricePence / 100)])
    )
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/retreats/${retreat.id}/ticket-prices`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rates: retreat.ratePlans.map((rate) => ({
            id: rate.id,
            pricePence: prices[rate.id]?.trim() ? Math.round(Number(prices[rate.id]) * 100) : null,
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      await reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="rounded-xl border p-5">
      <h2 className="text-xl">Ticket prices</h2>
      {retreat.ratePlans.map((rate) => (
        <div className="my-4" key={rate.id}>
          <Label htmlFor={`ticket-price-${rate.id}`}>
            {rate.roomLabel} · {rate.guestCount} guest(s) · total (£)
          </Label>
          {retreat.status === "draft" ? (
            <Input
              id={`ticket-price-${rate.id}`}
              type="number"
              min="0"
              step="0.01"
              value={prices[rate.id]}
              onChange={(event) => setPrices({ ...prices, [rate.id]: event.target.value })}
            />
          ) : (
            <p>{money(rate.totalPricePence)}</p>
          )}
        </div>
      ))}
      {retreat.status === "draft" ? (
        <>
          <p className="text-muted-foreground mb-3 text-sm">
            £0 means a free ticket. Save to confirm these prices before opening bookings.
          </p>
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? "Saving…" : "Save ticket prices"}
          </Button>
        </>
      ) : null}
      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function downloadRows(name: string, rows: string[][]) {
  const safeCell = (value: string) =>
    `"${(/^[=+@\-\t\r]/.test(value) ? "'" + value : value).replaceAll('"', '""')}"`;
  const url = URL.createObjectURL(
    new Blob([rows.map((row) => row.map(safeCell).join(",")).join("\r\n")], {
      type: "text/csv;charset=utf-8",
    })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function RetreatPaymentReminders({
  retreatId,
  disabled,
  onSend,
}: {
  retreatId: string;
  disabled: boolean;
  onSend: (mode: "due" | "chaser") => Promise<boolean>;
}) {
  const [mode, setMode] = useState<"due" | "chaser" | null>(null);
  const [recipients, setRecipients] = useState<
    Array<{ bookingId: string; name: string; email: string; amountPence: number }>
  >([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function preview(selectedMode: "due" | "chaser") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/retreats/${retreatId}/balance-emails`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Unable to preview payment emails.");
      const data = await response.json();
      setRecipients(data.recipients);
      setMode(selectedMode);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to load recipients.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <p className="font-medium">Balance emails</p>
      <p className="text-muted-foreground mt-1 text-sm">
        Review the purchaser and amount for each booking before sending.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant="outline" disabled={disabled || busy} onClick={() => void preview("due")}>
          Preview due emails
        </Button>
        <Button
          variant="outline"
          disabled={disabled || busy}
          onClick={() => void preview("chaser")}
        >
          Preview chasers
        </Button>
      </div>
      {error ? <p role="alert">{error}</p> : null}
      <Dialog
        open={mode !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setMode(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Send {mode === "chaser" ? "balance reminders" : "balance due emails"}?
            </DialogTitle>
            <DialogDescription>
              {recipients.length} booking(s) eligible. Eligibility is checked again when sending;
              paid bookings are skipped.
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-72 space-y-3 overflow-y-auto">
            {recipients.map((recipient) => (
              <li key={recipient.bookingId}>
                <p>
                  {recipient.name} · {money(recipient.amountPence)}
                </p>
                <p className="text-muted-foreground text-sm break-all">{recipient.email}</p>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setMode(null)}>
              Cancel
            </Button>
            <Button
              disabled={busy || !recipients.length}
              onClick={async () => {
                if (!mode) return;
                setBusy(true);
                try {
                  if (await onSend(mode)) setMode(null);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Sending…" : "Send emails"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function RetreatAttendeeWorkspace({
  retreat,
  initialFilter = "confirmed",
  roomsOnly = false,
  paymentsOnly = false,
  reload,
}: {
  retreat: AdminRetreatDetailDto;
  initialFilter?: string;
  roomsOnly?: boolean;
  paymentsOnly?: boolean;
  reload: () => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(initialFilter);
  const [view, setView] = useState("bookings");
  const [exportKind, setExportKind] = useState(
    paymentsOnly ? "payments" : roomsOnly ? "rooms" : "attendees"
  );
  const [invite, setInvite] = useState<AdminRetreatAttendeeDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const selected = retreat.bookings.filter((booking) => {
    const guests = bookingGuests(booking);
    if (filter !== "all" && !isConfirmedRetreatBooking(booking.bookingStatus)) return false;
    if (filter === "incomplete" && guests.every((guest) => guest.complete)) return false;
    if (filter === "unassigned" && booking.roomUnitId) return false;
    if (filter === "outstanding" && !getBookingBalance(booking).outstandingPence) return false;
    if (filter === "overdue" && !getBookingBalance(booking).overduePence) return false;
    return `${booking.id} ${booking.purchaserName} ${booking.purchaserEmail} ${guests.map((guest) => `${guest.name} ${guest.email}`).join(" ")}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });
  async function sendInvite() {
    if (!invite) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `/api/admin/retreats/${retreat.id}/attendees/${invite.id}/invite`,
        { method: "POST" }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to send invitation.");
      setNotice(
        result.skipped
          ? "An invitation was requested recently. Please wait a minute before resending."
          : "Invitation requested. Delivery status appears in the guest details."
      );
      setInvite(null);
      await reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to send invitation.");
    } finally {
      setBusy(false);
    }
  }
  async function assign(bookingId: string, roomUnitId: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/retreats/${retreat.id}/room-assignments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, roomUnitId: roomUnitId || null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to assign room.");
      await reload();
      setNotice("Room assignment saved.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to assign room.");
    } finally {
      setBusy(false);
    }
  }
  function exportCsv() {
    const rows: string[][] =
      exportKind === "payments"
        ? [
            ["Booking", "Purchaser", "Guests", "Paid", "Outstanding", "Overdue"],
            ...selected.map((booking) => [
              booking.id,
              booking.purchaserName,
              String(booking.attendeeCount),
              money(booking.depositPaidPence + booking.balancePaidPence),
              money(getBookingBalance(booking).outstandingPence),
              money(getBookingBalance(booking).overduePence),
            ]),
          ]
        : [
            [
              "Booking",
              "Guest",
              ...(exportKind === "catering"
                ? ["Dietary requirements", "Confirmed"]
                : exportKind === "rooms"
                  ? ["Room", "Bed arrangement"]
                  : ["Email", "Registration", "Purchaser"]),
            ],
            ...selected.flatMap((booking) =>
              bookingGuests(booking).map((guest) => [
                booking.id,
                guest.name,
                ...(exportKind === "catering"
                  ? [
                      guest.dietaryRequirements || "None recorded",
                      guest.practicalConfirmedAt ? "Yes" : "Not confirmed",
                    ]
                  : exportKind === "rooms"
                    ? [
                        booking.roomUnitLabel || "Unassigned",
                        getBedPreferenceLabel(booking.bedPreference),
                      ]
                    : [
                        guest.email,
                        guest.complete ? "Complete" : "Incomplete",
                        booking.purchaserName,
                      ]),
              ])
            ),
          ];
    downloadRows(`${retreat.retreatSlug}-${exportKind}.csv`, rows);
  }
  const renderGuest = (guest: AdminRetreatAttendeeDto, index: number, booking: Booking) => (
    <div key={guest.id || `${booking.id}-${index}`} className="rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{guest.name || `Guest ${index + 1}`}</p>
          <p className="text-muted-foreground text-sm">
            {guest.email || "Contact details not supplied"}
          </p>
        </div>
        <span className="bg-secondary rounded-md px-3 py-1 text-sm">
          {guest.status === "cancelled"
            ? "Cancelled"
            : guest.complete
              ? "Registration complete"
              : "Registration needed"}
        </span>
      </div>
      {!guest.complete && guest.missing.length ? (
        <p className="text-muted-foreground mt-2 text-sm">
          {guest.missing.map((item) => REGISTRATION_LABELS[item] || item).join(" · ")}
        </p>
      ) : null}
      {view === "people" ? (
        <p className="mt-2 text-sm">
          With{" "}
          {bookingGuests(booking)
            .filter((other) => other !== guest && other.id !== guest.id)
            .map((other) => other.name)
            .join(", ") || "no other guest"}{" "}
          · Booking {booking.id.slice(-8)}
        </p>
      ) : null}
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer py-2">Guest details and invitation history</summary>
        <dl className="grid gap-3 py-3 sm:grid-cols-2">
          <div>
            <dt>Account</dt>
            <dd>{guest.accountLinked ? "Linked" : "Not linked"}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{guest.phone || "Not provided"}</dd>
          </div>
          <div>
            <dt>Emergency contact</dt>
            <dd>
              {guest.emergencyContactName || "Not provided"} {guest.emergencyContactPhone}
            </dd>
          </div>
          <div>
            <dt>Dietary requirements</dt>
            <dd>{guest.dietaryRequirements || "None recorded"}</dd>
          </div>
          <div>
            <dt>Access requirements</dt>
            <dd>{guest.mobilityNeeds || "None recorded"}</dd>
          </div>
          <div>
            <dt>Practical details</dt>
            <dd>{guest.practicalConfirmedAt ? "Confirmed by attendee" : "Not yet confirmed"}</dd>
          </div>
        </dl>
        {guest.healthProfileHref ? (
          <Link className="mb-3 block underline" href={guest.healthProfileHref}>
            Open member profile and health declaration
          </Link>
        ) : null}
        <ul className="space-y-1">
          {guest.invitations.map((invitation) => (
            <li key={invitation.id}>
              {new Date(invitation.requestedAt).toLocaleString("en-GB")} ·{" "}
              {invitation.status.replaceAll("_", " ")} · {invitation.email}
            </li>
          ))}
        </ul>
        {!guest.invitations.length ? <p>No registration invitation recorded.</p> : null}
      </details>
      {guest.id &&
      guest.email &&
      !guest.complete &&
      isConfirmedRetreatBooking(booking.bookingStatus) &&
      !["completed", "cancelled"].includes(retreat.status) ? (
        <Button className="mt-3" variant="outline" disabled={busy} onClick={() => setInvite(guest)}>
          {guest.invitations.length ? "Send registration reminder" : "Send registration invitation"}
        </Button>
      ) : null}
    </div>
  );
  return (
    <section className="space-y-5" aria-labelledby="retreat-attendees-title">
      <h2 id="retreat-attendees-title" className="text-2xl">
        {roomsOnly
          ? "Rooming and guests"
          : paymentsOnly
            ? "Booking payments"
            : "Attendees & bookings"}
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="attendee-search">Search guests or purchaser</Label>
          <Input
            id="attendee-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="attendee-filter">Show</Label>
          <select
            id="attendee-filter"
            className="bg-background h-11 w-full rounded-md border px-3"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="confirmed">Confirmed bookings</option>
            <option value="incomplete">Registration needed</option>
            {retreat.eventKind === "residential_retreat" ? (
              <option value="unassigned">Room not assigned</option>
            ) : null}
            <option value="outstanding">Balance outstanding</option>
            <option value="overdue">Payment overdue</option>
            <option value="all">All, including cancelled and unfinished checkouts</option>
          </select>
        </div>
        <div hidden={roomsOnly || paymentsOnly}>
          <Label htmlFor="attendee-view">View</Label>
          <select
            id="attendee-view"
            className="bg-background h-11 w-full rounded-md border px-3"
            value={view}
            onChange={(event) => setView(event.target.value)}
          >
            <option value="bookings">Grouped by booking</option>
            <option value="people">Individual attendees</option>
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="retreat-export">Export current results</Label>
          <select
            id="retreat-export"
            className="bg-background block h-11 rounded-md border px-3"
            value={exportKind}
            onChange={(event) => setExportKind(event.target.value)}
          >
            <option value="attendees">Attendee list</option>
            {retreat.eventKind === "residential_retreat" ? (
              <option value="rooms">Rooming list</option>
            ) : null}
            {retreat.eventKind !== "online_workshop" ? (
              <option value="catering">Catering list</option>
            ) : null}
            <option value="payments">Payments</option>
          </select>
        </div>
        <Button variant="outline" onClick={exportCsv}>
          Export CSV
        </Button>
        <p className="text-muted-foreground text-sm">
          {selected.length} bookings ·{" "}
          {selected.reduce((sum, booking) => sum + booking.attendeeCount, 0)} guests
        </p>
      </div>
      {notice ? <p role="status">{notice}</p> : null}
      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : null}
      {!selected.length ? (
        <p className="rounded-xl border p-5">No bookings match these filters.</p>
      ) : null}
      {roomsOnly ? (
        <div className="grid gap-3 md:grid-cols-2" aria-label="Room occupancy">
          {retreat.roomUnits.map((room) => {
            const bookings = retreat.bookings.filter(
              (booking) =>
                booking.roomUnitId === room.id && isConfirmedRetreatBooking(booking.bookingStatus)
            );
            return (
              <section key={room.id} className="rounded-xl border p-4">
                <h3 className="font-medium">{room.label}</h3>
                <p className="text-muted-foreground text-sm">
                  {bookings.reduce((sum, booking) => sum + booking.attendeeCount, 0)} guests
                  assigned
                </p>
                {bookings.length ? (
                  bookings.map((booking) => (
                    <p key={booking.id} className="mt-2 text-sm">
                      {bookingGuests(booking)
                        .map((guest) => guest.name)
                        .join(" & ")}{" "}
                      · {getBedPreferenceLabel(booking.bedPreference)} · Booking{" "}
                      {booking.id.slice(-8)}
                    </p>
                  ))
                ) : (
                  <p className="mt-2 text-sm">No guests assigned</p>
                )}
              </section>
            );
          })}
        </div>
      ) : null}
      {view === "people" && !roomsOnly && !paymentsOnly
        ? selected.flatMap((booking) =>
            bookingGuests(booking)
              .filter((guest) => filter !== "incomplete" || !guest.complete)
              .map((guest, index) => renderGuest(guest, index, booking))
          )
        : selected.map((booking) => (
            <article
              key={booking.id}
              className="marketing-panel space-y-4 rounded-2xl border p-5"
              aria-label={`Booking for ${booking.purchaserName}`}
            >
              <header>
                <h3 className="text-lg font-medium">
                  Booking {booking.id.slice(-8)} · {booking.attendeeCount}{" "}
                  {booking.attendeeCount === 1 ? "guest" : "guests"}
                </h3>
                <p className="text-muted-foreground text-sm">
                  Purchased by {booking.purchaserName} · {booking.purchaserEmail} ·{" "}
                  {booking.bookingStatus.replaceAll("_", " ")}
                </p>
              </header>
              {!paymentsOnly && !roomsOnly ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {bookingGuests(booking).map((guest, index) => renderGuest(guest, index, booking))}
                </div>
              ) : (
                <p>
                  {bookingGuests(booking)
                    .map((guest) => guest.name)
                    .join(" & ")}
                </p>
              )}
              <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
                <div hidden={paymentsOnly}>
                  <p>
                    {booking.roomType}{" "}
                    {booking.bedPreference
                      ? `· ${getBedPreferenceLabel(booking.bedPreference)}`
                      : ""}
                  </p>
                  {retreat.eventKind === "residential_retreat" ? (
                    <>
                      <Label htmlFor={`room-${booking.id}`}>
                        Assigned room · {booking.attendeeCount} guests
                      </Label>
                      <select
                        id={`room-${booking.id}`}
                        className="bg-background mt-1 block min-h-11 w-full rounded-md border p-2"
                        value={booking.roomUnitId || ""}
                        disabled={busy || !isConfirmedRetreatBooking(booking.bookingStatus)}
                        onChange={(event) => void assign(booking.id, event.target.value)}
                      >
                        <option value="">Not assigned</option>
                        {retreat.roomUnits
                          .filter(
                            (unit) =>
                              unit.roomOptionId === booking.roomOptionId ||
                              Boolean(
                                booking.inventoryPoolId &&
                                unit.inventoryPoolId === booking.inventoryPoolId
                              )
                          )
                          .map((unit) => (
                            <option
                              key={unit.id}
                              value={unit.id}
                              disabled={
                                unit.id !== booking.roomUnitId &&
                                unit.occupiedUnits >= unit.capacityUnits
                              }
                            >
                              {unit.label}
                              {unit.id === booking.roomUnitId
                                ? " — assigned"
                                : unit.occupiedUnits >= unit.capacityUnits
                                  ? " — full"
                                  : " — available"}
                            </option>
                          ))}
                      </select>
                    </>
                  ) : retreat.eventKind === "online_workshop" ? (
                    <p className="text-sm">
                      {booking.liveAccessEnabled ? "Live access active" : "Live access inactive"}
                    </p>
                  ) : <p className="text-sm">In-person admission</p>}
                </div>
                <div hidden={roomsOnly}>
                  <p>
                    {money(booking.depositPaidPence + booking.balancePaidPence)} paid ·{" "}
                    {money(getBookingBalance(booking).outstandingPence)} outstanding
                  </p>
                  {getBookingBalance(booking).overduePence > 0 ? (
                    <p className="text-destructive text-sm">
                      {money(getBookingBalance(booking).overduePence)} overdue
                    </p>
                  ) : null}
                  <p className="text-muted-foreground text-sm">
                    Extras:{" "}
                    {booking.addons
                      .map((addon) => `${addon.name} × ${addon.quantity}`)
                      .join(", ") || "None"}
                  </p>
                  {paymentsOnly ? (
                    <ul className="mt-3 space-y-2 text-sm">
                      {booking.instalments.map((instalment) => (
                        <li key={instalment.id}>
                          {instalment.label} · {money(instalment.amountPence)} ·{" "}
                          {instalment.status.replaceAll("_", " ")}
                          {instalment.dueAt
                            ? ` · Due ${new Date(instalment.dueAt).toLocaleDateString("en-GB")}`
                            : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
      <Dialog
        open={Boolean(invite)}
        onOpenChange={(open) => {
          if (!open && !busy) setInvite(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send registration invitation?</DialogTitle>
            <DialogDescription>
              This email will go to {invite?.name} at {invite?.email}. It links to their own
              registration for {retreat.title}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setInvite(null)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={() => void sendInvite()}>
              {busy ? "Sending…" : "Send email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
