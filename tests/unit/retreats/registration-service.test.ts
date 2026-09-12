import { beforeEach, describe, expect, it, vi } from "vitest";
const db = {
  user: { findUnique: vi.fn() },
  retreatAttendee: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    findMany: vi.fn(),
  },
  emailDelivery: { findMany: vi.fn() },
};
const setup = vi.fn();
const send = vi.fn();
vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/lib/retreats/workshop-setup", () => ({ getWorkshopSetupState: setup }));
vi.mock("@/lib/postmark/client", () => ({ sendPostmarkReactEmail: send }));
const {
  getAttendeeReadiness,
  getOwnRetreatRegistration,
  saveOwnRetreatRegistration,
  sendRetreatRegistrationInvitation,
  inviteRetreatBookingAttendees,
  getAdminRegistrationRows,
} = await import("@/lib/retreats/registration-service");
const attendee = {
  id: "guest-2",
  bookingId: "booking-1",
  userId: null,
  email: "sam@example.com",
  firstName: "Sam",
  lastName: "Lee",
  status: "pending_claim",
  isPrimary: false,
  claimedAt: null,
  practicalConfirmedAt: null,
  booking: {
    id: "booking-1",
    retreatDateId: "date-1",
    bookingStatus: "balance_due",
    purchaserEmail: "buyer@example.com",
    totalPricePence: 91000,
    retreatDate: {
      retreatTitleSnapshot: "Retreat",
      retreatType: "in_person",
      timezone: "Europe/London",
      status: "open",
      startsAt: new Date("2030-09-18"),
      endsAt: new Date("2030-09-20"),
    },
  },
};
beforeEach(() => {
  vi.clearAllMocks();
  db.user.findUnique.mockResolvedValue({
    email: "sam@example.com",
    emailVerified: new Date(),
    deletedAt: null,
  });
  db.retreatAttendee.findFirst.mockResolvedValue(attendee);
  db.retreatAttendee.findUnique.mockResolvedValue(attendee);
  db.retreatAttendee.updateMany.mockResolvedValue({ count: 1 });
  setup.mockResolvedValue({
    complete: true,
    missing: [],
    profile: { firstName: "Sam", lastName: "Lee", email: "sam@example.com", dob: "1990-01-01" },
  });
});
describe("individual registration", () => {
  it("rejects saving when the attendee email changed after authorisation", async () => {
    db.retreatAttendee.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      saveOwnRetreatRegistration("sam", "guest-2", {
        phone: "123",
        emergencyContactName: "Pat",
        emergencyContactPhone: "456",
        confirmed: true,
      })
    ).rejects.toThrow("NOT_FOUND");
  });
  it("does not equate account linking with residential registration", async () => {
    expect(await getAttendeeReadiness({ ...attendee, userId: "sam" }, true)).toEqual({
      complete: false,
      missing: ["practical_details"],
    });
    expect(
      await getAttendeeReadiness(
        { ...attendee, userId: "sam", practicalConfirmedAt: new Date() },
        true
      )
    ).toEqual({ complete: true, missing: [] });
  });
  it("keeps workshop requirements separate from residential practical details", async () => {
    expect(await getAttendeeReadiness({ ...attendee, userId: "sam" }, false)).toEqual({
      complete: true,
      missing: [],
    });
    setup.mockResolvedValue({ complete: false, missing: ["health_waiver"] });
    expect(
      (
        await getAttendeeReadiness(
          { ...attendee, userId: "sam", practicalConfirmedAt: new Date() },
          true
        )
      ).complete
    ).toBe(false);
  });
  it("authorises only a linked attendee or matching verified email and omits financial/purchaser details", async () => {
    const result = await getOwnRetreatRegistration("sam", "guest-2");
    expect(db.retreatAttendee.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "guest-2",
          OR: [
            { userId: "sam" },
            { userId: null, email: { equals: "sam@example.com", mode: "insensitive" } },
          ],
        }),
      })
    );
    expect(result).not.toHaveProperty("totalPricePence");
    expect(result).not.toHaveProperty("purchaserEmail");
    expect(result).not.toHaveProperty("booking");
  });
  it("rejects unverified users and cancelled bookings", async () => {
    db.user.findUnique.mockResolvedValue({ email: "sam@example.com", emailVerified: null });
    await expect(getOwnRetreatRegistration("sam", "guest-2")).rejects.toThrow("NOT_FOUND");
    expect(db.retreatAttendee.findFirst).not.toHaveBeenCalled();
    db.user.findUnique.mockResolvedValue({ email: "sam@example.com", emailVerified: new Date() });
    db.retreatAttendee.findFirst.mockResolvedValue({
      ...attendee,
      booking: { ...attendee.booking, bookingStatus: "cancelled" },
    });
    await expect(getOwnRetreatRegistration("sam", "guest-2")).rejects.toThrow("NOT_FOUND");
  });
  it("requires personal confirmation and contact details", async () => {
    await expect(saveOwnRetreatRegistration("sam", "guest-2", { confirmed: true })).rejects.toThrow(
      "INVALID_REGISTRATION"
    );
    expect(db.retreatAttendee.update).not.toHaveBeenCalled();
    await saveOwnRetreatRegistration("sam", "guest-2", {
      phone: "123",
      emergencyContactName: "Pat",
      emergencyContactPhone: "456",
      confirmed: true,
      userId: "buyer",
      bookingStatus: "paid_in_full",
    });
    expect(db.retreatAttendee.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        id: "guest-2",
        OR: [
          { userId: "sam" },
          { userId: null, email: { equals: "sam@example.com", mode: "insensitive" } },
        ],
      }),
      data: expect.objectContaining({
        userId: "sam",
        practicalConfirmedAt: expect.any(Date),
        status: "claimed",
      }),
    });
    expect(db.retreatAttendee.updateMany.mock.calls[0][0].data).not.toHaveProperty("bookingStatus");
  });
});
describe("registration invitations", () => {
  it("sends only for a confirmed booking and records delivery metadata", async () => {
    await sendRetreatRegistrationInvitation("guest-2", { retreatDateId: "date-1" });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "sam@example.com",
        templateKey: "retreat-registration",
        metadata: { attendeeId: "guest-2", bookingId: "booking-1", retreatDateId: "date-1" },
      })
    );
  });
  it.each(["pending", "cancelled", "refunded"])(
    "does not invite %s bookings",
    async (bookingStatus) => {
      db.retreatAttendee.findUnique.mockResolvedValue({
        ...attendee,
        booking: { ...attendee.booking, bookingStatus },
      });
      await expect(sendRetreatRegistrationInvitation("guest-2")).rejects.toThrow("NOT_FOUND");
      expect(send).not.toHaveBeenCalled();
    }
  );
  it("checks the admin route's date and throttles repeated sends", async () => {
    await expect(
      sendRetreatRegistrationInvitation("guest-2", { retreatDateId: "other-date" })
    ).rejects.toThrow("NOT_FOUND");
    db.retreatAttendee.updateMany.mockResolvedValue({ count: 0 });
    expect(await sendRetreatRegistrationInvitation("guest-2")).toEqual({ skipped: true });
    expect(send).not.toHaveBeenCalled();
  });
  it("does not resend automatic invitations after the first request", async () => {
    db.retreatAttendee.findMany.mockResolvedValue([{ id: "guest-2" }]);
    await inviteRetreatBookingAttendees("booking-1");
    expect(db.retreatAttendee.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "guest-2", invitationQueuedAt: null } })
    );
  });
  it("includes each attendee and only their own invitation history", async () => {
    db.retreatAttendee.findMany.mockResolvedValue([attendee]);
    db.emailDelivery.findMany.mockResolvedValue([
      {
        id: "delivery",
        toEmail: "sam@example.com",
        status: "sent",
        createdAt: new Date(),
        sentAt: new Date(),
        metadataJson: { attendeeId: "guest-2" },
      },
      { id: "other", createdAt: new Date(), metadataJson: { attendeeId: "other-guest" } },
    ]);
    const rows = await getAdminRegistrationRows("date-1");
    expect(rows[0]).toMatchObject({ name: "Sam Lee", complete: false });
    expect(rows[0].invitations).toHaveLength(1);
  });
});
