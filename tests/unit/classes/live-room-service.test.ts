import { describe, expect, it } from "vitest";
import {
  buildSessionParticipantPermissions,
  getEffectiveSessionCommunityMode,
} from "@/lib/classes/live-room-service";

describe("live room permissions", () => {
  it("keeps live classes in focus mode for members unless explicitly changed", () => {
    const result = buildSessionParticipantPermissions({
      typeSnapshot: "Strength",
      capacity: 12,
      communityModeEnabled: false,
      communityModeUpdatedAt: null,
      isModerator: false,
      moderatorUserIds: ["instructor-1"],
    });

    expect(result.roomMode).toBe("live-class");
    expect(result.effectiveCommunityMode).toBe(false);
    expect(result.permissions).toEqual({
      hasPresence: true,
      canSend: ["audio", "video"],
      canReceive: {
        base: ["audio"],
        byUserId: {
          "instructor-1": true,
        },
      },
      canAdmin: false,
    });
  });

  it("defaults small-group sessions to community mode until an instructor explicitly changes them", () => {
    const result = buildSessionParticipantPermissions({
      typeSnapshot: "Yoga",
      capacity: 6,
      communityModeEnabled: false,
      communityModeUpdatedAt: null,
      isModerator: false,
      moderatorUserIds: ["instructor-1"],
    });

    expect(result.roomMode).toBe("small-group");
    expect(result.effectiveCommunityMode).toBe(true);
    expect(result.permissions).toEqual({
      hasPresence: true,
      canSend: ["audio", "video"],
      canReceive: {
        base: true,
      },
      canAdmin: false,
    });
  });

  it("respects an explicit focus-mode toggle on small-group sessions", () => {
    const updatedAt = new Date("2026-03-22T10:00:00.000Z");

    expect(
      getEffectiveSessionCommunityMode({
        typeSnapshot: "Yoga",
        capacity: 6,
        communityModeEnabled: false,
        communityModeUpdatedAt: updatedAt,
      })
    ).toBe(false);
  });

  it("always gives moderators full room permissions", () => {
    const result = buildSessionParticipantPermissions({
      typeSnapshot: "Strength",
      capacity: 12,
      communityModeEnabled: false,
      communityModeUpdatedAt: null,
      isModerator: true,
      moderatorUserIds: ["instructor-1"],
    });

    expect(result.permissions).toEqual({
      hasPresence: true,
      canSend: true,
      canReceive: {
        base: true,
      },
      canAdmin: ["participants"],
    });
  });
});
