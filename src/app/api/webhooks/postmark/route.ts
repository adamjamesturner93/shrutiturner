import { NextResponse } from "next/server";
import { ingestPostmarkEvent, verifyPostmarkWebhook } from "@/lib/postmark/webhook-service";

function getSignatureHeader(req: Request) {
  return req.headers.get("x-postmark-signature") || req.headers.get("x-postmark-webhook-signature");
}

export async function POST(req: Request) {
  const secret = process.env.POSTMARK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { message: "POSTMARK_WEBHOOK_SECRET is not configured." },
      { status: 501 }
    );
  }

  const raw = await req.text();
  const signature = getSignatureHeader(req);
  if (!verifyPostmarkWebhook(raw, signature, secret)) {
    return NextResponse.json({ message: "Invalid Postmark webhook signature." }, { status: 401 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
  }

  const events = Array.isArray(parsed) ? parsed : [parsed];
  try {
    for (const event of events) {
      if (!event || typeof event !== "object") continue;
      await ingestPostmarkEvent(event as Record<string, unknown>);
    }
    return NextResponse.json({ ok: true, processed: events.length });
  } catch (error) {
    console.error("POST /api/webhooks/postmark failed", error);
    return NextResponse.json({ message: "Failed to process Postmark webhook." }, { status: 400 });
  }
}
