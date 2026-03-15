import { NextResponse } from "next/server";
import {
  unsubscribeMarketingEmailByAddress,
  unsubscribeMarketingEmailByToken,
} from "@/lib/newsletter/subscriber-service";

type UnsubscribeBody = {
  email?: unknown;
  token?: unknown;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as UnsubscribeBody | null;
  if (!body) {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  try {
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (token) {
      const unsubscribedEmail = await unsubscribeMarketingEmailByToken(token);
      return NextResponse.json({ ok: true, email: unsubscribedEmail });
    }

    if (email) {
      const unsubscribedEmail = await unsubscribeMarketingEmailByAddress(email);
      return NextResponse.json({ ok: true, email: unsubscribedEmail });
    }

    return NextResponse.json(
      { message: "Provide an email address or unsubscribe token." },
      { status: 400 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "INVALID_TOKEN" || error.message === "INVALID_EMAIL")
    ) {
      return NextResponse.json({ message: "Invalid unsubscribe request." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json(
        { message: "We couldn't find a matching subscriber." },
        { status: 404 }
      );
    }
    console.error("POST /api/unsubscribe failed", error);
    return NextResponse.json({ message: "Failed to update subscription." }, { status: 500 });
  }
}
