import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { submitCoachingApplication } from "@/lib/coaching/service";

type CoachingApplicationBody = {
  applicantFirstName?: unknown;
  applicantLastName?: unknown;
  applicantEmail?: unknown;
  tier?: unknown;
  answers?: unknown;
  hasMoveWellMembershipSnapshot?: unknown;
  isExistingCoachingClientSnapshot?: unknown;
  agreedToCoachingAgreement?: unknown;
};

function isTier(value: unknown): value is "coached_plan" | "coaching" | "unsure" {
  return value === "coached_plan" || value === "coaching" || value === "unsure";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as CoachingApplicationBody | null;
  if (!body) {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  if (body.agreedToCoachingAgreement !== true) {
    return NextResponse.json(
      { message: "You must acknowledge the Coaching Agreement." },
      { status: 400 }
    );
  }

  if (!isTier(body.tier)) {
    return NextResponse.json({ message: "Invalid support tier." }, { status: 400 });
  }

  const session = await auth();

  try {
    const application = await submitCoachingApplication({
      userId: session?.user?.id || null,
      applicantFirstName:
        typeof body.applicantFirstName === "string" ? body.applicantFirstName : "",
      applicantLastName: typeof body.applicantLastName === "string" ? body.applicantLastName : "",
      applicantEmail: typeof body.applicantEmail === "string" ? body.applicantEmail : "",
      tier: body.tier,
      answers:
        body.answers && typeof body.answers === "object" && !Array.isArray(body.answers)
          ? (body.answers as Record<string, string>)
          : {},
      hasMoveWellMembershipSnapshot: body.hasMoveWellMembershipSnapshot === true,
      isExistingCoachingClientSnapshot: body.isExistingCoachingClientSnapshot === true,
    });

    return NextResponse.json({ ok: true, id: application.id });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "NAME_REQUIRED" || error.message === "EMAIL_REQUIRED")
    ) {
      return NextResponse.json(
        { message: "Please complete your name and email." },
        { status: 400 }
      );
    }
    console.error("POST /api/coaching/applications failed", error);
    return NextResponse.json({ message: "Failed to submit application." }, { status: 500 });
  }
}
