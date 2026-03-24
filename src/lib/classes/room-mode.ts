export type RoomMode = "live-class" | "small-group" | "retreat";

export function getClassSessionRoomMode(params: {
  classType: string;
  capacity: number;
}): Exclude<RoomMode, "retreat"> {
  return params.classType === "HIIT" || params.capacity <= 8 ? "small-group" : "live-class";
}

export function getDefaultCommunityModeForRoomMode(roomMode: RoomMode) {
  return roomMode !== "live-class";
}

export function resolveSessionCommunityMode(params: {
  classType: string;
  capacity: number;
  communityModeEnabled: boolean;
  communityModeUpdatedAt: Date | null;
}) {
  if (!params.communityModeUpdatedAt) {
    return getDefaultCommunityModeForRoomMode(
      getClassSessionRoomMode({
        classType: params.classType,
        capacity: params.capacity,
      })
    );
  }

  return params.communityModeEnabled;
}
