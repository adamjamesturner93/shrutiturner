import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("@/context/auth-context", () => ({ useAuth: () => ({ user: null }) }));
import { InstructorView, ParticipantView } from "@/components/video/video-room";
import { PreJoinLobby } from "@/components/video/pre-join-lobby";
const self = {
  id: "self",
  userId: "adam",
  name: "Adam Turner",
  initials: "AT",
  isLocal: true,
  isInstructor: false,
  isMuted: true,
  isCameraOn: false,
  audioTrack: null,
  videoTrack: null,
};
const host = {
  ...self,
  id: "host",
  userId: "shruti",
  name: "Shruti",
  isLocal: false,
  isInstructor: true,
};
describe("participant workshop presentation", () => {
  for (const communityMode of [true, false]) {
    it(`waits for an instructor and respects hidden self (community=${communityMode})`, () => {
      const html = renderToStaticMarkup(
        createElement(ParticipantView, {
          instructor: null,
          selfParticipant: self,
          participants: [],
          showSelfView: false,
          communityMode,
        })
      );
      expect(html).toContain("Waiting for the instructor");
      expect(html).not.toContain("Adam Turner");
    });
    it(`shows self only once when waiting and transitions to the host (community=${communityMode})`, () => {
      const props = { selfParticipant: self, participants: [], showSelfView: true, communityMode };
      const waiting = renderToStaticMarkup(
        createElement(ParticipantView, { ...props, instructor: null })
      );
      expect(waiting.match(/Adam Turner/g)).toHaveLength(1);
      const joined = renderToStaticMarkup(
        createElement(ParticipantView, { ...props, instructor: host, showSelfView: false })
      );
      expect(joined).toContain("Shruti");
      expect(joined).not.toContain("Waiting for the instructor");
      expect(joined).not.toContain("Adam Turner");
    });
  }
  it("keeps the participant lobby free of technical mode and level descriptions", () => {
    const html = renderToStaticMarkup(
      createElement(PreJoinLobby, {
        className: "The Middle Ground",
        classTime: "17:35",
        classDuration: "1 hr 55",
        classLevel: "Accessible options provided",
        instructor: "Shruti",
        equipment: ["Water"],
        registeredCount: 2,
        maxSpaces: 30,
        mode: "retreat",
        onJoin: () => {},
        onBack: () => {},
      })
    );
    expect(html).not.toMatch(/Starts in|Community mode|View mode|Accessible options provided/);
    expect(html).toContain("Join workshop");
  });
});

describe("instructor participant gallery", () => {
  it("shows four attendees in equal tiles and marks raised hands", () => {
    const html = renderToStaticMarkup(
      createElement(InstructorView, {
        instructor: host,
        participants: [1, 2, 3, 4].map((id) => ({
          ...self,
          id: String(id),
          userId: String(id),
          name: `Guest ${id}`,
          isLocal: false,
        })),
        raisedHands: [{ userId: "2", name: "Guest 2" }],
        communityMode: false,
        considerations: [],
        onMute: () => {},
        onRemove: () => {},
      })
    );
    expect(html).toContain('aria-label="Workshop participants"');
    expect(html).toContain("sm:grid-cols-2");
    expect(html).toContain('aria-label="Hand raised"');
    for (const id of [1, 2, 3, 4]) expect(html).toContain(`Guest ${id}`);
  });
  it("hides only the instructor preview when self-view is hidden", () => {
    const html = renderToStaticMarkup(
      createElement(InstructorView, {
        instructor: null,
        participants: [self],
        communityMode: false,
        considerations: [],
        onMute: () => {},
        onRemove: () => {},
      })
    );
    expect(html).not.toContain("Shruti");
    expect(html).toContain("Adam Turner");
  });
});
