import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeClient } from "@/lib/billing/stripe-client";
import { processStripeWebhookEvent } from "@/lib/billing/billing-service";

function getSignature(request: Request) {
  return request.headers.get("stripe-signature") || "";
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ message: "Stripe webhook secret not configured." }, { status: 501 });
  }

  try {
    const payload = await request.text();
    const signature = getSignature(request);

    const stripe = getStripeClient();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    await processStripeWebhookEvent(event as Stripe.Event);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/webhooks/stripe failed", error);
    return NextResponse.json({ message: "Webhook processing failed." }, { status: 400 });
  }
}
