import { createElement } from "react";
import { renderToReadableStream } from "react-dom/server";
import { expect, it, vi } from "vitest";
const { connection, auth, registration, health } = vi.hoisted(() => ({
  connection: vi.fn(),
  auth: vi.fn(),
  registration: vi.fn(),
  health: vi.fn(),
}));
vi.mock("next/server", () => ({ connection }));
vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/retreats/registration-service", () => ({ getOwnRetreatRegistration: registration }));
vi.mock("@/lib/health/health-service", () => ({ getHealthProfile: health }));
vi.mock("@/views/dashboard/retreat-registration", () => ({
  RetreatRegistration: () => createElement("p", null, "Private attendee setup"),
}));
import Page from "@/app/(app)/dashboard/retreats/registration/[attendeeId]/page";

it("streams an attendee-shaped fallback while request data waits, then renders authorised content", async () => {
  let release: () => void;
  connection.mockReturnValue(
    new Promise<void>((resolve) => {
      release = resolve;
    })
  );
  auth.mockResolvedValue({ user: { id: "participant" } });
  registration.mockResolvedValue({ attendeeId: "attendee" });
  health.mockResolvedValue({});
  const stream = await renderToReadableStream(
    createElement(
      "main",
      null,
      createElement(Page, { params: Promise.resolve({ attendeeId: "attendee" }) })
    )
  );
  const reader = stream.getReader();
  const first = await reader.read();
  expect(new TextDecoder().decode(first.value)).toContain("Loading your attendee setup");
  expect(auth).not.toHaveBeenCalled();
  expect(health).not.toHaveBeenCalled();
  release();
  let rendered = "";
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    rendered += new TextDecoder().decode(chunk.value);
  }
  expect(rendered).toContain("Private attendee setup");
  expect(registration).toHaveBeenCalledWith("participant", "attendee");
  expect(health).toHaveBeenCalledWith("participant");
});

it("shows account recovery without reading health data when registration access is denied", async () => {
  vi.clearAllMocks();
  connection.mockResolvedValue(undefined);
  auth.mockResolvedValue({ user: { id: "purchaser" } });
  registration.mockRejectedValue(new Error("NOT_FOUND"));
  const stream = await renderToReadableStream(
    createElement(Page, { params: Promise.resolve({ attendeeId: "guest-place" }) })
  );
  await stream.allReady;
  const html = await new Response(stream).text();
  expect(html).toContain("Sign in with your invitation email");
  expect(html).toContain("Sign out and continue to registration");
  expect(html).not.toContain("Private attendee setup");
  expect(health).not.toHaveBeenCalled();
});
