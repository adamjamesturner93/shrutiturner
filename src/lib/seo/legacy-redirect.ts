import { NextResponse } from "next/server";

export function redirectLegacyOfferToCoaching(request: Request) {
  return NextResponse.redirect(new URL("/coaching", request.url), 301);
}
