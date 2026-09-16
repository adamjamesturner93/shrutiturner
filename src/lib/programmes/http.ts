import { NextResponse } from "next/server";
import { ZodError } from "zod";
export function programmeError(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      { message: error.issues.map((issue) => issue.message).join("; ") },
      { status: 400 }
    );
  const raw = error instanceof Error ? error.message : "";
  const known = /^[A-Z][A-Z0-9_]+$/.test(raw) || raw.startsWith("EXERCISE_WITHOUT_DEMONSTRATION:");
  const message = known ? raw : "Unable to complete the request. Please try again.";
  const status = !known
    ? 500
    : message === "UNAUTHORIZED"
      ? 401
      : message === "NOT_FOUND"
        ? 404
        : [
              "FORBIDDEN",
              "ACCESS_ENDED",
              "EXERCISE_CLEARANCE_REQUIRED",
              "COMMUNITY_NOT_OPEN",
              "NOT_RELEASED",
              "LIVE_NOT_OPEN",
            ].includes(message)
          ? 403
          : 400;
  return NextResponse.json(
    { message },
    { status, headers: { "Cache-Control": "private, no-store" } }
  );
}
