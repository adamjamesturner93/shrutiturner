export type PhysicalRoom = { id: string; capacityUnits: number };
export type RoomReservation = {
  id: string;
  roomUnitId?: string | null;
  units: number;
  wholeRoom: boolean;
};

// Fixed assignments are preserved. Unassigned reservations are packed so an empty
// room remains available for a private purchase whenever possible.
export function allocatePhysicalRooms(rooms: PhysicalRoom[], reservations: RoomReservation[]) {
  const remaining = new Map(rooms.map((room) => [room.id, room.capacityUnits]));
  const assignments = new Map<string, string>();
  const ordered = [...reservations].sort(
    (a, b) =>
      Number(Boolean(b.roomUnitId)) - Number(Boolean(a.roomUnitId)) ||
      Number(b.wholeRoom) - Number(a.wholeRoom) ||
      b.units - a.units ||
      a.id.localeCompare(b.id)
  );
  for (const reservation of ordered) {
    const candidates = rooms.filter(
      (room) =>
        (!reservation.roomUnitId || room.id === reservation.roomUnitId) &&
        (reservation.wholeRoom
          ? remaining.get(room.id) === room.capacityUnits
          : (remaining.get(room.id) || 0) >= reservation.units)
    );
    candidates.sort(
      (a, b) => (remaining.get(a.id) || 0) - (remaining.get(b.id) || 0) || a.id.localeCompare(b.id)
    );
    const room = candidates[0];
    if (!room) return { valid: false, remaining, assignments };
    remaining.set(
      room.id,
      (remaining.get(room.id) || 0) -
        (reservation.wholeRoom ? room.capacityUnits : reservation.units)
    );
    assignments.set(reservation.id, room.id);
  }
  return { valid: true, remaining, assignments };
}

export function physicalRoomAvailability(
  rooms: PhysicalRoom[],
  reservations: RoomReservation[],
  wholeRoom: boolean,
  units: number
) {
  const layout = allocatePhysicalRooms(rooms, reservations);
  if (!layout.valid) return 0;
  return rooms.reduce(
    (sum, room) =>
      sum +
      (wholeRoom
        ? Number(layout.remaining.get(room.id) === room.capacityUnits)
        : Math.floor((layout.remaining.get(room.id) || 0) / Math.max(1, units))),
    0
  );
}
