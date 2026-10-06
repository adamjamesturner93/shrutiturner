import { describe, expect, it } from "vitest";
import {
  allocatePhysicalRooms,
  physicalRoomAvailability,
  type RoomReservation,
} from "@/lib/retreats/physical-inventory";
const rooms = [
  { id: "grey", capacityUnits: 2 },
  { id: "yellow", capacityUnits: 2 },
];
const shared = (id: string, roomUnitId?: string): RoomReservation => ({
  id,
  roomUnitId,
  units: 1,
  wholeRoom: false,
});
const privateRoom = (id: string): RoomReservation => ({ id, units: 2, wholeRoom: true });
describe("physical shared/private inventory", () => {
  it("first shared place leaves one bed but blocks private use of that room", () => {
    expect(physicalRoomAvailability(rooms.slice(0, 1), [shared("a")], false, 1)).toBe(1);
    expect(physicalRoomAvailability(rooms.slice(0, 1), [shared("a")], true, 2)).toBe(0);
  });
  it("second shared place fills the room", () =>
    expect(physicalRoomAvailability(rooms.slice(0, 1), [shared("a"), shared("b")], false, 1)).toBe(
      0
    ));
  it("a private reservation consumes the whole room even for a solo guest", () => {
    expect(
      physicalRoomAvailability(rooms.slice(0, 1), [{ ...privateRoom("a"), units: 1 }], false, 1)
    ).toBe(0);
  });
  it("packs shared holds together to preserve an empty private room", () => {
    const layout = allocatePhysicalRooms(rooms, [shared("a"), shared("b")]);
    expect(layout.assignments.get("a")).toBe(layout.assignments.get("b"));
    expect(physicalRoomAvailability(rooms, [shared("a"), shared("b")], true, 2)).toBe(1);
  });
  it("cannot sell a private room when free beds are split across occupied rooms", () => {
    const held = [shared("a", "grey"), shared("b", "yellow")];
    expect(physicalRoomAvailability(rooms, held, true, 2)).toBe(0);
    expect(physicalRoomAvailability(rooms, held, false, 1)).toBe(2);
  });
  it("reserves whole-room gift holds before packing shared places", () => {
    expect(
      allocatePhysicalRooms(rooms, [shared("a"), privateRoom("gift:b"), shared("c")]).valid
    ).toBe(true);
    expect(
      allocatePhysicalRooms(rooms, [shared("a"), privateRoom("gift:b"), shared("c"), shared("d")])
        .valid
    ).toBe(false);
  });
  it("released reservations restore the corresponding availability", () => {
    expect(physicalRoomAvailability(rooms, [shared("a", "grey")], true, 2)).toBe(1);
    expect(physicalRoomAvailability(rooms, [], true, 2)).toBe(2);
  });
  it("fails closed for a reservation pointing at an unavailable room", () =>
    expect(physicalRoomAvailability(rooms, [shared("a", "removed")], false, 1)).toBe(0));
});
