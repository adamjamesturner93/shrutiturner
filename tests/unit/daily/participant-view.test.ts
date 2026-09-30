import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("@/context/auth-context", () => ({ useAuth: () => ({ user: null }) }));
import { ParticipantView } from "@/components/video/video-room";
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
